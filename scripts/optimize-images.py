"""Langkah 4 — optimasi foto asli klien ke WebP (assets/img/).

Pakai: python scripts/optimize-images.py
Membaca assets/manifest.json → semua file di `inventory` kecuali yang ada di `unused`.
- kategori menu  → lebar maks 800px, q75
- kategori vibes → lebar maks 1600px, q75
- og.jpg 1200x630 dari vibes pertama (untuk Open Graph)
Foto di assets/images/ hanya dibaca, tidak pernah diubah.
"""
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img"
WIDTH = {"menu": 800, "vibes": 1600}


def save_webp(src: Path, dst: Path, max_w: int) -> None:
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=75, method=6)
    print(f"{dst.relative_to(ROOT)}  {im.width}x{im.height}  {dst.stat().st_size // 1024} KB")


def save_og(src: Path, dst: Path) -> None:
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    im = ImageOps.fit(im, (1200, 630), Image.LANCZOS)
    im.save(dst, "JPEG", quality=80, optimize=True, progressive=True)
    print(f"{dst.relative_to(ROOT)}  1200x630")


def main() -> None:
    manifest = json.loads((ROOT / "assets" / "manifest.json").read_text(encoding="utf-8"))
    unused = {u["file"] for u in manifest.get("unused", [])}
    OUT.mkdir(parents=True, exist_ok=True)
    for item in manifest["inventory"]:
        if item["file"] in unused:
            continue
        save_webp(ROOT / item["file"], OUT / f"{item['slug']}.webp", WIDTH[item["category"]])
    if manifest.get("vibes"):
        save_og(ROOT / manifest["vibes"][0], OUT / "og.jpg")


if __name__ == "__main__":
    main()
