#!/usr/bin/env python3
"""Validate star-wars-timeline/data/timeline-data.json."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "timeline-data.json"
HEX_COLOR_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
ALLOWED_TYPES = {
    "Animated Film",
    "Animated Show",
    "Live Action Film",
    "Live Action Show",
    "Live Action TV Film",
    "Various Styles",
}


def fail(errors: list[str]) -> int:
    print("Timeline data validation failed:")
    for error in errors:
        print(f"- {error}")
    return 1


def validate_url(value: object, label: str, errors: list[str]) -> None:
    if value in (None, ""):
        return
    if not isinstance(value, str) or not value.startswith(("http://", "https://")):
        errors.append(f"{label} must be an absolute http(s) URL when provided")


def main() -> int:
    try:
        payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return fail([f"Missing file: {DATA_PATH}"])
    except json.JSONDecodeError as exc:
        return fail([f"Invalid JSON at line {exc.lineno}, column {exc.colno}: {exc.msg}"])

    errors: list[str] = []
    warnings: list[str] = []

    if not isinstance(payload, list) or not payload:
        return fail(["Top-level timeline payload must be a non-empty list"])

    seen_eras: set[str] = set()
    seen_ids: set[str] = set()

    for section_index, section in enumerate(payload):
        section_label = f"section[{section_index}]"
        if not isinstance(section, dict):
            errors.append(f"{section_label} must be an object")
            continue

        era = section.get("era")
        color = section.get("color")
        entries = section.get("entries")

        if not isinstance(era, str) or not era.strip():
            errors.append(f"{section_label}.era must be a non-empty string")
        elif era in seen_eras:
            errors.append(f"Duplicate era name: {era}")
        else:
            seen_eras.add(era)

        if not isinstance(color, str) or not HEX_COLOR_RE.match(color):
            errors.append(f"{section_label}.color must be a 3-digit or 6-digit hex color")

        if not isinstance(entries, list) or not entries:
            errors.append(f"{section_label}.entries must be a non-empty list")
            continue

        for entry_index, entry in enumerate(entries):
            entry_label = f"{section_label}.entries[{entry_index}]"
            if not isinstance(entry, dict):
                errors.append(f"{entry_label} must be an object")
                continue

            entry_id = entry.get("id")
            title = entry.get("title")
            year = entry.get("year")
            entry_type = entry.get("type")
            canon = entry.get("canon")
            poster = entry.get("poster")
            episodes = entry.get("episodes")
            watched = entry.get("watched")
            release_year = entry.get("releaseYear")
            synopsis = entry.get("synopsis")
            watch_url = entry.get("watchUrl")
            info_url = entry.get("wookieepediaUrl")
            episode_details = entry.get("episodeDetails")

            if not isinstance(entry_id, str) or not entry_id.strip():
                errors.append(f"{entry_label}.id must be a non-empty string")
            elif entry_id in seen_ids:
                errors.append(f"Duplicate entry id: {entry_id}")
            else:
                seen_ids.add(entry_id)

            if not isinstance(title, str) or not title.strip():
                errors.append(f"{entry_label}.title must be a non-empty string")
            if not isinstance(year, str) or not year.strip():
                errors.append(f"{entry_label}.year must be a non-empty string")
            if entry_type not in ALLOWED_TYPES:
                errors.append(f"{entry_label}.type must be one of {sorted(ALLOWED_TYPES)}")
            if not isinstance(canon, bool):
                errors.append(f"{entry_label}.canon must be a boolean")
            if not isinstance(synopsis, str) or not synopsis.strip():
                errors.append(f"{entry_label}.synopsis must be a non-empty string")
            if not isinstance(release_year, str) or not release_year.strip():
                errors.append(f"{entry_label}.releaseYear must be a non-empty string")
            if not isinstance(episodes, int) or episodes < 1:
                errors.append(f"{entry_label}.episodes must be an integer >= 1")
            if not isinstance(watched, int) or watched < 0:
                errors.append(f"{entry_label}.watched must be an integer >= 0")
            elif isinstance(episodes, int) and watched > episodes:
                errors.append(f"{entry_label}.watched cannot exceed episodes")

            if not isinstance(poster, str) or not poster.strip():
                errors.append(f"{entry_label}.poster must be a non-empty string")
            else:
                poster_path = (ROOT / poster).resolve() if poster.startswith(".") else None
                if poster_path and not poster_path.exists():
                    errors.append(f"{entry_label}.poster file does not exist: {poster}")

            validate_url(watch_url, f"{entry_label}.watchUrl", errors)
            validate_url(info_url, f"{entry_label}.wookieepediaUrl", errors)

            if "seasons" in entry and not isinstance(entry.get("seasons"), int):
                errors.append(f"{entry_label}.seasons must be an integer when provided")

            if episode_details is None:
                if isinstance(episodes, int) and episodes > 1 and not watch_url:
                    errors.append(f"{entry_label} needs episodeDetails or a watchUrl")
                continue

            if not isinstance(episode_details, list) or not episode_details:
                errors.append(f"{entry_label}.episodeDetails must be a non-empty list when provided")
                continue

            if isinstance(episodes, int) and len(episode_details) > episodes:
                errors.append(
                    f"{entry_label}.episodeDetails length ({len(episode_details)}) cannot exceed episodes ({episodes})"
                )
            elif isinstance(episodes, int) and len(episode_details) != episodes:
                warnings.append(
                    f"{entry_label}.episodeDetails length ({len(episode_details)}) does not match episodes ({episodes})"
                )

            for episode_index, episode in enumerate(episode_details):
                episode_label = f"{entry_label}.episodeDetails[{episode_index}]"
                if not isinstance(episode, dict):
                    errors.append(f"{episode_label} must be an object")
                    continue

                episode_title = episode.get("title")
                episode_time = episode.get("time")
                episode_watch_url = episode.get("watchUrl")

                if not isinstance(episode_title, str) or not episode_title.strip():
                    errors.append(f"{episode_label}.title must be a non-empty string")
                if not isinstance(episode_time, str) or not episode_time.strip():
                    errors.append(f"{episode_label}.time must be a non-empty string")
                validate_url(episode_watch_url, f"{episode_label}.watchUrl", errors)

    if errors:
        return fail(errors)

    total_entries = sum(len(section["entries"]) for section in payload)
    print(f"Timeline data OK: {len(payload)} eras, {total_entries} entries")
    if warnings:
        print("Timeline data warnings:")
        for warning in warnings:
            print(f"- {warning}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
