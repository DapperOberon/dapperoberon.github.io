#!/usr/bin/env python3
"""Fail when a Tailwind class is assembled by string interpolation.

Tailwind's scanner extracts *complete literal strings* from source. It does
not evaluate JavaScript, so a class built by joining a prefix to an
interpolated value is never seen and never compiled:

    BAD:   class="md:${reverse ? 'flex-row-reverse' : 'flex-row'}"
    GOOD:  class="${reverse ? 'md:flex-row-reverse' : 'md:flex-row'}"

Both render identical HTML, so this fails silently: the markup looks right,
the class is simply absent from the stylesheet and the element falls back to
its unprefixed behaviour.

This is not hypothetical. The B4 CDN-to-build migration introduced exactly
this bug at `timeline-renderers.js:293`, which dropped `md:flex-row-reverse`
and left every alternating timeline entry centred instead of right-aligned.
The old CDN build tolerated it because it generated styles at runtime.

Usage:
    python3 star-wars-timeline/scripts/check_dynamic_classes.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODULE_DIR = ROOT / "modules"

# A Tailwind-ish prefix immediately followed by `${`, i.e. the variant or
# utility prefix is literal but the rest is computed.
#
# Matches: md:${...}  hover:${...}  lg:${...}  text-${...}  bg-${...}
# Ignores: style="width:${...}"  -- CSS properties, not Tailwind classes.
DYNAMIC_CLASS = re.compile(r"(?<![\w-])((?:[a-z][a-z0-9]*:)+|[a-z][a-z0-9]*-)\$\{")

# CSS property names that legitimately precede `${` inside a style attribute.
CSS_PROPERTIES = {
    "width", "height", "color", "background", "top", "left", "right",
    "bottom", "opacity", "transform", "margin", "padding", "border",
    "box-shadow", "flex", "grid", "gap", "font-size", "line-height",
    "stroke", "fill", "min-width", "max-width", "min-height", "max-height",
}


def main() -> int:
    if not MODULE_DIR.is_dir():
        print(f"Module directory not found: {MODULE_DIR}", file=sys.stderr)
        return 1

    violations: list[str] = []
    scanned = 0

    for path in sorted(MODULE_DIR.glob("*.js")):
        scanned += 1
        for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            for match in DYNAMIC_CLASS.finditer(line):
                prefix = match.group(1)
                if prefix.rstrip(":-") in CSS_PROPERTIES:
                    continue
                # Only flag occurrences inside a class attribute.
                before = line[: match.start()]
                if "class=" not in before:
                    continue
                # A `style=` later in the same attribute run is a false positive.
                if before.rfind("style=") > before.rfind("class="):
                    continue
                violations.append(
                    f"{path.relative_to(ROOT)}:{lineno}: "
                    f"`{prefix}${{...}}` builds a class by interpolation -- "
                    f"Tailwind cannot see it. Move the prefix inside each branch."
                )

    if violations:
        print("Dynamic class check failed:")
        for violation in violations:
            print(f"- {violation}")
        print(
            f"\n{len(violations)} violation(s). Tailwind only compiles complete "
            "literal class names."
        )
        return 1

    print(f"Dynamic classes OK: {scanned} modules, no interpolated class prefixes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
