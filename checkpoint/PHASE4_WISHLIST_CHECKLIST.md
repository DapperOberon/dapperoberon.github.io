# Checkpoint Phase 4 Wishlist Meaningfulness Checklist

This checklist defines what makes the Wishlist page genuinely useful for decisions, not just storage.

## Phase 4W.1: Decision Model (Intent + Priority)

- [x] Add `wishlistPriority` to `library[]`:
  - `low | medium | high | must-buy`
- [x] Add `wishlistIntent` to `library[]`:
  - `buy-now | wait-sale | monitor-release | research`
- [x] Keep `priceWatch.targetPrice` as optional threshold.
- [x] Add migration defaults for existing wishlist entries:
  - `wishlistPriority = medium`
  - `wishlistIntent = wait-sale`
- [x] Add wishlist detail controls for:
  - `Priority`
  - `Intent`
- [x] Render human-readable priority and intent signals on wishlist cards.

Definition of done:
- Every wishlist entry has a clear “why it is on my wishlist” and a purchase urgency signal.

## Phase 4W.2: Price Intelligence UX

- [x] Keep pricing source of truth as:
  - `catalog[].pricing.currentBest`
  - `catalog[].pricing.storeRows`
- [x] Remove deprecated `preferredStoreCurrent` from app model + worker payload usage.
- [x] In Wishlist details, show a compact table with:
  - Store
  - Price
  - % Off
  - Link (optional icon/button)
- [x] In Wishlist cards, show:
  - best selected-store price
  - store name
  - discount (if present)
- [x] Do not render synthetic store labels for coming-soon/TBD cards (keep store name blank when no concrete store price exists).

Definition of done:
- User can immediately see “best current option” and whether data is fresh enough to trust.

## Phase 4W.3: Release-Aware States

- [x] Normalize release display states for wishlist:
  - `released`
  - `releasing-soon` (future dated)
  - `coming-soon` (unknown date but announced)
  - `tbd`
- [x] If no pricing exists and release is future/TBD, show:
  - `Coming soon` or `TBD`
  - never show `unsupported` in this case
- [x] Add release countdown (when date is known and future).
- [x] Decline extra “Release pending” sublabel in cards to keep wishlist cards visually calm.

Definition of done:
- Wishlist entries cleanly differentiate “not priced yet” from true provider failure.

## Phase 4W.4: Watch Actions + Signal Quality

- [x] Keep per-entry controls in details:
  - enable/disable watch
  - target price
  - currency
  - refresh price (this entry)
- [x] Keep library-wide action:
  - `Refresh Prices (Library-wide)`
- [x] Trigger toasts/activity only on meaningful events:
  - target hit
  - newly improved deal threshold explicitly deferred
- [x] Anti-spam guard fields:
  - `lastNotifiedAt`
- [x] Add cooldown (12h) for repeated notifications without material change.

Definition of done:
- Alerts are useful and timely without notification fatigue.

## Phase 4W.5: Sorting + Filtering That Supports Buying Decisions

- [x] Add first-pass wishlist sort options:
  - [x] next to buy
  - priority
  - recently updated
  - price (low to high)
- [x] Add first-pass wishlist filters:
  - priority
  - intent
- [x] Persist wishlist sort/filter UI preferences locally.
- [x] Ensure search + filter + sort compose correctly.
- [x] Add second-pass wishlist sort options:
  - [x] biggest discount
  - [x] closest to target
- [x] Add second-pass wishlist filters:
  - [x] price status (`on-sale | full-price | coming-soon | no-data`)

Definition of done:
- User can answer “what should I buy next?” in 1-2 interactions.

## Phase 4W.6: Store Selection Reliability

- [x] Persist ITAD store list cache and selected store IDs in local state.
- [x] Validate selected IDs against current ITAD store list on load.
- [x] Ensure details table only renders selected stores.
- [x] Ensure stored pricing rows only include selected stores after refresh.

Definition of done:
- Store preferences remain stable across refreshes and drive consistent table/card output.

## Phase 4W.7: Sync, Backup, and Restore Integrity

Phase 4 ships without a dedicated wishlist-only sync/export verification slice. That hardening is deferred beyond Phase 4 and tracked below.

## Phase 4W.8: UI Cohesion + Readability

- [x] Keep wishlist card hierarchy:
  - Cover -> Title -> Price signal -> Secondary metadata
- [x] Never show run-only fields on wishlist/backlog:
  - run title
  - playtime
  - completion
- [x] Reuse the Discover detail template for Wishlist as the first-pass baseline:
  - same hero shell
  - same section order
  - same right rail shape
- [x] Ensure Wishlist does not maintain a forked body renderer:
  - call the same shared decision-detail render functions/modules as Discover
  - vary only hero CTAs and surface-specific copy
- [x] Keep Wishlist-specific differences limited to:
  - hero CTAs
  - price/watch labels and controls
- [x] Remove legacy wishlist-only/library-like detail sections that break Discover parity:
  - `Wishlist Context`
  - standalone `Notes`
  - standalone `Maintenance`
- [x] Keep wishlist details as 1 strong pricing/watch section (table + controls), not nested mini panels.
- [x] Ensure pricing controls match global CTA/button system from `DESIGN.md`.
- [x] Auto-hydrate missing Discover-style decision data for tracked wishlist games on detail open:
  - relevant links
  - screenshots
  - videos
  - related titles
  - persist locally after first successful hydrate
- [x] Align wishlist card layout rhythm to Discover cards:
  - cover-first presentation
  - fixed title block for baseline alignment
  - one quiet metadata row beneath the title
- [x] Simplify top wishlist controls into a planning toolbar:
  - no duplicate wishlist hero/header treatment
  - compact summary
  - utility-first filter/sort layout
- [x] Run a final visual QA pass on wishlist card density and footer alignment.

## Phase 4W.10: Discover/Wishlist Shared Decision Template (New)

- [x] Define the shared detail-template contract as the current Discover page:
  - hero
  - local section rail
  - price snapshot
  - full game details
  - media blocks
  - related titles
  - right rail links/details
- [x] Keep shared sections visually identical between Discover and Wishlist where intent overlaps.
- [x] Keep surface-specific action blocks distinct:
  - Discover decision actions
  - Wishlist watch/buying actions
- [x] Ensure shared-template changes do not reintroduce run-workspace fields in Wishlist detail.

Definition of done:
- Wishlist and Discover feel like siblings in one decision system, while preserving clear action differences.

Definition of done:
- Wishlist feels like a first-class buying/planning surface, visually consistent with the app.

## Phase 4W.9: QA and Regression Guardrails

- [x] Add smoke checks for:
  - selected-store table rows render
  - coming-soon/TBD states
  - target-hit notification guard
  - library/detail price consistency
- [x] Add fixture scenarios:
  - no match
  - no price data
  - stale selected store ids
- [x] Add manual QA checklist for:
  - settings -> refresh -> library -> details flow
  - local restore and Drive restore behavior

Definition of done:
- Wishlist pricing remains stable through normal usage and future refactors.

---

## Phase 4 Wishlist Exit Criteria

- [x] Wishlist entries carry intent and priority (not just status).
- [x] Price watch shows selected-store table rows with reliable data.
- [x] Release-aware states correctly distinguish TBD/Coming Soon from failures.
- [x] Alerts are meaningful and anti-spam for the implemented Phase 4 threshold-hit path.
- [x] QA coverage exists for core wishlist pricing and watch regressions.

## Deferred Beyond Phase 4

- `budgetBucket` quick-filter label.
- pricing freshness badge / stale threshold.
- richer anti-spam metadata (`lastNotifiedPrice`, `lastNotifiedStoreId`).
- selected-stores-only wishlist filter.
- bulk ITAD store selection actions (`Select Recommended`, `Select None`).
- dedicated export/import/Drive restore verification for wishlist-only decision fields.
