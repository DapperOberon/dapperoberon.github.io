#!/usr/bin/env python3
"""Run node --check across active JavaScript entrypoints and modules."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def iter_targets() -> list[Path]:
    targets = [
        ROOT / "app.js",
        ROOT / "content-page.js",
        ROOT / "tailwind-config.js",
    ]
    targets.extend(sorted((ROOT / "modules").glob("*.js")))
    return [path for path in targets if path.exists()]


def main() -> int:
    failures: list[str] = []
    targets = iter_targets()
    if not targets:
        print("No JavaScript files found to check")
        return 1

    for path in targets:
        result = subprocess.run(
            ["node", "--check", str(path)],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            output = result.stderr.strip() or result.stdout.strip() or "Unknown syntax error"
            failures.append(f"{path.relative_to(ROOT)}\n{output}")

    if failures:
        print("JavaScript syntax check failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(f"JavaScript syntax OK: {len(targets)} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
