# Agent Loop Tasks

Generated: `2026-04-10T14:51:40.058Z`

## Status

Loop is green. Phase 4 is closed; Phase 5 planning is active.

## Active Phase

- [x] Begin Phase 5 Steam import implementation from `PHASE5_STEAM_IMPORT_PLAN.md`.
- [x] Track implementation tasks in `PHASE5_STEAM_IMPORT_CHECKLIST.md`.
- [x] Start with Settings import shell + transient import state before committing imported games.
- [x] Add Steam data model normalization fields without changing import commit behavior.
- [x] Add worker Steam owned-library/profile-resolution API foundation.
- [x] Connect owned-library preview UI to the worker without committing imported games.
- [x] Add import rules state and controls before conflict review.
- [x] Build matching/conflict review actions on top of the preview candidates.
- [x] Commit selected owned-library candidates into Checkpoint without overwriting local progress or creating duplicates.
- [x] Surface Steam playtime in Library details without taking over editable Checkpoint progress.
- [x] Queue imported titles for IGDB-first enrichment and pricing/media convergence.
- [ ] Next Phase 5 slice: build best-effort Steam wishlist import with parse/review flow.

## Keep Tightening

- [ ] Run final manual browser QA sweep (local + production).
- [ ] Convert any repeated manual QA findings into automated checks.
- [ ] Keep `PHASE3_QA_CHECKLIST.md` and deployment checklist in sync with actual state.
