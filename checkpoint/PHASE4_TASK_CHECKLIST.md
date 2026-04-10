# Checkpoint Phase 4 Task Checklist (Pricing + Wishlist Watch)

This checklist translates `PHASE4_PRICING_PLAN.md` into implementation tasks.
For wishlist meaning/decision UX scope, also use `PHASE4_WISHLIST_CHECKLIST.md`.
For information architecture migration, also use `PHASE4_IA_MIGRATION_CHECKLIST.md`.

## Phase 4A: Pricing Foundation

- [x] Add pricing service adapter entry point (`services/pricing.js`).
- [x] Add provider modules:
  - `services/pricing-itad.js`
  - `services/pricing-mock.js`
- [x] Add schema fields for:
  - `library[].priceWatch`
  - `catalog[].pricing`
- [x] Add normalization defaults for new pricing fields.
- [x] Add migration behavior for existing saves:
  - wishlist entries => `priceWatch.enabled = true`
  - non-wishlist entries => `priceWatch.enabled = false`

Definition of done:
- App loads existing backups without errors and new pricing fields are present with safe defaults.

## Phase 4B: Provider Integration (IsThereAnyDeal MVP)

- [x] Implement title search to provider game match flow.
- [x] Implement current best price/deal resolution for matched titles.
- [x] Normalize provider payloads into canonical `catalog[].pricing` shape.
- [x] Handle provider result states:
  - `ok`
  - `no_match`
  - `unsupported`
  - `error`
- [x] Add provider attribution metadata (`provider`, `providerGameId`, `lastCheckedAt`, `reason`).

Definition of done:
- Wishlist titles can fetch and store normalized current price info via IsThereAnyDeal.

## Phase 4C: Wishlist Price Watch UI

- [x] Add wishlist price display in Library:
  - current price
  - store name
  - discount indicator (when available)
- [x] Add entry-level controls in Details:
  - watch enabled toggle
  - target price input
  - per-entry price refresh action
- [x] Add Settings maintenance action:
  - `Refresh Prices (Library-wide)`
- [x] Add fallback UI copy for:
  - no match
  - unsupported
  - provider unavailable

Definition of done:
- User can view and control watch settings for wishlist entries without leaving core run-tracking flow.

## Phase 4D: Watch Evaluation + Alerts

- [x] Implement watch evaluation logic:
  - if `priceWatch.enabled`
  - and `targetPrice` exists
  - and `currentBest.amount <= targetPrice`
- [x] Emit in-app toast/notice when threshold is met.
- [x] Write activity history entry for threshold hits.
- [x] Add debounce guard using `priceWatch.lastNotifiedAt`.

Definition of done:
- Price-watch alerts trigger once per refresh cycle and do not spam on repeated checks.

## Phase 4E: Quality + Hardening

- [x] Add test coverage for:
  - provider match success/failure
  - wishlist default behavior
  - threshold trigger logic
  - no-match/unsupported/error UI states
- [x] Add smoke-check step for pricing adapter/mocks.
- [x] Validate that entry CRUD and sync flows are unaffected by pricing additions.
- [x] Add docs for:
  - provider scope limits (MVP is aggregator-first, PC-leaning)
  - meaning of each pricing status

Definition of done:
- Pricing features are stable, non-blocking, and documented.

## Phase 4F: URL Routing + Page Slugs

- [x] Add route model for surface URLs:
  - `/checkpoint/library/`
  - `/checkpoint/discover/`
  - `/checkpoint/discover/search/?query=...`
  - `/checkpoint/wishlist/`
  - `/checkpoint/settings/`
- [x] Add game detail slug routes:
  - `/checkpoint/library/game/?id=...`
  - `/checkpoint/discover/game/?id=...`
  - `/checkpoint/wishlist/game/?id=...`
- [x] Sync app state -> URL on view/details transitions.
- [x] Sync URL -> app state on refresh/deep-link/popstate.
- [x] Keep `/checkpoint/` mapped to library surface for compatibility.

Definition of done:
- Surface URLs are shareable and refresh-safe.

## Phase 4G: Document Scroll + Screenshot Compatibility

- [x] Replace internal page scroll containers with document flow scrolling.
- [x] Keep modal scrolling/focus trap behavior intact.
- [x] Validate sticky header and right rails under document scrolling.
- [x] Verify Firefox full-page screenshot captures full content (not viewport-only).
- [x] Fix full-page capture mismatch where fixed top nav/header may be missing from screenshots.

Definition of done:
- App pages use document scroll and full-page screenshot behavior is reliable.

## Phase 4H: Discover + Wishlist Convergence and Media Source Policy

- [x] Fix direct `/checkpoint/discover/` route behavior so initial top/trending results auto-load when no active query exists.
- [x] Remove placeholder wishlist store labels for unreleased/coming-soon rows in library cards (no synthetic `Release pending` store name).
- [x] Switch to IGDB-first media hydration in metadata resolver (hero/cover/screenshots) with SteamGrid as fallback only when IGDB media is missing.
- [x] Ensure discover search/detail rendering prefers IGDB media URLs before SteamGrid fallback fields.
- [x] Reuse the Discover detail template for Wishlist in the first-pass convergence:
  - same hero shell
  - same local nav
  - same body section order
  - same side rail structure
- [x] Refactor Discover detail renderer into shared decision-detail functions/modules so Wishlist calls the exact same code path.
- [x] Replace wishlist-specific body helpers with shared decision-detail renderer usage.
- [x] Keep surface-specific variation injection limited to hero CTA config and surface copy only.
- [x] Limit first-pass Wishlist differences to:
  - hero CTA cluster
  - pricing/watch copy and controls
  - remove run-management actions/fields
- [x] Split detail actions by surface responsibility:
  - Discover: `Add to Wishlist`, `Add to Library`
  - Wishlist: `Watch controls`, `Move to Library`, `Remove`
- [x] Remove legacy wishlist/library-style detail sections that diverge from Discover:
  - `Wishlist Context`
  - standalone `Notes`
  - standalone `Maintenance`
- [x] Add self-healing tracked-game detail hydration:
  - infer `igdbId` for older tracked games when missing
  - auto-fetch/persist richer Discover-style IGDB payload on detail open when key decision fields are missing
  - skip re-fetch when tracked game is already complete enough
- [x] Add regression checks for media-source ordering:
  - IGDB image used when present
  - SteamGrid used only when IGDB asset missing
  - no mixed-source flicker during lazy hydration
- [x] Add QA fixtures for coming-soon/unreleased wishlist cards to verify blank store label behavior remains stable.

Definition of done:
- Discover and Wishlist use a consistent decision-first structure, and media sourcing is deterministic (IGDB primary, SteamGrid fallback).

## Phase 4I: Wishlist Decision Signals

- [x] Add `wishlistPriority` and `wishlistIntent` to normalized wishlist entries.
- [x] Apply safe migration defaults for existing wishlist entries.
- [x] Add wishlist detail controls so users can edit priority/intent alongside price-watch settings.
- [x] Render wishlist priority/intent on wishlist cards with human-readable labels.
- [x] Add wishlist-specific sort/filter preferences and persist them in UI state.
- [x] Add first-pass wishlist decision controls:
  - sort by next to buy
  - sort by priority
  - sort by recent
  - sort by lowest price
  - filter by priority
  - filter by intent
- [x] Add second-pass wishlist decision controls:
  - [x] sort by biggest discount
  - [x] sort by closest to target
  - [x] filter by price status
  - selected-stores-only filter explicitly deferred (Phase 5 / power-user slice)

Definition of done:
- Wishlist can answer both "how much do I care?" and "what am I waiting for?" directly in cards, details, and top-level controls.

## Phase 4J: Wishlist Surface Cleanup

- [x] Align wishlist cards to the simpler Discover card rhythm.
- [x] Fix fixed-height title alignment so price/store rows share a baseline across cards.
- [x] Remove over-designed priority/intent card treatments when they add noise instead of scan value.
- [x] Simplify the wishlist top controls into a calmer planning toolbar.
- [x] Run a final visual QA pass on wishlist density and sorting behavior in real use.

Definition of done:
- Wishlist reads as a buying/planning surface rather than a mini dashboard.

## Phase 4K: Release-Aware Wishlist States

- [x] Define a shared release-state model:
  - `released`
  - `releasing-soon`
  - `coming-soon`
  - `tbd`
- [x] Use release-aware fallback labels in wishlist cards instead of treating unreleased entries like pricing failures.
- [x] Use release-aware provider status copy in wishlist pricing/watch panels.
- [x] Update shared Discover/Wishlist decision hero to show release-state labels and countdown/detail text.
- [x] Add release-aware regression coverage and fixtures for future-dated, announced-without-date, and true-TBD titles.

Definition of done:
- Upcoming wishlist entries read intentionally, and unreleased titles no longer look like provider failures.

## Explicit Out of Scope (Phase 4)

- [x] Email/push notifications (defer).
- [x] Multi-currency conversion engine (defer).
- [x] Direct storefront API integrations (defer).
- [x] Multi-provider blending/arbitration (defer).
- [x] Selected-stores-only wishlist filter (defer to Phase 5 power-user controls).

---

## Final Phase 4 Exit Criteria

- [x] Wishlist entries can fetch and display normalized current prices.
- [x] Users can configure target-price watch per entry.
- [x] In-app alerts and activity entries fire when targets are met.
- [x] Existing tracking/sync behavior remains stable.
- [x] URL routing/slugs are stable for library/discover/wishlist/settings and game details.
- [x] Full-document rendering is in place (no internal page-scroll dependency).
