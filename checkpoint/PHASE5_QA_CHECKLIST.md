# Checkpoint Phase 5 QA Checklist

Updated: `2026-04-14`

This checklist drives the final Phase 5 browser closeout pass. Most of the Steam import implementation is already hardened by automated coverage; this pass is about confirming the real user flow locally and in production without hidden regressions.

## Closeout Sweep

- [ ] Run the full sweep locally.
- [ ] Re-run the highest-risk checks against production after the latest worker deploy.
- [ ] Capture any new findings and immediately convert repeatable issues into automated checks.

## Owned Library Import

- [ ] Preview resolves a Steam profile URL or SteamID64 into the correct account.
- [ ] Preview summary tiles render total, played, unplayed, recent, existing, review, and new counts.
- [ ] `Review Rules` and `Go To Review` buttons advance correctly from Preview.
- [ ] `Back To Preview` and `Continue To Review` work from Rules.
- [ ] `Back To Rules` and `Prepare Import` work from Review.
- [ ] `Back To Review` and final import CTA work from Import.
- [ ] Recently played titles can propose `Playing` without forcing the status.
- [ ] Exact Steam AppID matches merge safely instead of duplicating entries.
- [ ] Repeat owned-library import does not create duplicate entries.
- [ ] Existing Checkpoint playtime and status remain intact after Steam merges.

## Wishlist Import

- [ ] Steam wishlist URL import resolves through Steam's wishlist API rather than treating the URL as a title row.
- [ ] Preview summary tiles render total parsed, AppID-backed rows, title-only rows, existing, review, and new counts.
- [ ] `Go To Review` works from Wishlist Preview.
- [ ] Review rows propose `Wishlist`, never `Backlog`.
- [ ] Sparse Steam wishlist rows fall back safely:
  - AppID placeholder remains inspectable when unresolved
  - IGDB suggestion can supply a better preview title when available
- [ ] Existing Wishlist conflicts stay reviewable instead of duplicating entries.
- [ ] Repeat wishlist import does not create duplicate wishlist entries.

## Maintenance + Enrichment

- [ ] Library-wide metadata refresh shows numeric progress and visible bar fill.
- [ ] Library-wide artwork refresh shows numeric progress and visible bar fill.
- [ ] Library-wide pricing refresh shows numeric progress and visible bar fill.
- [ ] Bulk refresh notice updates do not re-trigger card hover animations.
- [ ] `Refresh Game Data (This Entry)` can promote Steam App placeholder titles into full IGDB-backed entries.
- [ ] `Refresh Pricing Data (This Entry)` works for both pre-existing and Steam-imported titles.
- [ ] Successfully enriched `steam-*` entries promote to canonical `igdb-*` identities.

## Cross-Surface Cohesion

- [ ] Discover, Wishlist, and Library details use the intended maintenance action split.
- [ ] Screenshot modal opens the correct gallery after switching between games.
- [ ] Wishlist maintenance panel stays in the same left-column layout as Library.
- [ ] Source labels and relevant links remain consistent after Steam import and IGDB promotion.
- [ ] Back/forward behavior remains correct across:
  - import steps
  - discover results
  - library details
  - wishlist details

## Messaging + UX Polish

- [ ] Preview copy reads as clearly read-only and non-destructive.
- [ ] Review copy explains unresolved titles, merge, skip, and review behavior in plain language.
- [ ] Complete step summary explains what was added, merged, skipped, and enriched.
- [ ] Any remaining sparse or unresolved Steam rows feel intentional rather than broken.

## Exit Criteria

- [ ] No new blocking issues are found in the closeout sweep.
- [ ] Any newly discovered repeatable issue has an automated regression check or an explicit follow-up todo.
- [ ] Phase 5 is ready to close and hand off to Phase 6 planning.
