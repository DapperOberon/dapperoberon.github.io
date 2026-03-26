#!/usr/bin/env python3
"""Create or update the checked-in UID manifest from timeline-data.json."""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from uid_manifest import (
    MANIFEST_PATH,
    load_manifest,
    manifest_entry_map,
    manifest_key,
    next_uid,
    normalize_uid,
    save_manifest,
)


ROOT = Path(__file__).resolve().parents[1]
TIMELINE_DATA_PATH = ROOT / "data" / "timeline-data.json"
LEGACY_SOURCE_DATA_PATH = ROOT / "archive" / "timeline-data.backup.json"


def load_timeline_data() -> list[dict]:
    return json.loads(TIMELINE_DATA_PATH.read_text(encoding="utf-8"))


def fallback_signature(entry: dict) -> tuple[str, str, str, str]:
    return (
        entry.get("title", ""),
        entry.get("type", ""),
        entry.get("releaseYear", ""),
        entry.get("year", ""),
    )


def load_legacy_source_ids(path: Path = LEGACY_SOURCE_DATA_PATH) -> tuple[dict[str, str], dict[tuple[str, str, str, str], list[str]]]:
    if not path.exists():
        return {}, {}

    data = json.loads(path.read_text(encoding="utf-8"))
    occurrence_counts: dict[tuple[str, str, str, str, str], int] = defaultdict(int)
    source_ids = {}
    fallback_source_ids: dict[tuple[str, str, str, str], list[str]] = defaultdict(list)

    for section in data:
        era = section.get("era", "")
        for entry in section.get("entries", []):
            base_parts = (
                era,
                entry.get("title", ""),
                entry.get("type", ""),
                entry.get("releaseYear", ""),
                entry.get("year", ""),
            )
            occurrence_counts[base_parts] += 1
            key = manifest_key(entry, era, occurrence_counts[base_parts])
            source_id = str(entry.get("id") or "").strip()
            source_ids[key] = source_id
            fallback_source_ids[fallback_signature(entry)].append(source_id)

    return source_ids, fallback_source_ids


def looks_like_short_uid(value: str) -> bool:
    candidate = str(value or "").strip().lower()
    return bool(candidate) and len(candidate) in {3, 6} and candidate.isalnum()


def get_manifest_source_id(
    entry: dict,
    key: str,
    legacy_source_ids: dict[str, str],
    legacy_fallback_source_ids: dict[tuple[str, str, str, str], list[str]],
    existing: dict | None = None,
) -> str:
    legacy_source_id = str(legacy_source_ids.get(key) or "").strip()
    if legacy_source_id:
        return legacy_source_id

    fallback_ids = legacy_fallback_source_ids.get(fallback_signature(entry), [])
    unique_fallback_ids = list(dict.fromkeys([value for value in fallback_ids if value]))
    if len(unique_fallback_ids) == 1:
        return unique_fallback_ids[0]

    migration_ids = entry.get("storageMigrationIds")
    if isinstance(migration_ids, list) and migration_ids:
        first = str(migration_ids[0] or "").strip()
        if first:
            return first

    if existing:
        existing_source = str(existing.get("sourceId") or "").strip()
        if existing_source and not looks_like_short_uid(existing_source):
            return existing_source

    return str(entry.get("id") or "").strip()


def sync_manifest() -> tuple[dict, int]:
    timeline_data = load_timeline_data()
    manifest = load_manifest(MANIFEST_PATH)
    existing_entries = manifest_entry_map(manifest)
    legacy_source_ids, legacy_fallback_source_ids = load_legacy_source_ids()
    synced_entries = []
    added = 0
    occurrence_counts: dict[tuple[str, str, str, str, str], int] = defaultdict(int)

    for section in timeline_data:
        era = section.get("era", "")
        for entry in section.get("entries", []):
            base_parts = (
                era,
                entry.get("title", ""),
                entry.get("type", ""),
                entry.get("releaseYear", ""),
                entry.get("year", ""),
            )
            occurrence_counts[base_parts] += 1
            key = manifest_key(entry, era, occurrence_counts[base_parts])
            existing = existing_entries.get(key)
            if existing:
                synced_entries.append(
                    {
                        **existing,
                        "uid": normalize_uid(existing["uid"]),
                        "sourceId": get_manifest_source_id(
                            entry,
                            key,
                            legacy_source_ids,
                            legacy_fallback_source_ids,
                            existing,
                        ),
                    }
                )
                continue

            uid = next_uid({"entries": synced_entries})
            synced_entries.append(
                {
                    "key": key,
                    "uid": uid,
                    "sourceId": get_manifest_source_id(
                        entry,
                        key,
                        legacy_source_ids,
                        legacy_fallback_source_ids,
                    ),
                }
            )
            added += 1

    manifest["version"] = 1
    manifest["format"] = "base36-3"
    manifest["entries"] = synced_entries
    return manifest, added


def main() -> None:
    manifest, added = sync_manifest()
    save_manifest(manifest, MANIFEST_PATH)
    print(
        f"UID manifest synced: {len(manifest.get('entries', []))} entries"
        + (f", added {added} new UIDs" if added else ", no new UIDs needed")
    )


if __name__ == "__main__":
    main()
