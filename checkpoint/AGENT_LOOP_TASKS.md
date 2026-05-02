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
- [x] Build best-effort Steam wishlist import with parse/review flow.
- [x] Phase 5K.1: Expand automated Steam import fixtures for owned-library, wishlist, worker-failure, and sparse-title cases.
- [x] Phase 5K.2: Add regression coverage for repeat-import safety, no-overwrite behavior, and enrichment promotion of Steam App placeholder titles.
- [x] Phase 5K.3: Add UI regression coverage for bulk-refresh progress, modal correctness, and cross-surface maintenance layout consistency.
- [x] Phase 5K.4: Add smoke-stage coverage for Steam import mock payloads.
- [x] Phase 5K.5: Run manual QA for owned-library import, wishlist import, maintenance refresh flows, and post-import cross-surface cohesion.
- [x] Phase 5K.6: Promote successfully enriched `steam-...` entries to canonical IGDB identities without losing Steam metadata or user-tracked entry data.
- [x] Phase 5K.7: Polish import/review messaging for unresolved titles and import summaries.

## Keep Tightening

- [ ] Run final manual browser QA sweep (local + production) using `PHASE5_QA_CHECKLIST.md`.
- [ ] Confirm Steam import navigation controls (`back`, `continue`, `prepare import`, `start another preview`) in the browser, not just render tests.
- [ ] Spot-check post-promotion `steam-* -> igdb-*` identity behavior in production after latest worker deploy.
- [ ] Convert repeated Steam import/manual QA findings into automated checks immediately after they are discovered.
- [ ] Keep `PHASE3_QA_CHECKLIST.md` and deployment checklist in sync with actual state.
