#!/usr/bin/env python3
"""Fail when rendered markup uses a class that no stylesheet defines.

Since B4 the app serves a *compiled* `tailwind.generated.css` instead of the
runtime CDN. A compiled stylesheet only contains classes Tailwind could find
as complete literal strings at build time, so a class can silently resolve to
nothing: the markup looks correct and the rule is simply absent.

This check renders every surface across multiple states, extracts every class
actually emitted, and asserts each one resolves in either the generated
stylesheet or the hand-written `styles.css`.

It catches three distinct failure modes:
  1. Classes assembled by interpolation (see check_dynamic_classes.py).
  2. Values off Tailwind's scale, e.g. `text-white/72` -- `/72` is not a
     default opacity step, so no rule is generated.
  3. Hand-written classes referenced in markup but never defined in CSS,
     e.g. `settings-switch`, which left the Preferences audio toggles
     rendering as bare checkboxes.

Requires the stylesheet to be current; run `npm run build:css` first.

Usage:
    python3 star-wars-timeline/scripts/check_css_coverage.py
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

# Classes that are intentionally undefined: pure JavaScript/test hooks that
# carry no styling. Keep this list short and justified.
ALLOWED_UNDEFINED: set[str] = set()


def escape_class(name: str) -> str:
    """Build a regex matching how CSS escapes this class in a selector.

    Tailwind escapes non-identifier characters with a backslash, except commas
    which become the hex escape `\\2c ` (with an optional trailing space).
    """
    parts = []
    for char in name:
        if char.isalnum() or char in "-_":
            parts.append(re.escape(char))
        elif char == ",":
            parts.append(r"\\2c\s?")
        else:
            parts.append(r"\\" + re.escape(char))
    return "".join(parts)


def is_defined(name: str, haystack: str) -> bool:
    # A class may be defined standalone (`.x{`), compounded (`.x.is-active{`),
    # with a pseudo-class, or in a selector list -- all are valid definitions.
    pattern = r"\." + escape_class(name) + r"(?=[{,:.\s>~+\[])"
    return re.search(pattern, haystack) is not None


def render_markup() -> tuple[str, list[str]]:
    """Render every surface via Node and return the emitted class list."""
    script = ROOT / "scripts" / "render_all_surfaces.mjs"
    if not script.is_file():
        raise SystemExit(f"Renderer not found: {script}")

    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as handle:
        out_path = Path(handle.name)

    result = subprocess.run(
        ["node", str(script), str(out_path)],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise SystemExit(
            "Failed to render surfaces:\n"
            + (result.stderr.strip() or result.stdout.strip())
        )

    payload = json.loads(out_path.read_text(encoding="utf-8"))
    out_path.unlink(missing_ok=True)
    return result.stdout, payload["classes"]


def main() -> int:
    generated = ROOT / "tailwind.generated.css"
    handwritten = ROOT / "styles.css"

    for path in (generated, handwritten):
        if not path.is_file():
            print(f"Stylesheet not found: {path}", file=sys.stderr)
            return 1

    haystack = (
        generated.read_text(encoding="utf-8")
        + "\n"
        + handwritten.read_text(encoding="utf-8")
    )

    _, classes = render_markup()
    missing = [
        name
        for name in classes
        if name not in ALLOWED_UNDEFINED and not is_defined(name, haystack)
    ]

    if missing:
        print("CSS coverage check failed:")
        for name in sorted(missing):
            print(f"- `{name}` is used in rendered markup but defined nowhere")
        print(
            f"\n{len(missing)} undefined class(es) out of {len(classes)}.\n"
            "Run `npm run build:css`. If the class is hand-written, define it "
            "in styles.css. If it uses an off-scale value (e.g. text-white/72), "
            "move it onto the configured scale."
        )
        return 1

    print(f"CSS coverage OK: {len(classes)} rendered classes all resolve")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
