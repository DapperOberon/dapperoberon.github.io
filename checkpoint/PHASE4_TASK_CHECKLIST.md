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

- [ ] Implement title search to provider game match flow.
- [ ] Implement current best price/deal resolution for matched titles.
- [ ] Normalize provider payloads into canonical `catalog[].pricing` shape.
- [ ] Handle provider result states:
  - `ok`
  - `no_match`
  - `unsupported`
  - `error`
- [ ] Add provider attribution metadata (`provider`, `providerGameId`, `lastCheckedAt`, `reason`).

Definition of done:
- Wishlist titles can fetch and store normalized current price info via IsThereAnyDeal.

## Phase 4C: Wishlist Price Watch UI

- [ ] Add wishlist price display in Library:
  - current price
  - store name
  - discount indicator (when available)
- [ ] Add entry-level controls in Details:
  - watch enabled toggle
  - target price input
  - per-entry price refresh action
- [ ] Add Settings maintenance action:
  - `Refresh Prices (Library-wide)`
- [ ] Add fallback UI copy for:
  - no match
  - unsupported
  - provider unavailable

Definition of done:
- User can view and control watch settings for wishlist entries without leaving core run-tracking flow.

## Phase 4D: Watch Evaluation + Alerts

- [ ] Implement watch evaluation logic:
  - if `priceWatch.enabled`
  - and `targetPrice` exists
  - and `currentBest.amount <= targetPrice`
- [ ] Emit in-app toast/notice when threshold is met.
- [ ] Write activity history entry for threshold hits.
- [ ] Add debounce guard using `priceWatch.lastNotifiedAt`.

Definition of done:
- Price-watch alerts trigger once per refresh cycle and do not spam on repeated checks.

## Phase 4E: Quality + Hardening

- [ ] Add test coverage for:
  - provider match success/failure
  - wishlist default behavior
  - threshold trigger logic
  - no-match/unsupported/error UI states
- [ ] Add smoke-check step for pricing adapter/mocks.
- [ ] Validate that entry CRUD and sync flows are unaffected by pricing additions.
- [ ] Add docs for:
  - provider scope limits (MVP is aggregator-first, PC-leaning)
  - meaning of each pricing status

Definition of done:
- Pricing features are stable, non-blocking, and documented.

## Phase 4F: URL Routing + Page Slugs

- [x] Add route model for surface URLs:
  - `/checkpoint/library/`
  - `/checkpoint/discover/`
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
- [ ] Keep modal scrolling/focus trap behavior intact.
- [ ] Validate sticky header and right rails under document scrolling.
- [ ] Verify Firefox full-page screenshot captures full content (not viewport-only).
- [ ] Fix full-page capture mismatch where fixed top nav/header may be missing from screenshots.

Definition of done:
- App pages use document scroll and full-page screenshot behavior is reliable.

## Explicit Out of Scope (Phase 4)

- [ ] Email/push notifications (defer).
- [ ] Multi-currency conversion engine (defer).
- [ ] Direct storefront API integrations (defer).
- [ ] Multi-provider blending/arbitration (defer).

---

## Final Phase 4 Exit Criteria

- [ ] Wishlist entries can fetch and display normalized current prices.
- [ ] Users can configure target-price watch per entry.
- [ ] In-app alerts and activity entries fire when targets are met.
- [ ] Existing tracking/sync behavior remains stable.
- [ ] URL routing/slugs are stable for library/discover/wishlist/settings and game details.
- [ ] Full-document rendering is in place (no internal page-scroll dependency).
