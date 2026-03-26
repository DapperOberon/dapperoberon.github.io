# Verification

This project now has a lightweight verification pass built from small local scripts instead of a larger test framework.

## Commands

Run the full verification pass:

```bash
bash star-wars-timeline/scripts/verify_all.sh
```

Run individual checks:

```bash
python3 star-wars-timeline/scripts/check_js_syntax.py
python3 star-wars-timeline/scripts/validate_timeline_data.py
python3 star-wars-timeline/scripts/validate_music_data.py
bash star-wars-timeline/scripts/smoke_test.sh
```

## What Each Check Covers

- `check_js_syntax.py`
  - Runs `node --check` across active JavaScript entrypoints and runtime modules.
- `validate_timeline_data.py`
  - Validates the structure of `data/timeline-data.json`
  - Checks required fields, URL shape, poster file existence, and duplicate ids
  - Prints non-fatal warnings for partial `episodeDetails` coverage
- `validate_music_data.py`
  - Validates the structure of `data/music-data.json`
  - Checks track titles, duplicate sources, and referenced audio files
- `smoke_test.sh`
  - Starts a local HTTP server
  - Verifies the main app route, support pages, data payloads, and key assets over HTTP

## Notes

- The timeline validator allows partial `episodeDetails` coverage for entries that do not yet have episode-by-episode metadata for every episode.
- That condition is reported as a warning instead of a hard failure so the verification pass stays useful during incremental data updates.
