import base64
import json
import os
from mistralai import Mistral

PDF_PATH = "test.pdf"          # اسم ملف الـ PDF
OUTPUT_JSON = "ocr_result.json"    # اسم ملف الناتج

with open(PDF_PATH, "rb") as f:
    pdf_bytes = f.read()

b64_pdf = base64.b64encode(pdf_bytes).decode("utf-8")

client = Mistral(
    api_key=""
)

response = client.ocr.process(
    model="mistral-ocr-latest",
    document={
        "type": "document_url",
        "document_url": f"data:application/pdf;base64,{b64_pdf}"
    },
    include_image_base64=False
)

result = [] 

for page_number, page in enumerate(response.pages, start=1):
    result.append({
        "page": page_number,
        "text_markdown": page.markdown
    })

with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("OCR completed successfully")
print(f" Output saved to: {OUTPUT_JSON}")
