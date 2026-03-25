#!/usr/bin/env python3

import argparse
import json
import re
import sys
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "timeline-data.json"
PROFILE_PATH = Path.home() / ".mozilla" / "firefox" / "rNdnMdOP.Profile 3"

ARIA_PATTERN = re.compile(
    r"Season\s+(?P<season>\d+)\s+Episode\s+(?P<episode>\d+)\s+(?P<title>.+?)\s+Rated\b",
    re.IGNORECASE,
)
EPISODE_CODE_PATTERN = re.compile(r"^(S\d+\.E\d+)", re.IGNORECASE)
SEASON_OPTION_PATTERN = re.compile(r"^Season\s+(\d+)$", re.IGNORECASE)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Import Disney+ play URLs into timeline-data.json for a series or film."
    )
    parser.add_argument("--entity-url", required=True, help="Disney+ browse/entity URL for the title")
    parser.add_argument(
        "--entry-id",
        action="append",
        dest="entry_ids",
        required=True,
        help="Timeline entry id to update; pass multiple times when chronology splits one title across entries",
    )
    parser.add_argument(
        "--film",
        action="store_true",
        help="Treat the entity as a film/single-play title instead of a multi-season series",
    )
    parser.add_argument(
        "--profile-path",
        default=str(PROFILE_PATH),
        help="Firefox profile path with an active Disney+ session",
    )
    return parser.parse_args()


def build_driver(profile_path):
    options = Options()
    options.add_argument("-profile")
    options.add_argument(str(profile_path))
    options.add_argument("-headless")
    driver = webdriver.Firefox(options=options)
    driver.set_page_load_timeout(60)
    return driver


def episode_key(season_number, episode_number, title):
    clean_title = " ".join((title or "").split()).strip()
    return f"S{season_number}.E{episode_number} - {clean_title}"


def episode_code(value):
    match = EPISODE_CODE_PATTERN.match(str(value or "").strip())
    return match.group(1).upper() if match else None


def parse_episode_link(anchor):
    href = anchor.get_attribute("href") or ""
    aria = anchor.get_attribute("aria-label") or ""
    text = anchor.text or ""
    match = ARIA_PATTERN.search(aria)
    if not href or not match:
        return None

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return None

    title_line = re.sub(r"^\d+\.\s*", "", lines[0]).strip()
    if not title_line:
        return None

    season_number = int(match.group("season"))
    episode_number = int(match.group("episode"))
    return episode_key(season_number, episode_number, title_line), href


def current_season_button(driver):
    buttons = driver.find_elements(By.XPATH, "//button[starts-with(normalize-space(),'Season ')]")
    return buttons[0] if buttons else None


def open_title_page(driver, entity_url):
    driver.get(entity_url)
    time.sleep(8)


def available_seasons(driver):
    season_button = current_season_button(driver)
    if season_button is None:
        anchors = driver.find_elements(By.CSS_SELECTOR, 'a[href*="/play/"][aria-label*="Season "]')
        seasons = set()
        for anchor in anchors:
            aria = anchor.get_attribute("aria-label") or ""
            match = ARIA_PATTERN.search(aria)
            if match:
                seasons.add(int(match.group("season")))
        return sorted(seasons) or [1]

    season_button.click()
    options = WebDriverWait(driver, 15).until(
        EC.presence_of_all_elements_located((By.XPATH, "//li[@role='option']"))
    )
    seasons = []
    for option in options:
        text = option.text.strip()
        match = SEASON_OPTION_PATTERN.match(text)
        if match:
            seasons.append(int(match.group(1)))
    current_season_button(driver).click()
    time.sleep(0.5)
    return sorted(set(seasons))


def select_season(driver, season_number):
    season_button = current_season_button(driver)
    if season_button is None:
        return
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(0.5)
    season_button.click()
    option = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.XPATH, f"//li[@role='option' and normalize-space()='Season {season_number}']"))
    )
    option.click()
    WebDriverWait(driver, 15).until(
        lambda d: current_season_button(d).text.strip() == f"Season {season_number}"
    )
    time.sleep(2)


def collect_season_links(driver, season_number):
    discovered = {}
    stable_passes = 0
    last_count = -1

    for _ in range(20):
        anchors = driver.find_elements(By.CSS_SELECTOR, 'a[href*="/play/"][aria-label*="Episode "]')
        for anchor in anchors:
            parsed = parse_episode_link(anchor)
            if not parsed:
                continue
            key, href = parsed
            if key.startswith(f"S{season_number}.E"):
                discovered[key] = href

        if len(discovered) == last_count:
            stable_passes += 1
        else:
            stable_passes = 0
            last_count = len(discovered)

        if stable_passes >= 2:
            break

        driver.execute_script("window.scrollBy(0, window.innerHeight * 0.9);")
        time.sleep(1.2)

    return discovered


def extract_series_links(driver, entity_url):
    open_title_page(driver, entity_url)
    WebDriverWait(driver, 30).until(
        lambda d: bool(d.find_elements(By.XPATH, "//button[starts-with(normalize-space(),'Season ')]"))
        or bool(d.find_elements(By.CSS_SELECTOR, 'a[href*="/play/"][aria-label*="Episode "]'))
    )
    season_links = {}
    for season_number in available_seasons(driver):
        select_season(driver, season_number)
        season_links.update(collect_season_links(driver, season_number))
    return season_links


def extract_film_link(driver, entity_url):
    open_title_page(driver, entity_url)
    anchors = driver.find_elements(By.CSS_SELECTOR, 'a[href*="/play/"]')
    for anchor in anchors:
        href = anchor.get_attribute("href") or ""
        text = (anchor.text or "").strip().upper()
        aria = (anchor.get_attribute("aria-label") or "").strip().upper()
        if text == "PLAY" or aria == "PLAY":
            return href
    for anchor in anchors:
        href = anchor.get_attribute("href") or ""
        aria = (anchor.get_attribute("aria-label") or "").lower()
        if "trailer" not in aria:
            return href
    return ""


def update_series_data(entry_ids, extracted_links):
    data = json.loads(DATA_PATH.read_text())
    updated = []
    missing = []
    extracted_by_code = {}

    for key, href in extracted_links.items():
        code = episode_code(key)
        if not code:
            continue
        extracted_by_code.setdefault(code, []).append((key, href))

    for section in data:
        for entry in section["entries"]:
            if entry.get("id") not in entry_ids:
                continue
            for episode in entry.get("episodeDetails", []):
                key = episode.get("title")
                href = extracted_links.get(key)
                if not href:
                    code = episode_code(key)
                    matches = extracted_by_code.get(code, [])
                    if len(matches) == 1:
                        _, href = matches[0]
                if href:
                    episode["disneyPlusUrl"] = href
                    updated.append((entry["id"], key, href))
                else:
                    missing.append((entry["id"], key))

    DATA_PATH.write_text(json.dumps(data, indent=2) + "\n")
    return updated, missing


def update_film_data(entry_ids, play_url):
    data = json.loads(DATA_PATH.read_text())
    updated = []

    for section in data:
        for entry in section["entries"]:
            if entry.get("id") not in entry_ids:
                continue
            entry["disneyPlusUrl"] = play_url
            if entry.get("episodeDetails"):
                entry["episodeDetails"][0]["disneyPlusUrl"] = play_url
            updated.append((entry["id"], entry.get("title", ""), play_url))

    DATA_PATH.write_text(json.dumps(data, indent=2) + "\n")
    return updated


def main():
    args = parse_args()
    driver = build_driver(Path(args.profile_path))
    try:
        if args.film:
            print("Extracting Disney+ film play URL...", file=sys.stderr)
            play_url = extract_film_link(driver, args.entity_url)
            if not play_url:
                raise SystemExit("No film play URL found.")
            updated = update_film_data(set(args.entry_ids), play_url)
            print(f"Updated {len(updated)} film entries in timeline-data.json.", file=sys.stderr)
            for entry_id, title, href in updated:
                print(f"{entry_id}\t{title}\t{href}")
            return

        print("Extracting Disney+ series play URLs...", file=sys.stderr)
        links = extract_series_links(driver, args.entity_url)
        print(f"Discovered {len(links)} episode play URLs.", file=sys.stderr)
        updated, missing = update_series_data(set(args.entry_ids), links)
        print(f"Updated {len(updated)} episode rows in timeline-data.json.", file=sys.stderr)
        print("Sample updated rows:")
        for entry_id, key, href in updated[:12]:
            print(f"{entry_id}\t{key}\t{href}")

        print("\nMissing rows:")
        for entry_id, key in missing[:40]:
            print(f"{entry_id}\t{key}")
        if len(missing) > 40:
            print(f"... and {len(missing) - 40} more")
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
