from pathlib import Path

import fitz
from PIL import Image


def pdf_to_images(pdf_path: Path, output_dir: Path, dpi: int = 250) -> list[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    image_paths: list[Path] = []
    zoom = dpi / 72
    matrix = fitz.Matrix(zoom, zoom)

    with fitz.open(pdf_path) as document:
        for index, page in enumerate(document, start=1):
            pixmap = page.get_pixmap(matrix=matrix, alpha=False)
            image_path = output_dir / f"page_{index:03d}.jpg"
            image = Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples)
            image.save(image_path, "JPEG", quality=95)
            image_paths.append(image_path)

    return image_paths
