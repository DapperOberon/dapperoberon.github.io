#!/usr/bin/env python3
"""Generate WebP derivatives for poster art.

Posters are authored as JPGs. The app serves a WebP derivative with the JPG
as a fallback (see `modules/images.js`). This script regenerates the WebP set
from the JPG sources; it is safe to re-run.

Usage:
    python3 star-wars-timeline/scripts/build_poster_derivatives.py
"""

from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    print("Pillow is required: pip install Pillow", file=sys.stderr)
    raise SystemExit(1)


ROOT = Path(__file__).resolve().parents[1]
POSTER_DIR = ROOT / "images" / "posters"

# Posters never render wider than ~500 CSS px in any current layout, so a
# 600px derivative covers 1x and most 2x cases without shipping 2000px art.
TARGET_WIDTH = 600
QUALITY = 82


def main() -> int:
    if not POSTER_DIR.is_dir():
        print(f"Poster directory not found: {POSTER_DIR}", file=sys.stderr)
        return 1

    sources = sorted(POSTER_DIR.glob("*.jpg")) + sorted(POSTER_DIR.glob("*.jpeg"))
    if not sources:
        print("No poster JPGs found")
        return 1

    total_jpg = 0
    total_webp = 0

    for jpg in sources:
        image = Image.open(jpg).convert("RGB")
        if image.width > TARGET_WIDTH:
            height = round(image.height * TARGET_WIDTH / image.width)
            image = image.resize((TARGET_WIDTH, height), Image.LANCZOS)

        # WebP derivative (preferred source).
        webp = jpg.with_suffix(".webp")
        image.save(webp, "WEBP", quality=QUALITY, method=6)

        # Re-save the JPG fallback at the same dimensions. Shipping a
        # full-resolution fallback next to a 600px WebP wastes most of the win
        # for any browser that takes the fallback path.
        image.save(jpg, "JPEG", quality=QUALITY, optimize=True, progressive=True)

        total_jpg += jpg.stat().st_size
        total_webp += webp.stat().st_size

    print(f"Poster derivatives OK: {len(sources)} posters")
    print(f"  jpg fallbacks: {total_jpg / 1048576:.1f} MB")
    print(f"  webp sources:  {total_webp / 1048576:.1f} MB")
    print(f"  combined:      {(total_jpg + total_webp) / 1048576:.1f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
