#!/usr/bin/env python3
"""Fail when runtime markup bypasses the design token layer.

Workstream D2 replaced raw hex colors and ad-hoc micro type/tracking values
with named tokens in `tailwind.config.cjs` (plus `--brand-*` CSS variables in
`styles.css` for contexts Tailwind utilities cannot reach, such as SVG
presentation attributes and inline `style`).

This check keeps that from silently eroding. It is intentionally narrow: it
only guards the specific classes of value D2 eliminated, so it should not
produce false positives on legitimate arbitrary values like `w-[45%]`.

Usage:
    python3 star-wars-timeline/scripts/check_design_tokens.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODULE_DIR = ROOT / "modules"

# Raw 3- or 6-digit hex colors. Use var(--brand-*) or a Tailwind color token.
HEX_PATTERN = re.compile(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b")

# Arbitrary pixel font sizes. Use the named micro scale:
# text-label-xs / text-label-sm / text-label / text-label-lg
ARBITRARY_TEXT_PATTERN = re.compile(r"text-\[\d+px\]")

# Arbitrary letter spacing. Use tracking-hud / -hud-wide / -hud-wider /
# -hud-widest, or a Tailwind built-in.
ARBITRARY_TRACKING_PATTERN = re.compile(r"tracking-\[[^\]]+\]")

CHECKS = (
    (HEX_PATTERN, "raw hex color", "use var(--brand-*) or a Tailwind color token"),
    (ARBITRARY_TEXT_PATTERN, "arbitrary font size", "use the text-label* scale"),
    (ARBITRARY_TRACKING_PATTERN, "arbitrary letter spacing", "use the tracking-hud* scale"),
)

# Comment markers. Documentation legitimately names the patterns it forbids
# (e.g. explaining that `tracking-[...]` should not be used), so comment bodies
# are excluded to avoid flagging the guidance itself.
LINE_COMMENT = re.compile(r"^\s*(//|\*|/\*)")


def strip_comment(line: str) -> str:
    """Return the code portion of a line, with comment text removed.

    Only handles the comment styles this codebase uses. Deliberately
    conservative: when in doubt it keeps text, so violations are not missed.
    """
    if LINE_COMMENT.match(line):
        return ""
    # Trailing `//` comment, ignoring `//` inside a quoted string or a URL.
    in_single = in_double = in_backtick = False
    for index, char in enumerate(line):
        if char == "'" and not (in_double or in_backtick):
            in_single = not in_single
        elif char == '"' and not (in_single or in_backtick):
            in_double = not in_double
        elif char == "`" and not (in_single or in_double):
            in_backtick = not in_backtick
        elif (
            char == "/"
            and not (in_single or in_double or in_backtick)
            and line[index + 1 : index + 2] == "/"
        ):
            return line[:index]
    return line


def main() -> int:
    if not MODULE_DIR.is_dir():
        print(f"Module directory not found: {MODULE_DIR}", file=sys.stderr)
        return 1

    violations: list[str] = []
    scanned = 0

    for path in sorted(MODULE_DIR.glob("*.js")):
        scanned += 1
        for lineno, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            line = strip_comment(raw_line)
            if not line.strip():
                continue
            for pattern, label, hint in CHECKS:
                for match in pattern.findall(line):
                    violations.append(
                        f"{path.relative_to(ROOT)}:{lineno}: {label} {match} -- {hint}"
                    )

    if violations:
        print("Design token check failed:")
        for violation in violations:
            print(f"- {violation}")
        print(f"\n{len(violations)} violation(s). See tailwind.config.cjs for tokens.")
        return 1

    print(f"Design tokens OK: {scanned} modules, no raw hex or ad-hoc type/tracking")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
