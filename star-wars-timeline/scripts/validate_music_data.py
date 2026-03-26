#!/usr/bin/env python3
"""Validate star-wars-timeline/data/music-data.json."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "music-data.json"


def fail(errors: list[str]) -> int:
    print("Music data validation failed:")
    for error in errors:
        print(f"- {error}")
    return 1


def main() -> int:
    try:
        payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return fail([f"Missing file: {DATA_PATH}"])
    except json.JSONDecodeError as exc:
        return fail([f"Invalid JSON at line {exc.lineno}, column {exc.colno}: {exc.msg}"])

    errors: list[str] = []

    if not isinstance(payload, dict):
        return fail(["Top-level music payload must be an object"])

    tracks = payload.get("tracks")
    if not isinstance(tracks, list) or not tracks:
        return fail(["music-data.json must contain a non-empty tracks array"])

    seen_titles: set[str] = set()
    seen_sources: set[str] = set()

    for index, track in enumerate(tracks):
        label = f"tracks[{index}]"
        if not isinstance(track, dict):
            errors.append(f"{label} must be an object")
            continue

        src = track.get("src")
        title = track.get("title")

        if not isinstance(title, str) or not title.strip():
            errors.append(f"{label}.title must be a non-empty string")
        elif title in seen_titles:
            errors.append(f"Duplicate track title: {title}")
        else:
            seen_titles.add(title)

        if not isinstance(src, str) or not src.strip():
            errors.append(f"{label}.src must be a non-empty string")
            continue

        if src in seen_sources:
            errors.append(f"Duplicate track src: {src}")
        else:
            seen_sources.add(src)

        track_path = (ROOT / src).resolve() if src.startswith(".") else None
        if track_path and not track_path.exists():
            errors.append(f"{label}.src file does not exist: {src}")

    if errors:
        return fail(errors)

    print(f"Music data OK: {len(tracks)} tracks")
    return 0


if __name__ == "__main__":
    sys.exit(main())
