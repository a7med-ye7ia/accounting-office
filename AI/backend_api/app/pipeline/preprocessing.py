from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageEnhance


PREPROCESS_CONFIG = {
    "max_width": 1024,
    "max_height": 1024,
    "contrast": 1.3,
    "target_dpi": 250,
    "default_dpi": 72,
    "deskew_threshold": 0.5,
    "clahe_clip": 2.0,
    "clahe_grid": 8,
}

SCREEN_CONFIG = {
    "min_std": 8.0,
    "min_edge_ratio": 0.01,
    "min_dark_ratio": 0.003,
    "dark_threshold": 180,
    "analysis_width": 512,
}


def deskew_image(img: Image.Image, threshold: float = 0.5) -> Image.Image:
    gray = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2GRAY)
    coords = np.column_stack(np.where(gray < 200))
    if len(coords) < 100:
        return img
    angle = cv2.minAreaRect(coords)[-1]
    angle = -(90 + angle) if angle < -45 else -angle
    if abs(angle) < threshold:
        return img
    height, width = gray.shape[:2]
    matrix = cv2.getRotationMatrix2D((width // 2, height // 2), angle, 1.0)
    rotated = cv2.warpAffine(
        np.array(img),
        matrix,
        (width, height),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE,
    )
    return Image.fromarray(rotated)


def enhance_contrast_clahe(img: Image.Image, clip: float = 2.0, grid: int = 8) -> Image.Image:
    lab = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2LAB)
    lightness, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(grid, grid))
    enhanced = cv2.merge([clahe.apply(lightness), a, b])
    return Image.fromarray(cv2.cvtColor(enhanced, cv2.COLOR_LAB2RGB))


def remove_colored_stamps(img: Image.Image, blend: float = 0.25) -> Image.Image:
    cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)
    blue = cv2.inRange(hsv, np.array([90, 40, 40]), np.array([130, 255, 255]))
    red = cv2.inRange(hsv, np.array([0, 40, 40]), np.array([10, 255, 255]))
    red += cv2.inRange(hsv, np.array([170, 40, 40]), np.array([180, 255, 255]))
    mask = ((blue + red) > 0).astype(np.uint8)
    mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)), iterations=1)
    white = np.full_like(cv_img, 255)
    mask3 = mask[:, :, np.newaxis]
    result = (cv_img * (blend * mask3) + white * ((1 - blend) * mask3) + cv_img * (1 - mask3)).astype(np.uint8)
    return Image.fromarray(cv2.cvtColor(result, cv2.COLOR_BGR2RGB))


def detect_and_fix_faint_ink(img: Image.Image, contrast_threshold: float = 2.5) -> Image.Image:
    gray = np.array(img.convert("L"), dtype=np.float32)
    background = np.percentile(gray, 95)
    ink = np.percentile(gray, 5)
    if background / max(ink, 1.0) >= contrast_threshold:
        return img
    p2 = np.percentile(gray, 2)
    p98 = np.percentile(gray, 98)
    stretched = np.clip((gray - p2) / max(p98 - p2, 1.0) * 255, 0, 255).astype(np.uint8)
    return Image.fromarray(cv2.cvtColor(stretched, cv2.COLOR_GRAY2RGB))


def preprocess_image(image_path: Path, remove_stamps: bool = False) -> Image.Image:
    img = Image.open(str(image_path)).convert("RGB")
    if remove_stamps:
        img = remove_colored_stamps(img)
    img = deskew_image(img, threshold=PREPROCESS_CONFIG["deskew_threshold"])
    img = detect_and_fix_faint_ink(img)

    source_dpi = img.info.get("dpi", (PREPROCESS_CONFIG["default_dpi"],) * 2)
    source_dpi = source_dpi[0] if isinstance(source_dpi, tuple) else source_dpi
    source_dpi = float(source_dpi) if source_dpi and source_dpi > 0 else PREPROCESS_CONFIG["default_dpi"]
    scale = PREPROCESS_CONFIG["target_dpi"] / source_dpi
    if scale != 1.0:
        img = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)

    if img.width > PREPROCESS_CONFIG["max_width"]:
        ratio = PREPROCESS_CONFIG["max_width"] / img.width
        img = img.resize((PREPROCESS_CONFIG["max_width"], int(img.height * ratio)), Image.LANCZOS)
    if img.height > PREPROCESS_CONFIG["max_height"]:
        ratio = PREPROCESS_CONFIG["max_height"] / img.height
        img = img.resize((int(img.width * ratio), PREPROCESS_CONFIG["max_height"]), Image.LANCZOS)

    return enhance_contrast_clahe(img, PREPROCESS_CONFIG["clahe_clip"], PREPROCESS_CONFIG["clahe_grid"])


def screen_image_for_text(pil_img: Image.Image, cfg: dict = SCREEN_CONFIG) -> tuple[bool, dict]:
    width = cfg["analysis_width"]
    ratio = width / pil_img.width if pil_img.width > width else 1.0
    small = pil_img.resize((int(pil_img.width * ratio), int(pil_img.height * ratio)), Image.LANCZOS).convert("L")
    arr = np.array(small, dtype=np.float32)
    gx = np.pad(np.abs(np.diff(arr, axis=1)), ((0, 0), (0, 1)))
    gy = np.pad(np.abs(np.diff(arr, axis=0)), ((0, 1), (0, 0)))
    edge_ratio = float((np.sqrt(gx**2 + gy**2) > 10).sum() / arr.size)
    dark_ratio = float((arr < cfg["dark_threshold"]).sum() / arr.size)
    std_dev = float(arr.std())
    return (
        std_dev >= cfg["min_std"] and edge_ratio >= cfg["min_edge_ratio"] and dark_ratio >= cfg["min_dark_ratio"],
        {"std": round(std_dev, 2), "edge": round(edge_ratio, 4), "dark": round(dark_ratio, 4)},
    )
