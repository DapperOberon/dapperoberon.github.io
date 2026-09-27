#!/usr/bin/env python3
"""Fail when a <button> or <a> contains another interactive element.

Nesting interactive content inside a button or anchor is invalid HTML.
Browsers recover by restructuring the DOM -- typically hoisting the inner
element out -- which silently breaks hit areas: the visible control ends up
in a different place from the thing that actually responds to clicks.

This is not hypothetical. The Preferences audio rows rendered

    <button data-pref-toggle="audioEnabled">
      ...
      <label class="settings-switch"><input type="checkbox"> ...</label>
    </button>

which made the clickable area sit to the LEFT of the switch it controlled,
and set up a double-fire between the button's click handler and the input's
change handler. User-reported.

Presentational-only markup (`<span>`, `<div>`) inside a button is fine, and is
the pattern the other preference toggles already use.

Usage:
    python3 star-wars-timeline/scripts/check_nested_interactive.py
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

# Elements that must never appear inside a <button> or <a>.
# <label> is included: it is a click target that forwards activation.
INTERACTIVE = r"(?:button|a|input|select|textarea|label|summary|iframe)"

CONTAINER = re.compile(
    r"<(button|a)\b[^>]*>(.*?)</\1>",
    re.DOTALL | re.IGNORECASE,
)
INNER = re.compile(r"<" + INTERACTIVE + r"\b[^>]*>", re.IGNORECASE)


def render_markup() -> str:
    script = ROOT / "scripts" / "render_all_surfaces.mjs"
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as handle:
        out_path = Path(handle.name)

    result = subprocess.run(
        ["node", str(script), str(out_path), "--emit-html"],
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
    return payload.get("html", "")


def main() -> int:
    html = render_markup()
    if not html:
        print("Renderer produced no HTML; cannot check.", file=sys.stderr)
        return 1

    violations: list[str] = []
    for match in CONTAINER.finditer(html):
        tag, inner_html = match.group(1), match.group(2)
        for nested in INNER.findall(inner_html):
            snippet = " ".join(nested.split())[:90]
            violations.append(f"<{tag.lower()}> contains {snippet}")

    if violations:
        unique = sorted(set(violations))
        print("Nested interactive element check failed:")
        for item in unique:
            print(f"- {item}")
        print(
            f"\n{len(unique)} distinct violation(s). Interactive elements cannot "
            "be nested; browsers restructure the DOM and hit areas break. Use a "
            "presentational <span>/<div> inside the button instead."
        )
        return 1

    print("Nested interactive check OK: no interactive elements inside button/a")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
