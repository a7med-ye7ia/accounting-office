import json
import re
import unicodedata
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path

try:
    from rapidfuzz import fuzz

    def sim_ratio(a: str, b: str) -> float:
        return fuzz.ratio(a, b) / 100.0

except ImportError:

    def sim_ratio(a: str, b: str) -> float:
        return SequenceMatcher(None, a, b).ratio()


MATCH_MARGIN = 0.05
NOISE_BLOCK_THRESHOLD = 20
LENGTH_TOLERANCE = 0.30
DIFF_BLOCK_THRESHOLD = 25

FIELD_KEYS = [
    "company_name",
    "company_address",
    "company_type",
    "company_capital",
    "commercial_register_number",
    "approval_date",
    "real_estate_registry_minutes_number",
    "company_duration",
    "company_activity",
]

PARTNER_TABLE_KEYWORDS = [
    "وقد تم توزيع",
    "توزيع هذه الحصص",
    "الحصص بين الشركاء",
    "رأس المال",
]

AR_DIACRITICS = re.compile(r"[\u0617-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]")
ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
NUM_PATTERN = re.compile(r"[0-9٠-٩]+(?:[.,][0-9٠-٩]+)?\s*%?")


def normalize_digits(text: str) -> str:
    return text.translate(ARABIC_DIGITS)


def normalize_arabic(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text)
    text = AR_DIACRITICS.sub("", text)
    text = text.replace("ـ", "")
    text = re.sub(r"[إأآا]", "ا", text)
    text = re.sub(r"[ؤئ]", "و", text)
    text = text.replace("ى", "ي")
    text = re.sub(r"\s*:-?\s*", ": ", text)
    text = re.sub(r"\s*::\s*", ": ", text)
    return re.sub(r"\s+", " ", text).strip()


def _is_table_row(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    digit_chars = sum(1 for char in stripped if char.isdigit() or char in "٠١٢٣٤٥٦٧٨٩%.,|")
    return digit_chars / max(len(stripped), 1) >= 0.40


def strip_partner_table(text: str) -> str:
    if not any(keyword in text for keyword in PARTNER_TABLE_KEYWORDS):
        return text
    kept = []
    removed_any = False
    for line in text.splitlines():
        if _is_table_row(line):
            kept.append("{{PARTNER_ROW}}")
            removed_any = True
        else:
            kept.append(line)
    if not removed_any:
        return text
    out = []
    prev_marker = False
    for line in kept:
        if line == "{{PARTNER_ROW}}":
            if not prev_marker:
                out.append("{{PARTNER_TABLE}}")
            prev_marker = True
        else:
            out.append(line)
            prev_marker = False
    return "\n".join(out)


def _field_variants(key: str, raw_val) -> list[str]:
    if raw_val is None:
        return []
    val = str(raw_val).strip()
    if not val or len(val) < 3:
        return []
    variants = [val]
    if key == "company_name":
        for prefix in ("شركة ", "شركه "):
            if val.startswith(prefix):
                variants.append(val[len(prefix) :].strip())
                break
        parts = val.split()
        if len(parts) > 1:
            variants.append(" ".join(parts[1:]).strip())
    if key == "company_duration":
        stripped = re.sub(r"\(\s*", "", re.sub(r"\s*\)", "", val)).strip()
        if stripped != val:
            variants.append(stripped)
        if "(" not in val:
            parts = val.split(None, 1)
            if parts:
                variants.append(f"( {parts[0]} )" + (" " + parts[1] if len(parts) > 1 else ""))

    seen = set()
    unique = []
    for variant in variants:
        if variant and variant not in seen:
            seen.add(variant)
            unique.append(variant)
    return unique


def mask_article(raw_text: str, field_values: dict) -> tuple[str, str, list]:
    text = strip_partner_table(raw_text)
    occupied = [False] * len(text)
    spans = []
    candidates = []
    for key in FIELD_KEYS:
        for variant in _field_variants(key, field_values.get(key)):
            candidates.append((key, variant))
    law_ref = field_values.get("law_reference") or {}
    for sub in ("law_number", "law_year"):
        for variant in _field_variants(sub, law_ref.get(sub)):
            candidates.append((sub, variant))
    candidates.sort(key=lambda pair: -len(pair[1]))

    for key, value in candidates:
        start = 0
        while True:
            index = text.find(value, start)
            if index == -1:
                break
            if not any(occupied[index : index + len(value)]):
                spans.append((index, index + len(value), {"type": "field", "name": key}))
                for pos in range(index, index + len(value)):
                    occupied[pos] = True
            start = index + len(value)

    for match in NUM_PATTERN.finditer(text):
        start, end = match.start(), match.end()
        if not any(occupied[start:end]):
            spans.append((start, end, {"type": "num"}))
            for pos in range(start, end):
                occupied[pos] = True

    spans.sort(key=lambda item: item[0])
    out = []
    slots = []
    cursor = 0
    num_i = 0
    for start, end, slot in spans:
        out.append(text[cursor:start])
        if slot["type"] == "field":
            out.append(f"{{{{field:{slot['name']}}}}}")
            slots.append({"type": "field", "name": slot["name"]})
        else:
            out.append(f"{{{{num:{num_i}}}}}")
            slots.append({"type": "num", "value": text[start:end]})
            num_i += 1
        cursor = end
    out.append(text[cursor:])
    masked_raw = "".join(out)
    return masked_raw, normalize_arabic(normalize_digits(masked_raw)), slots


def load_templates(path: Path) -> list[dict]:
    if not path.exists():
        return []
    templates = json.loads(path.read_text(encoding="utf-8"))
    for template in templates:
        template["_threshold"] = template.get("threshold", max(0.55, template.get("min_similarity", 0.75) - MATCH_MARGIN))
        template["_canon_norm"] = normalize_arabic(normalize_digits(template["canonical_text"]))
        length_range = template.get("length_range", [0, 999999])
        template["_len_min"], template["_len_max"] = length_range[0], length_range[1]
    return templates


def merge_block_by_block(template_masked_raw: str, candidate_masked_raw: str) -> str:
    matcher = SequenceMatcher(None, template_masked_raw, candidate_masked_raw, autojunk=False)
    out = []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        template_chunk = template_masked_raw[i1:i2]
        candidate_chunk = candidate_masked_raw[j1:j2]
        if tag == "equal":
            out.append(template_chunk)
            continue
        block_len = max(i2 - i1, j2 - j1)
        has_placeholder = any(marker in template_chunk or marker in candidate_chunk for marker in ("{{field:", "{{num:"))
        out.append(candidate_chunk if (has_placeholder or block_len > NOISE_BLOCK_THRESHOLD) else template_chunk)
    return "".join(out)


def reconstruct_from_merged_text(merged_masked_text: str, field_values: dict, slots: list) -> str:
    text = merged_masked_text
    num_values = [slot["value"] for slot in slots if slot["type"] == "num"]

    def repl_field(match):
        name = match.group(1)
        val = field_values.get(name)
        if not val and name in ("law_number", "law_year"):
            val = (field_values.get("law_reference") or {}).get(name)
        return str(val) if val else match.group(0)

    text = re.sub(r"\{\{field:([a-z_]+)\}\}", repl_field, text)
    index = 0

    def repl_num(match):
        nonlocal index
        value = num_values[index] if index < len(num_values) else match.group(0)
        index += 1
        return value

    return re.sub(r"\{\{num:\d+\}\}", repl_num, text)


def max_diff_block_length(candidate_masked: str, template_masked: str) -> int:
    matcher = SequenceMatcher(None, template_masked, candidate_masked, autojunk=False)
    max_len = 0
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag in ("replace", "insert"):
            max_len = max(max_len, j2 - j1)
        elif tag == "delete":
            max_len = max(max_len, i2 - i1)
    return max_len


def correct_chunk(data: dict, templates: list[dict]) -> dict:
    field_values = {key: data.get(key) for key in FIELD_KEYS if key in data}
    law_ref = data.get("law_reference") or {}
    field_values.update({"law_reference": law_ref, "law_number": law_ref.get("law_number"), "law_year": law_ref.get("law_year")})

    for article in data.get("articles", []):
        raw_text = (article.get("value") or "").strip()
        if not raw_text:
            continue
        masked_raw, masked_norm, slots = mask_article(raw_text, field_values)
        best_template, best_score = None, 0.0
        for template in templates:
            score = sim_ratio(masked_norm, template["_canon_norm"])
            if score > best_score:
                best_score, best_template = score, template

        if best_template and best_score >= best_template["_threshold"]:
            candidate_len = len(masked_norm)
            length_bad = not (
                best_template["_len_min"] * (1 - LENGTH_TOLERANCE)
                <= candidate_len
                <= best_template["_len_max"] * (1 + LENGTH_TOLERANCE)
            )
            diff_bad = max_diff_block_length(masked_norm, best_template["_canon_norm"]) > DIFF_BLOCK_THRESHOLD
            merged_masked = merge_block_by_block(best_template["canonical_text"], masked_raw)
            article["value_ocr"] = raw_text
            article["value"] = reconstruct_from_merged_text(merged_masked, field_values, slots)
            article["template_id"] = best_template["template_id"]
            article["template_similarity"] = round(best_score, 3)
            article["flagged_for_review"] = length_bad or diff_bad
        else:
            article.setdefault("value_ocr", raw_text)
            article["template_id"] = None
            article["template_similarity"] = round(best_score, 3) if best_template else 0.0
            article["flagged_for_review"] = False
    return data


def normalize_article_id(id_str) -> int | None:
    if id_str is None:
        return None
    match = re.search(r"\d+", normalize_digits(str(id_str)))
    return int(match.group()) if match else None


def assemble_final_output(file_id: str, chunks: list[dict]) -> dict:
    field_votes = {key: Counter() for key in FIELD_KEYS}
    law_number_votes, law_year_votes = Counter(), Counter()
    articles_by_id = {}

    for data in chunks:
        for key in FIELD_KEYS:
            value = data.get(key)
            if value and str(value).strip():
                field_votes[key][str(value).strip()] += 1
        law_ref = data.get("law_reference") or {}
        if law_ref.get("law_number"):
            law_number_votes[str(law_ref["law_number"]).strip()] += 1
        if law_ref.get("law_year"):
            law_year_votes[str(law_ref["law_year"]).strip()] += 1

        for article in data.get("articles", []):
            article_id = normalize_article_id(article.get("id"))
            text = (article.get("value") or "").strip()
            if article_id is None or len(text) < 5:
                continue
            candidate = {
                "id": str(article.get("id") or article_id),
                "value": text,
                "partial": bool(article.get("partial", False)),
                "value_ocr": article.get("value_ocr", text),
                "template_id": article.get("template_id"),
                "template_similarity": article.get("template_similarity"),
                "flagged_for_review": bool(article.get("flagged_for_review", False)),
            }
            existing = articles_by_id.get(article_id)
            if existing is None:
                articles_by_id[article_id] = candidate
            elif existing["partial"] and not candidate["partial"]:
                articles_by_id[article_id] = candidate
            elif existing["partial"] == candidate["partial"] and len(candidate["value"]) > len(existing["value"]):
                articles_by_id[article_id] = candidate

    return {
        "file_id": file_id,
        **{key: (field_votes[key].most_common(1)[0][0] if field_votes[key] else "") for key in FIELD_KEYS},
        "law_reference": {
            "law_number": law_number_votes.most_common(1)[0][0] if law_number_votes else "",
            "law_year": law_year_votes.most_common(1)[0][0] if law_year_votes else "",
        },
        "articles": [articles_by_id[key] for key in sorted(articles_by_id.keys())],
    }


def run_template_correction(file_id: str, extractions: list[dict], templates_path: Path) -> dict:
    templates = load_templates(templates_path)
    corrected = [correct_chunk(data, templates) if templates else data for data in extractions]
    return assemble_final_output(file_id, corrected)
