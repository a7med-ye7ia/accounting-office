import json
import re
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

from app.core.config import settings
from app.core.gpu import release_memory


P2_SYSTEM_PROMPT = """\
أنت نظام استخراج بيانات هيكلية من عقود قانونية مصرية.

قواعد صارمة:
- انسخ النص العربي حرفياً كما هو. لا تغير حرفاً واحداً.
- لا تصحح، لا تعيد صياغة، لا تترجم، لا تختصر.
- أرجع JSON صحيح فقط. بدون markdown. بدون شرح. بدون مفاتيح إضافية.
- إذا لم يُذكر الحقل في النص، اتركه سلسلة فارغة "".
- إذا امتدت مادة عبر حدود الصفحة، اضبط "partial": true لتلك المادة.
- استخرج جميع المواد الموجودة في النص. لا تتوقف عند أول مادة."""


def build_extraction_messages(chunk_id: str, page_start: int, page_end: int, ocr_text: str) -> str:
    article_matches = re.findall(
        r"المادة\s*\(?[٠-٩\d]+\)?|\([٠-٩\d]+\)\s*المادة|###\s*\([٠-٩\d]+\)",
        ocr_text,
    )
    article_count_hint = len(article_matches) if article_matches else "عدة"
    return f"""\
النص التالي هو نص OCR نظيف من عقد قانوني مصري. مهمتك هي تصنيف وتنظيم البيانات فقط — لا تعديل النصوص.

تلميحات تحديد الحقول:
- اسم الشركة: غالباً في المواد ١–٣
- رأس المال: غالباً في المادة ٥ أو ٦
- العنوان: غالباً في المادة ٣ أو ٤ أو ٥
- رقم السجل التجاري: بالقرب من بنود التسجيل
- رقم القانون وسنته: في المراجع القانونية التمهيدية
- مدة الشركة: في المادة التي تذكر الأجل
- نوع الشركة: في نفس مادة الاسم
- نشاط الشركة: في مواد الغرض أو النطاق

تعليمات المواد (articles) — مهمة جداً:
- يوجد في هذا النص {article_count_hint} مادة على الأقل. استخرجها جميعاً.
- انسخ رقم كل مادة في "id" وانسخ نصها الكامل حرفياً في "value" — لا تحذف ولا تختصر.
- لا تتوقف بعد أول مادة. تابع حتى النهاية.

الشكل المطلوب بالضبط:
{{
  "chunk_id": "{chunk_id}",
  "page_start": {page_start},
  "page_end": {page_end},
  "company_name": "انسخ النص كما هو",
  "company_address": "انسخ النص كما هو",
  "company_type": "انسخ النص كما هو",
  "law_reference": {{"law_number": "انسخ كما هو", "law_year": "السنة فقط"}},
  "company_capital": "انسخ النص كما هو",
  "commercial_register_number": "انسخ كما هو",
  "approval_date": "انسخ كما هو",
  "real_estate_registry_minutes_number": "انسخ كما هو",
  "company_duration": "انسخ كما هو",
  "company_activity": "انسخ كما هو",
  "articles": [
    {{"id": "رقم المادة", "value": "نص المادة كاملاً حرفياً", "partial": false}}
  ]
}}

نص OCR (chunk {chunk_id}، الصفحات {page_start}–{page_end}):
{ocr_text}

أرجع JSON المكتمل فقط. انسخ جميع النصوص حرفياً بدون أي تعديل."""


def build_chunks(pages: list[dict], chunk_size: int = 2) -> list[dict]:
    non_empty = [page for page in pages if str(page.get("text", "")).strip()]
    if not non_empty:
        return []
    if len(non_empty) == 1:
        page = non_empty[0]
        return [{
            "chunk_id": f"chunk_p{page['page']:03d}_p{page['page']:03d}",
            "page_start": page["page"],
            "page_end": page["page"],
            "ocr_text": f"page {page['page']}\n{page['text']}",
        }]

    chunks = []
    for index in range(len(non_empty) - chunk_size + 1):
        group = non_empty[index : index + chunk_size]
        page_start = group[0]["page"]
        page_end = group[-1]["page"]
        chunks.append({
            "chunk_id": f"chunk_p{page_start:03d}_p{page_end:03d}",
            "page_start": page_start,
            "page_end": page_end,
            "ocr_text": "\n\n".join(f"page {p['page']}\n{p['text']}" for p in group),
        })
    return chunks


def _trim_ocr_text(tokenizer, ocr_text: str) -> str:
    ocr_ids = tokenizer(ocr_text, return_tensors="pt")["input_ids"]
    if ocr_ids.shape[-1] <= settings.qwen_max_input_tokens:
        return ocr_text
    keep_start = int(settings.qwen_max_input_tokens * 0.6)
    keep_end = settings.qwen_max_input_tokens - keep_start
    trimmed_ids = torch.cat([ocr_ids[0, :keep_start], ocr_ids[0, -keep_end:]], dim=0)
    return tokenizer.decode(trimmed_ids, skip_special_tokens=True)


def _parse_json_output(raw_output: str) -> dict | None:
    raw_output = re.sub(r"<think>.*?</think>", "", raw_output, flags=re.DOTALL).strip()
    raw_output = re.sub(r"^```(?:json)?", "", raw_output).strip()
    raw_output = re.sub(r"```$", "", raw_output).strip()
    try:
        return json.loads(raw_output)
    except json.JSONDecodeError:
        last_brace = raw_output.rfind("}")
        if last_brace != -1:
            try:
                return json.loads(raw_output[: last_brace + 1])
            except json.JSONDecodeError:
                return None
    return None


def _run_chunk(tokenizer, model, device, chunk: dict) -> dict | None:
    ocr_text = _trim_ocr_text(tokenizer, chunk["ocr_text"])
    messages = [
        {"role": "system", "content": P2_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": build_extraction_messages(
                chunk_id=chunk["chunk_id"],
                page_start=chunk["page_start"],
                page_end=chunk["page_end"],
                ocr_text=ocr_text,
            ),
        },
    ]
    input_text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
        enable_thinking=False,
    )
    forced_prefix = (
        "{\n"
        f'  "chunk_id": "{chunk["chunk_id"]}",\n'
        f'  "page_start": {chunk["page_start"]},\n'
        f'  "page_end": {chunk["page_end"]},'
    )
    inputs = tokenizer(input_text + forced_prefix, return_tensors="pt").to(device)
    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=settings.qwen_max_new_tokens,
            do_sample=False,
            repetition_penalty=1.15,
            pad_token_id=tokenizer.pad_token_id,
        )
    generated = tokenizer.decode(output_ids[0, inputs["input_ids"].shape[-1] :], skip_special_tokens=True).strip()
    return _parse_json_output(forced_prefix + "\n" + generated)


def run_extraction_phase(pages: list[dict], output_dir: Path) -> list[dict]:
    """Load Qwen in 4-bit, extract structured chunk JSON, then fully release the model."""
    output_dir.mkdir(parents=True, exist_ok=True)
    tokenizer = None
    model = None

    try:
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )
        tokenizer = AutoTokenizer.from_pretrained(settings.qwen_model_id, trust_remote_code=True)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        model = AutoModelForCausalLM.from_pretrained(
            settings.qwen_model_id,
            device_map="auto",
            quantization_config=bnb_config,
            trust_remote_code=True,
        )
        model.eval()
        device = next(model.parameters()).device

        results = []
        for chunk in build_chunks(pages):
            result = _run_chunk(tokenizer, model, device, chunk)
            chunk_dir = output_dir / chunk["chunk_id"]
            chunk_dir.mkdir(parents=True, exist_ok=True)
            if result is None:
                (chunk_dir / "extraction_raw_failed.txt").write_text("JSON parse failed", encoding="utf-8")
                continue
            (chunk_dir / "extraction.json").write_text(
                json.dumps(result, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            results.append(result)
        return results
    finally:
        del model
        del tokenizer
        release_memory()
