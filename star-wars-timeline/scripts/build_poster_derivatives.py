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

# Posters are sized by the role they play, not by one global number.
#
# The hero backdrop (`modules/app-layout.js`) is a full-bleed background across
# a min-h-[640px] section, so it needs real width. Crucially, the hero entry is
# *dynamic* -- `getNextObjective()` picks whichever entry is next unwatched --
# so every poster needs a large variant, not just one.
#
# Card and modal posters are much smaller: the widest is the desktop card at
# w-[45%] of a max-w-[1320px] container (~594 CSS px), so 900px covers it at
# DPR 1.5 and covers mobile at DPR 2.
#
# Never upscale: 19 of the current 34 sources are narrower than HERO_WIDTH.
HERO_WIDTH = 1600
STANDARD_WIDTH = 900
HERO_SUFFIX = "-lg"

# Standard posters are viewed directly, so they keep a high quality setting.
# The hero variant is rendered at opacity-50 beneath two gradient overlays
# (`modules/app-layout.js`), which hides compression detail, so it tolerates a
# lower setting -- worth roughly 25% off the largest single asset on the page.
QUALITY = 82
HERO_QUALITY = 70


def fit_width(image: "Image.Image", target: int) -> "Image.Image":
    """Downscale to `target` width, preserving aspect ratio.

    Never upscales: an image narrower than `target` is returned unchanged,
    since enlarging it adds bytes without adding detail.
    """
    if image.width <= target:
        return image
    height = round(image.height * target / image.width)
    return image.resize((target, height), Image.LANCZOS)


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
    total_hero = 0
    upscale_skipped = 0

    for jpg in sources:
        original = Image.open(jpg).convert("RGB")

        # --- Hero variant (full-bleed backdrop) ---
        hero = fit_width(original, HERO_WIDTH)
        if hero.width < HERO_WIDTH:
            upscale_skipped += 1
        hero_webp = jpg.with_name(f"{jpg.stem}{HERO_SUFFIX}.webp")
        hero.save(hero_webp, "WEBP", quality=HERO_QUALITY, method=6)
        total_hero += hero_webp.stat().st_size

        # --- Standard variant (cards, modal) ---
        standard = fit_width(original, STANDARD_WIDTH)
        webp = jpg.with_suffix(".webp")
        standard.save(webp, "WEBP", quality=QUALITY, method=6)

        # Keep the JPG fallback at the same dimensions as the standard WebP.
        # It is only reached by browsers without WebP support.
        standard.save(jpg, "JPEG", quality=QUALITY, optimize=True, progressive=True)

        total_jpg += jpg.stat().st_size
        total_webp += webp.stat().st_size

    combined = total_jpg + total_webp + total_hero
    print(f"Poster derivatives OK: {len(sources)} posters")
    print(f"  hero webp ({HERO_WIDTH}px): {total_hero / 1048576:.1f} MB")
    print(f"  webp ({STANDARD_WIDTH}px):      {total_webp / 1048576:.1f} MB")
    print(f"  jpg fallbacks:       {total_jpg / 1048576:.1f} MB")
    print(f"  combined:            {combined / 1048576:.1f} MB")
    if upscale_skipped:
        print(f"  note: {upscale_skipped} sources narrower than {HERO_WIDTH}px "
              f"(kept at native width, never upscaled)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
