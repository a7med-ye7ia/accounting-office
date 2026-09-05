import html
import re
import unicodedata
from pathlib import Path

import torch
from PIL import Image
from transformers import AutoModelForImageTextToText, AutoProcessor, StoppingCriteria, StoppingCriteriaList

from app.core.config import settings
from app.core.gpu import release_memory
from app.pipeline.preprocessing import preprocess_image, screen_image_for_text

TOKEN_BASE = 1500
TOKEN_SCALE = 250
TOKEN_MAX = 3120
TOKEN_MIN = 512

CUSTOM_PROMPT = (
    "Read this page from an Egyptian legal contract and extract all text verbatim.\n\n"
    "Rules:\n"
    "- Copy every Arabic word exactly as it appears. No corrections, no paraphrasing.\n"
    "- Preserve article numbering exactly as shown.\n"
    "- Never skip or omit any text.\n"
    "- Articles start with 'مادة' or 'المادة' followed by a number.\n"
    "- If an article ends mid-page, copy it to the very last word on the page.\n"
    "- Output plain text only. No HTML tags, no markdown formatting, no tables."
)


class ChandraRepetitionCriteria(StoppingCriteria):
    def __init__(self, prompt_len: int, check_every: int = 10):
        self.prompt_len = prompt_len
        self.check_every = check_every
        self.calls = 0

    def __call__(self, input_ids, scores, **kwargs) -> bool:
        self.calls += 1
        if self.calls % self.check_every != 0:
            return False
        new_ids = input_ids[0, self.prompt_len :].tolist()
        return _has_ngram_repeat(new_ids, n=10, max_repeats=4)


def _has_ngram_repeat(token_ids: list[int], n: int = 10, max_repeats: int = 4) -> bool:
    if len(token_ids) < n * max_repeats or len(token_ids) < 150:
        return False
    tail = token_ids[-(n * (max_repeats + 3)) :]
    for index in range(len(tail) - n):
        gram = tuple(tail[index : index + n])
        count = 1
        for next_index in range(index + n, len(tail) - n + 1, n):
            if tuple(tail[next_index : next_index + n]) == gram:
                count += 1
            else:
                break
        if count >= max_repeats:
            return True
    return False


def _stopping_criteria(prompt_len: int) -> StoppingCriteriaList:
    return StoppingCriteriaList([ChandraRepetitionCriteria(prompt_len=prompt_len)])


def _strip_html_tags(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def clean_ocr_markdown(markdown: str) -> str:
    if not markdown:
        return ""
    text = re.sub(
        r"</?(?:html|body|div|span|p|table|tbody|thead|tr|td|th|br|hr|figure|figcaption)[^>]*>",
        "\n",
        markdown,
        flags=re.I,
    )
    text = re.sub(r"<[^>\n]{1,200}>", " ", text)
    text = html.unescape(text)
    text = unicodedata.normalize("NFC", text)
    text = re.sub(r"```+", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _estimate_max_tokens(pil_img: Image.Image) -> int:
    megapixels = (pil_img.width * pil_img.height) / 1_000_000
    estimated = int(megapixels * TOKEN_SCALE) + TOKEN_BASE
    return max(TOKEN_MIN, min(estimated, min(TOKEN_MAX, settings.ocr_max_new_tokens)))


def _scale_to_fit(img: Image.Image) -> Image.Image:
    try:
        from chandra.model.util import scale_to_fit

        return scale_to_fit(img)
    except Exception:
        return img


def _run_batch(model, processor, device, images: list[Image.Image]) -> list[str]:
    max_new_tokens = max(_estimate_max_tokens(img) for img in images)
    conversations = [
        [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": _scale_to_fit(img)},
                    {"type": "text", "text": CUSTOM_PROMPT},
                ],
            }
        ]
        for img in images
    ]
    tokenized = processor.apply_chat_template(
        conversations,
        tokenize=True,
        add_generation_prompt=True,
        return_dict=True,
        return_tensors="pt",
        padding=True,
    )
    prompt_len = tokenized["input_ids"].shape[1]
    inputs = tokenized.to(device)

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            stopping_criteria=_stopping_criteria(prompt_len),
        )

    texts = []
    for index in range(len(images)):
        new_tokens = output_ids[index, prompt_len:]
        text = processor.tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
        texts.append(clean_ocr_markdown(_strip_html_tags(text)))
    return texts


def run_ocr_phase(image_paths: list[Path], output_dir: Path) -> list[dict]:
    """Load Chandra, OCR all pages, persist per-page text, then fully release the model."""
    output_dir.mkdir(parents=True, exist_ok=True)
    processor = None
    model = None
    pages: list[dict] = []

    try:
        processor = AutoProcessor.from_pretrained(settings.ocr_model_id, trust_remote_code=True)
        processor.tokenizer.padding_side = "left"
        model = AutoModelForImageTextToText.from_pretrained(
            settings.ocr_model_id,
            torch_dtype=torch.float16,
            device_map="cuda:0",
            attn_implementation=settings.ocr_attention_implementation,
            low_cpu_mem_usage=True,
            trust_remote_code=True,
        )
        model.eval()
        model.processor = processor
        model.generation_config.do_sample = False
        model.generation_config.temperature = 0.0
        model.generation_config.top_p = 0.8
        model.generation_config.top_k = 50
        model.generation_config.repetition_penalty = 1.1
        model.generation_config.no_repeat_ngram_size = 6
        model.generation_config.renormalize_logits = True
        device = next(model.parameters()).device

        batch_images: list[Image.Image] = []
        batch_meta: list[tuple[int, Path]] = []

        def flush_batch() -> None:
            if not batch_images:
                return
            texts = _run_batch(model, processor, device, batch_images)
            for (page_number, image_path), text in zip(batch_meta, texts, strict=True):
                page_path = output_dir / f"page_{page_number:03d}.md"
                page_path.write_text(text, encoding="utf-8")
                pages.append({"page": page_number, "image_path": str(image_path), "text": text})
            batch_images.clear()
            batch_meta.clear()

        for page_number, image_path in enumerate(image_paths, start=1):
            image = preprocess_image(image_path)
            has_text, metrics = screen_image_for_text(image)
            if not has_text:
                text = ""
                (output_dir / f"page_{page_number:03d}.md").write_text(text, encoding="utf-8")
                pages.append({"page": page_number, "image_path": str(image_path), "text": text, "metrics": metrics})
                continue
            batch_images.append(image)
            batch_meta.append((page_number, image_path))
            if len(batch_images) >= settings.ocr_batch_size:
                flush_batch()

        flush_batch()
        return pages
    finally:
        del model
        del processor
        release_memory()
