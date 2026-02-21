import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
MARKDOWN_PATH = ROOT / "Chronological Viewing Order.md"
SOURCE_JSON_PATH = ROOT / "timeline-data.json"
OUTPUT_JSON_PATH = ROOT / "timeline-data-imported.json"
BACKUP_JSON_PATH = ROOT / "timeline-data.backup.json"


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


def generate_stable_entry_id(era_name: str, title: str, media_type: str, year: str, release_year: str, used_ids: dict) -> str:
    era_token = normalize_id_token(era_name) or "era"
    title_token = normalize_id_token(title) or "entry"
    type_token = media_type_token(media_type)
    chronology_source = year if year else release_year
    chronology_token = normalize_id_token(chronology_source) or "unknown"

    base_id = f"{era_token}__{title_token}__{type_token}__{chronology_token}"
    count = used_ids.get(base_id, 0) + 1
    used_ids[base_id] = count
    if count == 1:
        return base_id
    return f"{base_id}--{count}"


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
        year_match = re.match(r"^(?P<title>.+?)\s+(?P<year>(?:\d+(?:-\d+)?\s*(?:BBY|ABY)|between\s+.+|approx\.?.+|Various))$", head, flags=re.IGNORECASE)
        if year_match:
            title = year_match.group("title").strip()
            year = year_match.group("year").strip()

    return {
        "title": title.strip(),
        "year": year.strip(),
        "meta": meta,
    }


def split_episode_body(body: str):
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


def load_existing_metadata(path: Path):
    if not path.exists():
        return {}, {}

    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    era_colors = {}
    title_metadata = {}
    title_fallback_metadata = {}

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
            metadata = {
                "poster": entry.get("poster", ""),
                "synopsis": entry.get("synopsis", ""),
                "id": entry.get("id", ""),
            }
            title_metadata[key] = metadata
            title_fallback_metadata[norm] = metadata

    return era_colors, title_metadata, title_fallback_metadata


def build_import_data(markdown_text: str, era_colors: dict, title_metadata: dict, title_fallback_metadata: dict):
    imported = []
    current_era = None
    current_entry = None
    used_ids = {}

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
            continue

        media_header = parse_media_header(stripped)
        if media_header and current_era is not None:
            media_title = media_header["title"]
            media_year = media_header["year"]
            release_year, media_type, is_canon = split_meta(media_header["meta"])

            metadata_key = build_entry_key(media_title, media_year, media_type, release_year)
            existing = title_metadata.get(metadata_key, {})
            if not existing:
                normalized = normalize_title(media_title)
                existing = title_fallback_metadata.get(normalized, {})

            poster = existing.get("poster") or f"./images/posters/{title_to_slug(media_title)}-poster.jpg"
            synopsis = existing.get("synopsis", "")
            stable_id = existing.get("id") or generate_stable_entry_id(
                current_era["era"],
                media_title,
                media_type,
                media_year,
                release_year,
                used_ids,
            )

            current_entry = {
                "id": stable_id,
                "title": media_title,
                "year": media_year,
                "type": media_type,
                "canon": is_canon,
                "poster": poster,
                "episodes": 0,
                "watched": 0,
                "releaseYear": release_year,
                "episodeDetails": [],
            }

            if synopsis:
                current_entry["synopsis"] = synopsis

            current_era["entries"].append(current_entry)
            continue

        episode_match = EPISODE_RE.match(stripped)
        if episode_match and current_entry is not None:
            is_watched = episode_match.group("checked").lower() == "x"
            episode_title, episode_time = split_episode_body(episode_match.group("body"))
            episode_title = clean_episode_text(episode_title)
            episode_time = clean_episode_text(episode_time)

            current_entry["episodeDetails"].append(
                {
                    "title": episode_title,
                    "time": episode_time,
                }
            )
            current_entry["episodes"] += 1
            if is_watched:
                current_entry["watched"] += 1

    for era in imported:
        for entry in era["entries"]:
            season_count = derive_seasons([ep["title"] for ep in entry["episodeDetails"]])
            if season_count is not None and "show" in entry["type"].lower():
                entry["seasons"] = season_count

            if entry["episodes"] == 0:
                entry["episodes"] = 1

    return imported


def main():
    if SOURCE_JSON_PATH.exists() and not BACKUP_JSON_PATH.exists():
        BACKUP_JSON_PATH.write_text(SOURCE_JSON_PATH.read_text(encoding="utf-8"), encoding="utf-8")

    markdown_text = MARKDOWN_PATH.read_text(encoding="utf-8")
    era_colors, title_metadata, title_fallback_metadata = load_existing_metadata(SOURCE_JSON_PATH)
    imported = build_import_data(markdown_text, era_colors, title_metadata, title_fallback_metadata)

    OUTPUT_JSON_PATH.write_text(
        json.dumps(imported, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"Imported {len(imported)} eras into {OUTPUT_JSON_PATH.name}")


if __name__ == "__main__":
    main()
