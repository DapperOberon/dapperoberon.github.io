# Checkpoint Phase 4 Wishlist Meaningfulness Checklist

This checklist defines what makes the Wishlist page genuinely useful for decisions, not just storage.

## Phase 4W.1: Decision Model (Intent + Priority)

- [ ] Add `wishlistPriority` to `library[]`:
  - `low | medium | high | must-buy`
- [ ] Add `wishlistIntent` to `library[]`:
  - `buy-now | wait-sale | monitor-release | research`
- [ ] Keep `priceWatch.targetPrice` as optional threshold.
- [ ] Add optional `budgetBucket` label for quick filtering:
  - `under-10 | under-20 | under-40 | no-limit`
- [ ] Add migration defaults for existing wishlist entries:
  - `wishlistPriority = medium`
  - `wishlistIntent = wait-sale`
  - `budgetBucket = no-limit`

Definition of done:
- Every wishlist entry has a clear “why it is on my wishlist” and a purchase urgency signal.

## Phase 4W.2: Price Intelligence UX

- [ ] Keep pricing source of truth as:
  - `catalog[].pricing.currentBest`
  - `catalog[].pricing.storeRows`
- [ ] Remove deprecated `preferredStoreCurrent` from app model + worker payload usage.
- [ ] In Wishlist details, show a compact table with:
  - Store
  - Price
  - % Off
  - Link (optional icon/button)
- [ ] In Wishlist cards, show:
  - best selected-store price
  - store name
  - discount (if present)
- [ ] Add freshness indicator:
  - `lastCheckedAt`
  - stale badge threshold (ex: older than 24h)

Definition of done:
- User can immediately see “best current option” and whether data is fresh enough to trust.

## Phase 4W.3: Release-Aware States

- [ ] Normalize release display states for wishlist:
  - `released`
  - `releasing-soon` (future dated)
  - `coming-soon` (unknown date but announced)
  - `tbd`
- [ ] If no pricing exists and release is future/TBD, show:
  - `Coming soon` or `TBD`
  - never show `unsupported` in this case
- [ ] Add release countdown (when date is known and future).
- [ ] Show “Release pending” sublabel in cards when appropriate.

Definition of done:
- Wishlist entries cleanly differentiate “not priced yet” from true provider failure.

## Phase 4W.4: Watch Actions + Signal Quality

- [ ] Keep per-entry controls in details:
  - enable/disable watch
  - target price
  - currency
  - refresh price (this entry)
- [ ] Keep library-wide action:
  - `Refresh Prices (Library-wide)`
- [ ] Trigger toasts/activity only on meaningful events:
  - target hit
  - newly improved deal (optional threshold)
- [ ] Anti-spam guard fields:
  - `lastNotifiedAt`
  - `lastNotifiedPrice`
  - `lastNotifiedStoreId`
- [ ] Add cooldown (ex: 12h) for repeated notifications without material change.

Definition of done:
- Alerts are useful and timely without notification fatigue.

## Phase 4W.5: Sorting + Filtering That Supports Buying Decisions

- [ ] Add wishlist sort options:
  - biggest discount
  - lowest price
  - closest to target
  - priority
  - recently updated
- [ ] Add wishlist filters:
  - price status (`on-sale | full-price | coming-soon | no-data`)
  - priority
  - intent
  - selected stores only
- [ ] Persist wishlist sort/filter UI preferences locally.
- [ ] Ensure search + filter + sort compose correctly.

Definition of done:
- User can answer “what should I buy next?” in 1-2 interactions.

## Phase 4W.6: Store Selection Reliability

- [ ] Persist ITAD store list cache and selected store IDs in local state.
- [ ] Validate selected IDs against current ITAD store list on load.
- [ ] Add bulk actions:
  - `Select Recommended`
  - `Select None`
- [ ] Ensure details table only renders selected stores.
- [ ] Ensure stored pricing rows only include selected stores after refresh.

Definition of done:
- Store preferences remain stable across refreshes and drive consistent table/card output.

## Phase 4W.7: Sync, Backup, and Restore Integrity

- [ ] Include wishlist-specific fields in export/import:
  - `wishlistPriority`
  - `wishlistIntent`
  - `budgetBucket`
  - `priceWatch`
  - `catalog[].pricing`
- [ ] Include those fields in Drive sync payload and conflict resolution.
- [ ] After import/restore, queue pricing refresh for stale entries.
- [ ] Verify “include activity history” behavior for watch-trigger events.

Definition of done:
- Wishlist behavior survives restore/sync with no hidden state loss.

## Phase 4W.8: UI Cohesion + Readability

- [ ] Keep wishlist card hierarchy:
  - Cover -> Title -> Price signal -> Secondary metadata
- [ ] Never show run-only fields on wishlist/backlog:
  - run title
  - playtime
  - completion
- [ ] Keep wishlist details as 1 strong section (table + controls), not nested mini panels.
- [ ] Ensure pricing controls match global CTA/button system from `DESIGN.md`.

Definition of done:
- Wishlist feels like a first-class buying/planning surface, visually consistent with the app.

## Phase 4W.9: QA and Regression Guardrails

- [ ] Add smoke checks for:
  - selected-store table rows render
  - coming-soon/TBD states
  - target-hit notification guard
  - library/detail price consistency
- [ ] Add fixture scenarios:
  - no match
  - no price data
  - equal prices across stores
  - stale cached stores
- [ ] Add manual QA checklist for:
  - settings -> refresh -> library -> details flow
  - local restore and Drive restore behavior

Definition of done:
- Wishlist pricing remains stable through normal usage and future refactors.

---

## Phase 4 Wishlist Exit Criteria

- [ ] Wishlist entries carry intent and priority (not just status).
- [ ] Price watch shows selected-store table rows with reliable data.
- [ ] Release-aware states correctly distinguish TBD/Coming Soon from failures.
- [ ] Alerts are meaningful and anti-spam.
- [ ] Sync/export/restore preserve full wishlist decision state.
- [ ] QA coverage exists for core wishlist pricing and watch regressions.
