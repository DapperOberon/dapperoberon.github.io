#!/usr/bin/env python3

import json
import re
import sys
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "timeline-data.json"
PROFILE_PATH = Path.home() / ".mozilla" / "firefox" / "rNdnMdOP.Profile 3"
CLONE_WARS_ENTITY_URL = "https://www.disneyplus.com/browse/entity-314f14b4-b70a-4ec6-b634-2559f0b1f77e"
TARGET_ENTRY_IDS = {
    "fall-of-the-jedi__the-clone-wars__show__22-19-bby",
    "fall-of-the-jedi__the-clone-wars-22-19-bby__show__22-19-bby",
    "fall-of-the-jedi__the-clone-wars__show__22-19-bby--2",
    "reign-of-the-empire__the-clone-wars__show__22-19-bby",
}

ARIA_PATTERN = re.compile(
    r"Season\s+(?P<season>\d+)\s+Episode\s+(?P<episode>\d+)\s+(?P<title>.+?)\s+Rated\b",
    re.IGNORECASE,
)
EPISODE_CODE_PATTERN = re.compile(r"^(S\d+\.E\d+)", re.IGNORECASE)


def build_driver():
    options = Options()
    options.add_argument("-profile")
    options.add_argument(str(PROFILE_PATH))
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
    return driver.find_element(By.XPATH, "//button[starts-with(normalize-space(),'Season ')]")


def open_series_page(driver):
    driver.get(CLONE_WARS_ENTITY_URL)
    WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.XPATH, "//button[starts-with(normalize-space(),'Season ')]"))
    )
    time.sleep(2)


def select_season(driver, season_number):
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(0.5)
    current_season_button(driver).click()
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

    for _ in range(18):
        anchors = driver.find_elements(By.CSS_SELECTOR, 'a[href*="/play/"][aria-label*="Season "]')
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


def extract_all_episode_links():
    driver = build_driver()
    try:
        open_series_page(driver)
        season_links = {}
        for season_number in range(1, 8):
            select_season(driver, season_number)
            season_links.update(collect_season_links(driver, season_number))
        return season_links
    finally:
        driver.quit()


def update_timeline_data(extracted_links):
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
            if entry.get("id") not in TARGET_ENTRY_IDS:
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
                    episode["watchUrl"] = href
                    updated.append((entry["id"], key, href))
                else:
                    missing.append((entry["id"], key))

    DATA_PATH.write_text(json.dumps(data, indent=2) + "\n")
    return updated, missing


def main():
    print("Extracting Disney+ play URLs for The Clone Wars...", file=sys.stderr)
    links = extract_all_episode_links()
    print(f"Discovered {len(links)} episode play URLs.", file=sys.stderr)

    updated, missing = update_timeline_data(links)
    print(f"Updated {len(updated)} episode rows in data/timeline-data.json.", file=sys.stderr)
    print("Sample updated rows:")
    for entry_id, key, href in updated[:12]:
        print(f"{entry_id}\t{key}\t{href}")

    print("\nMissing rows:")
    for entry_id, key in missing[:40]:
        print(f"{entry_id}\t{key}")

    if len(missing) > 40:
        print(f"... and {len(missing) - 40} more")


if __name__ == "__main__":
    main()
