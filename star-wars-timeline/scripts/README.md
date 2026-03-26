# Scripts

This folder contains the supported active tooling for `star-wars-timeline/`.

## Import Scripts

- `import_disney_title.py`
  - Imports Disney+ play URLs into `data/timeline-data.json`
  - Input: Disney+ entity URL, one or more timeline entry ids
  - Prerequisites: Selenium, Firefox webdriver, and a logged-in Firefox profile

- `import_chronological_data.py`
  - Builds a generated chronology snapshot from `Chronological Viewing Order.md`
  - Reads existing metadata from `data/timeline-data.json`
  - Writes:
    - `archive/timeline-data-imported.json`
    - `archive/timeline-data.backup.json`

## Verification Scripts

- `check_js_syntax.py`
  - Runs `node --check` across active JavaScript files

- `validate_timeline_data.py`
  - Validates `data/timeline-data.json`

- `validate_music_data.py`
  - Validates `data/music-data.json`

- `smoke_test.sh`
  - Starts a local HTTP server and checks the main routes and assets

- `verify_all.sh`
  - Runs the full verification pass

## Archive Policy

- Keep only currently useful scripts in this folder
- Move one-off or superseded extractors to `archive/scripts/`
- Treat `archive/scripts/` as historical reference, not the default workflow
