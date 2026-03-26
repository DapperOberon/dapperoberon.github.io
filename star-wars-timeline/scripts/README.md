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
  - Reuses manifest-backed `base36-3` UIDs from `data/uid-manifest.json`
  - Does not write shared watched state into the live data file
  - Writes:
    - `archive/timeline-data-imported.json`
    - `archive/timeline-data.backup.json`

## Verification Scripts

- `check_js_syntax.py`
  - Runs `node --check` across active JavaScript files

- `validate_timeline_data.py`
  - Validates `data/timeline-data.json`
  - Enforces the `base36-3` UID format and optional `storageMigrationIds`

- `validate_music_data.py`
  - Validates `data/music-data.json`

- `smoke_test.sh`
  - Starts a local HTTP server and checks the main routes and assets

- `verify_all.sh`
  - Runs the full verification pass

## UID Migration Scripts

- `uid_manifest.py`
  - Shared helpers for UID manifest generation and lookup

- `sync_uid_manifest.py`
  - Creates or updates `data/uid-manifest.json`
  - Reuses existing manifest entries so reruns stay deterministic

- `migrate_entry_uids.py`
  - Applies manifest-backed UIDs to `data/timeline-data.json`
  - Writes `archive/timeline-data.pre-uid-migration.json`
  - Preserves prior slug ids in `storageMigrationIds` for localStorage watched-state migration
  - Intended as a one-time migration utility, not the normal import workflow

## Archive Policy

- Keep only currently useful scripts in this folder
- Move one-off or superseded extractors to `archive/scripts/`
- Treat `archive/scripts/` as historical reference, not the default workflow
