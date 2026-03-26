#!/usr/bin/env python3
"""Import chronology markdown into a generated timeline JSON snapshot.

Inputs:
- Chronological Viewing Order.md at the project root
- data/timeline-data.json for existing metadata such as posters, ids, and synopsis

Outputs:
- archive/timeline-data-imported.json
- archive/timeline-data.backup.json (created once from the live data file)
"""

import json
import re
from collections import defaultdict
from pathlib import Path

from uid_manifest import (
    MANIFEST_PATH,
    load_manifest,
    manifest_entry_map,
    manifest_key,
    next_uid,
    save_manifest,
)


ROOT = Path(__file__).resolve().parents[1]
MARKDOWN_PATH = ROOT / "Chronological Viewing Order.md"
SOURCE_JSON_PATH = ROOT / "data" / "timeline-data.json"
OUTPUT_JSON_PATH = ROOT / "archive" / "timeline-data-imported.json"
BACKUP_JSON_PATH = ROOT / "archive" / "timeline-data.backup.json"


EPISODE_RE = re.compile(r"^\*\s+\[(?P<checked>[xX\s])\]\s+(?P<body>.+)$")
COMPLETION_STAMP_RE = re.compile(r"\s*✅\s*\d{4}-\d{2}-\d{2}\b")


def normalize_title(text: str) -> str:
    base = text.lower().strip()
    base = base.replace("star wars:", "").replace("star wars", "")
    base = re.sub(r"\bepisode\s+[ivxlcdm]+\s*-\s*", "", base)
    base = re.sub(r"[^a-z0-9]+", " ", base)
    return re.sub(r"\s+", " ", base).strip()


def title_to_slug(title: str) -> str:
    cleaned = title.lower()
    cleaned = cleaned.replace("&", "and")
    cleaned = re.sub(r"[^a-z0-9]+", "-", cleaned)
    cleaned = re.sub(r"-+", "-", cleaned).strip("-")
    return cleaned


def normalize_id_token(text: str) -> str:
    token = (text or "").strip().lower().replace("&", "and")
    token = re.sub(r"[^a-z0-9]+", "-", token)
    return re.sub(r"-+", "-", token).strip("-")


def media_type_token(media_type: str) -> str:
    value = (media_type or "").strip().lower()
    if "film" in value:
        return "film"
    if "show" in value:
        return "show"
    if "anthology" in value:
        return "anthology"
    return "media"


def build_entry_key(title: str, year: str, media_type: str, release_year: str) -> str:
    return "|".join(
        [
            normalize_title(title),
            normalize_id_token(year),
            normalize_id_token(media_type),
            normalize_id_token(release_year),
        ]
    )


def build_entry_key_without_year(title: str, media_type: str, release_year: str) -> str:
    return "|".join(
        [
            normalize_title(title),
            normalize_id_token(media_type),
            normalize_id_token(release_year),
        ]
    )


def split_meta(meta: str):
    parts = [part.strip() for part in meta.split(",")]
    release_year = parts[0] if parts else ""
    media_type = parts[1] if len(parts) > 1 else "Unknown"
    canon_text = parts[2].lower() if len(parts) > 2 else "canon"
    is_canon = "legend" not in canon_text
    return release_year, media_type, is_canon


def looks_like_year(text: str) -> bool:
    value = text.strip().lower()
    if not value:
        return False
    if "bby" in value or "aby" in value:
        return True
    if value == "unknown":
        return True
    if value == "various":
        return True
    if value.startswith("between ") or value.startswith("approx"):
        return True
    return False


def parse_media_header(stripped: str):
    if not stripped.startswith("### "):
        return None

    content = stripped[4:].strip()
    paren_match = re.match(r"^(?P<head>.*?)\s*\((?P<meta>.*)\)\s*$", content)
    if not paren_match:
        return None

    head = paren_match.group("head").strip()
    meta = paren_match.group("meta").strip()

    title = head
    year = ""

    if " - " in head:
        chunks = [chunk.strip() for chunk in head.split(" - ")]
        if chunks and looks_like_year(chunks[-1]):
            year = chunks[-1]
            title = " - ".join(chunks[:-1]).strip()
        elif len(chunks) >= 2 and looks_like_year(chunks[-2]):
            year = chunks[-2]
            chunks.pop(-2)
            title = " - ".join(chunks).strip()
    else:
        year_match = re.match(
            r"^(?P<title>.+?)\s+(?P<year>(?:\d+(?:-\d+)?\s*(?:BBY|ABY)|between\s+.+|approx\.?.+|Various|Unknown))$",
            head,
            flags=re.IGNORECASE,
        )
        if year_match:
            title = year_match.group("title").strip()
            year = year_match.group("year").strip()

    return {
        "title": title.strip(),
        "year": year.strip(),
        "meta": meta,
    }


def split_episode_body(body: str):
    series_episode_match = re.match(r"^(S\d+\.E\d+\s*-\s*.+?)\s+-\s+(.+)$", body.strip(), flags=re.IGNORECASE)
    if series_episode_match:
        return series_episode_match.group(1).strip(), series_episode_match.group(2).strip()
    if " - " not in body:
        return body.strip(), ""
    title_part, time_part = body.rsplit(" - ", 1)
    return title_part.strip(), time_part.strip()


def clean_episode_text(text: str) -> str:
    cleaned = COMPLETION_STAMP_RE.sub("", text)
    return re.sub(r"\s+", " ", cleaned).strip()


def derive_seasons(episode_titles):
    season_numbers = set()
    for episode_title in episode_titles:
        match = re.search(r"\bS(\d+)\b", episode_title, flags=re.IGNORECASE)
        if match:
            season_numbers.add(int(match.group(1)))
    if season_numbers:
        return max(season_numbers)
    return None


def normalize_episode_title_key(title: str) -> str:
    return clean_episode_text(title).lower()


def get_episode_code(title: str) -> str:
    match = re.match(r"^(S\d+\.E\d+)\b", clean_episode_text(title), flags=re.IGNORECASE)
    return match.group(1).upper() if match else ""


def build_existing_entry_metadata(entry: dict):
    episode_details = entry.get("episodeDetails", [])
    episode_map = {}
    episode_code_map = {}
    for episode in episode_details:
        title = episode.get("title", "")
        if title:
            episode_map[normalize_episode_title_key(title)] = episode
            episode_code = get_episode_code(title)
            if episode_code and episode_code not in episode_code_map:
                episode_code_map[episode_code] = episode

    return {
        "poster": entry.get("poster", ""),
        "synopsis": entry.get("synopsis", ""),
        "id": entry.get("id", ""),
        "storageMigrationIds": entry.get("storageMigrationIds", []),
        "year": entry.get("year", ""),
        "watchUrl": entry.get("watchUrl", ""),
        "wookieepediaUrl": entry.get("wookieepediaUrl", ""),
        "episodeDetails": episode_details,
        "episodeMap": episode_map,
        "episodeCodeMap": episode_code_map,
    }


def load_existing_metadata(path: Path):
    if not path.exists():
        return {}, {}, {}

    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    era_colors = {}
    title_metadata = defaultdict(list)
    title_type_release_metadata = defaultdict(list)
    title_fallback_metadata = defaultdict(list)

    for era in data:
        era_name = era.get("era", "").strip()
        if era_name:
            era_colors[era_name] = era.get("color", "#64748b")

        for entry in era.get("entries", []):
            norm = normalize_title(entry.get("title", ""))
            if not norm:
                continue

            key = build_entry_key(
                entry.get("title", ""),
                entry.get("year", ""),
                entry.get("type", ""),
                entry.get("releaseYear", ""),
            )
            title_type_release_key = build_entry_key_without_year(
                entry.get("title", ""),
                entry.get("type", ""),
                entry.get("releaseYear", ""),
            )
            metadata = build_existing_entry_metadata(entry)
            title_metadata[key].append(metadata)
            title_type_release_metadata[title_type_release_key].append(metadata)
            title_fallback_metadata[norm].append(metadata)

    return era_colors, title_metadata, title_type_release_metadata, title_fallback_metadata


def pop_existing_metadata(title_metadata, title_type_release_metadata, title_fallback_metadata, title, year, media_type, release_year):
    exact_key = build_entry_key(title, year, media_type, release_year)
    exact_matches = title_metadata.get(exact_key)
    if exact_matches:
        return exact_matches.pop(0)

    type_release_key = build_entry_key_without_year(title, media_type, release_year)
    type_release_matches = title_type_release_metadata.get(type_release_key)
    if type_release_matches:
        return type_release_matches.pop(0)

    fallback_matches = title_fallback_metadata.get(normalize_title(title))
    if fallback_matches and len(fallback_matches) == 1:
        return fallback_matches.pop(0)

    return {}


def get_manifest_source_id(existing: dict) -> str:
    migration_ids = existing.get("storageMigrationIds", [])
    if isinstance(migration_ids, list) and migration_ids:
        source_id = str(migration_ids[0] or "").strip()
        if source_id:
            return source_id
    return str(existing.get("id") or "").strip()


def resolve_manifest_uid(manifest: dict, manifest_entries: dict, key: str, existing: dict) -> str:
    existing_manifest_entry = manifest_entries.get(key)
    if existing_manifest_entry:
        return existing_manifest_entry["uid"]

    uid = next_uid(manifest)
    manifest_entry = {
        "key": key,
        "uid": uid,
        "sourceId": get_manifest_source_id(existing),
    }
    manifest.setdefault("entries", []).append(manifest_entry)
    manifest_entries[key] = manifest_entry
    return uid


def get_storage_migration_ids(manifest_entries: dict, key: str, existing: dict, stable_id: str) -> list[str]:
    candidates = []

    manifest_entry = manifest_entries.get(key) or {}
    source_id = str(manifest_entry.get("sourceId") or "").strip()
    if source_id and source_id != stable_id:
        candidates.append(source_id)

    migration_ids = existing.get("storageMigrationIds", [])
    if isinstance(migration_ids, list):
        for candidate in migration_ids:
            normalized = str(candidate or "").strip()
            if normalized and normalized != stable_id:
                candidates.append(normalized)

    deduped = []
    seen = set()
    for candidate in candidates:
        if candidate not in seen:
            deduped.append(candidate)
            seen.add(candidate)
    return deduped


def merge_existing_entry_data(current_entry: dict, existing: dict):
    if not existing:
        return current_entry

    if not current_entry.get("year") and existing.get("year"):
        current_entry["year"] = existing["year"]

    for key in ("poster", "synopsis", "watchUrl", "wookieepediaUrl"):
        if existing.get(key):
            current_entry[key] = existing[key]

    return current_entry


def merge_existing_episode_data(current_episode: dict, existing_entry: dict):
    if not existing_entry:
        return current_episode

    episode_map = existing_entry.get("episodeMap", {})
    existing_episode = episode_map.get(normalize_episode_title_key(current_episode.get("title", "")))
    if not existing_episode:
        episode_code_map = existing_entry.get("episodeCodeMap", {})
        existing_episode = episode_code_map.get(get_episode_code(current_episode.get("title", "")))
    if not existing_episode:
        return current_episode

    for key, value in existing_episode.items():
        if key not in current_episode and value not in (None, ""):
            current_episode[key] = value

    return current_episode


def build_import_data(
    markdown_text: str,
    era_colors: dict,
    title_metadata: dict,
    title_type_release_metadata: dict,
    title_fallback_metadata: dict,
    manifest: dict,
):
    imported = []
    current_era = None
    current_entry = None
    current_existing = {}
    manifest_entries = manifest_entry_map(manifest)
    occurrence_counts: dict[tuple[str, str, str, str, str], int] = defaultdict(int)

    for raw_line in markdown_text.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()

        if not stripped:
            continue

        if stripped.startswith("#") and not stripped.startswith("###"):
            era_name = re.sub(r"^#+\s*", "", stripped).strip()
            if era_name.lower() == "legend":
                continue

            current_era = {
                "era": era_name,
                "color": era_colors.get(era_name, "#64748b"),
                "entries": [],
            }
            imported.append(current_era)
            current_entry = None
            current_existing = {}
            continue

        media_header = parse_media_header(stripped)
        if media_header and current_era is not None:
            media_title = media_header["title"]
            media_year = media_header["year"]
            release_year, media_type, is_canon = split_meta(media_header["meta"])

            existing = pop_existing_metadata(
                title_metadata,
                title_type_release_metadata,
                title_fallback_metadata,
                media_title,
                media_year,
                media_type,
                release_year,
            )

            poster = existing.get("poster") or f"./images/posters/{title_to_slug(media_title)}-poster.jpg"
            synopsis = existing.get("synopsis", "")
            temp_entry = {
                "title": media_title,
                "year": media_year,
                "type": media_type,
                "releaseYear": release_year,
            }
            signature = (
                current_era["era"],
                media_title,
                media_type,
                release_year,
                media_year,
            )
            occurrence_counts[signature] += 1
            key = manifest_key(temp_entry, current_era["era"], occurrence_counts[signature])
            stable_id = resolve_manifest_uid(manifest, manifest_entries, key, existing)

            current_entry = {
                "id": stable_id,
                "title": media_title,
                "year": media_year,
                "type": media_type,
                "canon": is_canon,
                "poster": poster,
                "episodes": 0,
                "releaseYear": release_year,
                "episodeDetails": [],
            }

            storage_migration_ids = get_storage_migration_ids(manifest_entries, key, existing, stable_id)
            if storage_migration_ids:
                current_entry["storageMigrationIds"] = storage_migration_ids

            if synopsis:
                current_entry["synopsis"] = synopsis

            current_entry = merge_existing_entry_data(current_entry, existing)
            current_existing = existing

            current_era["entries"].append(current_entry)
            continue

        episode_match = EPISODE_RE.match(stripped)
        if episode_match and current_entry is not None:
            is_watched = episode_match.group("checked").lower() == "x"
            episode_title, episode_time = split_episode_body(episode_match.group("body"))
            episode_title = clean_episode_text(episode_title)
            episode_time = clean_episode_text(episode_time)

            episode_entry = {
                "title": episode_title,
                "time": episode_time,
            }
            episode_entry = merge_existing_episode_data(episode_entry, current_existing)

            current_entry["episodeDetails"].append(episode_entry)
            current_entry["episodes"] += 1

    for era in imported:
        for entry in era["entries"]:
            season_count = derive_seasons([ep["title"] for ep in entry["episodeDetails"]])
            if season_count is not None and "show" in entry["type"].lower():
                entry["seasons"] = season_count

            if entry["episodes"] == 0:
                entry["episodes"] = 1

    return imported


def main():
    if SOURCE_JSON_PATH.exists():
        BACKUP_JSON_PATH.write_text(SOURCE_JSON_PATH.read_text(encoding="utf-8"), encoding="utf-8")

    markdown_text = MARKDOWN_PATH.read_text(encoding="utf-8")
    era_colors, title_metadata, title_type_release_metadata, title_fallback_metadata = load_existing_metadata(SOURCE_JSON_PATH)
    manifest = load_manifest(MANIFEST_PATH)
    imported = build_import_data(
        markdown_text,
        era_colors,
        title_metadata,
        title_type_release_metadata,
        title_fallback_metadata,
        manifest,
    )
    save_manifest(manifest, MANIFEST_PATH)

    OUTPUT_JSON_PATH.write_text(
        json.dumps(imported, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    SOURCE_JSON_PATH.write_text(
        json.dumps(imported, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(
        f"Imported {len(imported)} eras into {OUTPUT_JSON_PATH.name} "
        f"and updated {SOURCE_JSON_PATH.name} (backup: {BACKUP_JSON_PATH.name})"
    )


if __name__ == "__main__":
    main()
