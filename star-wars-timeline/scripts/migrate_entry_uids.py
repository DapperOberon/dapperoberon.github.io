#!/usr/bin/env python3
"""Apply manifest-backed UIDs to timeline-data.json.

This script is intentionally explicit:
- it reads the checked-in UID manifest
- it rewrites each entry id to the manifest UID
- it preserves the previous slug id in storageMigrationIds so local watched data can migrate
- it writes a backup before changing the live file
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from uid_manifest import MANIFEST_PATH, load_manifest, manifest_entry_map, manifest_key


ROOT = Path(__file__).resolve().parents[1]
TIMELINE_DATA_PATH = ROOT / "data" / "timeline-data.json"
BACKUP_PATH = ROOT / "archive" / "timeline-data.pre-uid-migration.json"


def load_timeline_data() -> list[dict]:
    return json.loads(TIMELINE_DATA_PATH.read_text(encoding="utf-8"))


def migrate_entries(data: list[dict], manifest: dict) -> tuple[list[dict], int]:
    manifest_entries = manifest_entry_map(manifest)
    occurrence_counts: dict[tuple[str, str, str, str, str], int] = defaultdict(int)
    updated = 0

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
            manifest_entry = manifest_entries.get(key)
            if not manifest_entry:
                raise KeyError(f"Missing manifest entry for {key}")

            uid = manifest_entry["uid"]
            source_id = manifest_entry.get("sourceId", "")
            current_id = entry.get("id", "")

            storage_ids = []
            if source_id and source_id != uid:
                storage_ids.append(source_id)
            if current_id and current_id != uid and current_id not in storage_ids:
                storage_ids.append(current_id)

            if current_id != uid:
                entry["id"] = uid
                updated += 1

            if storage_ids:
                entry["storageMigrationIds"] = storage_ids
            else:
                entry.pop("storageMigrationIds", None)

    return data, updated


def main() -> None:
    manifest = load_manifest(MANIFEST_PATH)
    data = load_timeline_data()
    BACKUP_PATH.write_text(TIMELINE_DATA_PATH.read_text(encoding="utf-8"), encoding="utf-8")
    migrated, updated = migrate_entries(data, manifest)
    TIMELINE_DATA_PATH.write_text(json.dumps(migrated, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        f"Migrated entry ids using {MANIFEST_PATH.name}: "
        f"{updated} entries updated, backup written to {BACKUP_PATH.name}"
    )


if __name__ == "__main__":
    main()
