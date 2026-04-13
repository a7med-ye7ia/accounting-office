import base64
import json
import re
from mistralai import Mistral

PDF_PATH = "TEST3.pdf"
OUTPUT_JSON = "contract_structured.json"

# OCR + contract structuring
with open(PDF_PATH, "rb") as f:
    pdf_bytes = f.read()

b64_pdf = base64.b64encode(pdf_bytes).decode("utf-8")

client = Mistral(api_key="")

response = client.ocr.process(
    model="mistral-ocr-latest",
    document={
        "type": "document_url",
        "document_url": f"data:application/pdf;base64,{b64_pdf}"
    },
    include_image_base64=False
)

pages = []
for page_number, page in enumerate(response.pages, start=1):
    pages.append({
        "page": page_number,
        "text_markdown": page.markdown or ""
    })

def clean_markdown(text: str) -> str:
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", text)
    text = re.sub(r"(?m)^\s*#{1,6}\s*", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

ARTICLE_HEADER = re.compile(
    r"(?m)^\s*(?:مادة|المادة)\s*(?:ال)?\s*[\(（]?\s*([0-9\u0660-\u0669]+)\s*[\)）]?\s*$"
)

_AR2EN = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

def to_int(num_str: str) -> int:
    return int(num_str.translate(_AR2EN))

def split_contract_sections(full_text: str):
    full_text = clean_markdown(full_text)
    matches = list(ARTICLE_HEADER.finditer(full_text))

    if not matches:
        return {"preamble": full_text, "articles": []}

    preamble = full_text[:matches[0].start()].strip()
    articles = []

    for i, m in enumerate(matches):
        num = to_int(m.group(1))
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(full_text)
        body = full_text[start:end].strip()
        articles.append({
            "article_number": num,
            "title": f"المادة {num}",
            "text": body
        })

    return {
        "preamble": preamble if preamble else None,
        "articles": articles
    }

full_text = "\n".join(p["text_markdown"] for p in pages)
structured = split_contract_sections(full_text)

output = {
    "source_pdf": PDF_PATH,
    "preamble": structured["preamble"],
    "articles": structured["articles"],
    "pages_raw": pages
}

with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("✅ OCR + Structuring completed successfully")
print(f"📄 Output saved to: {OUTPUT_JSON}")
