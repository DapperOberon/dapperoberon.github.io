# Checkpoint Phase 4 Pricing Plan (Wishlist Price Watch)

## Goal

Add a reliable, low-maintenance pricing layer for wishlist games:

- show current best price
- show where that price is available
- allow user-defined target price alerts in-app
- support periodic refresh without harming core tracking performance

---

## Provider Choice (Phase 4)

## IsThereAnyDeal API (Recommended v1)

Why:

- richer price/deal/history model
- explicit endpoints for current prices and historical lows
- strong fit for a source-of-truth aggregator path

Tradeoffs:

- authorization required
- slightly heavier integration model than fully public APIs

Use in Checkpoint:

- Phase 4 MVP provider for wishlist price watch
- mark unsupported titles cleanly when no provider match is found

## Optional future extension: Direct storefront integrations

Why:

- potentially broader and more exact per-store behavior

Tradeoffs:

- highest maintenance cost
- inconsistent public API support across stores
- more breakage risk over time

Use in Checkpoint:

- avoid for MVP; only consider after aggregator path proves insufficient

---

## Recommended Architecture

Use a provider adapter pattern, similar to metadata/artwork services:

- `services/pricing.js` (interface + routing)
- `services/pricing-itad.js` (MVP implementation)
- `services/pricing-mock.js` (tests/local fallback)

Use Worker proxy boundary:

- keep provider logic and normalization in Cloudflare Worker when practical
- allows future ITAD key management off-client
- gives consistent response shape to app regardless of provider

---

## Data Model Proposal

Keep pricing tied to entry-level watch intent and catalog-level market data.

## Library entry additions

```js
priceWatch: {
  enabled: boolean,            // default true for wishlist, false otherwise
  targetPrice: number | null,  // user threshold in display currency
  currency: string,            // default "USD"
  lastNotifiedAt: string       // ISO or ""
}
```

## Catalog game additions

```js
pricing: {
  provider: "itad" | "",
  providerGameId: string,      // ITAD game identifier
  currentBest: {
    amount: number | null,
    currency: string,
    storeId: string,
    storeName: string,
    url: string,
    regularAmount: number | null,
    discountPercent: number | null
  },
  historicalLow: {
    amount: number | null,
    currency: string,
    storeId: string,
    storeName: string,
    at: string
  },
  lastCheckedAt: string,       // ISO
  status: "ok" | "no_match" | "unsupported" | "error",
  reason: string               // provider_reason for UI/debug
}
```

Notes:

- pricing lives on `catalog` because it is game-level, not run-level
- watch preferences live on `library` because they are user/run intent

---

## Minimal Wishlist Price Watch Path (MVP)

## Phase 4A: Foundation + Provider Adapter

1. Add pricing service adapter and mock implementation.
2. Add schema fields for `priceWatch` and `pricing`.
3. Add migration defaults:
   - `wishlist` entries => `priceWatch.enabled = true`
   - all others => `false`

## Phase 4B: Fetch + Normalize

1. Implement ITAD lookup flow:
   - title search -> provider game id
   - retrieve best current deal / price
2. Normalize provider response into `catalog.pricing`.
3. Add “Refresh Prices (Library-wide)” action in Settings > Maintenance.

## Phase 4C: Wishlist UI

1. Add wishlist price columns/chips in Library cards/list:
   - current best price
   - store
   - discount
2. Add entry detail section:
   - enable/disable watch
   - target price input
   - manual refresh for this entry
3. Add fallback states:
   - no match
   - unsupported storefront
   - provider unavailable

## Phase 4D: Watch Evaluation

1. On refresh, evaluate:
   - if `enabled` and `targetPrice` exists and `currentBest.amount <= targetPrice`
2. Trigger in-app notice + activity log entry.
3. Debounce repeat notices using `lastNotifiedAt`.

---

## UX Rules

- Do not block normal tracking when pricing fails.
- Pricing is additive, never required.
- Show “last checked” timestamp for trust.
- Always label source: `Powered by IsThereAnyDeal` (or active provider).

## Provider Scope Limits (MVP)

Phase 4 pricing is intentionally aggregator-first and PC-store leaning:

- Coverage depends on IsThereAnyDeal title/store support.
- Region, edition, and platform parity are not guaranteed for every title.
- Missing prices for unreleased/TBD titles should be treated as release-state context, not hard provider failure.
- Consoles and niche storefronts may return sparse or no data in MVP.
- Direct per-store API parity is out of scope until a later phase.

## Pricing Status Meanings

Use these canonical status values across UI and logs:

- `ok`: pricing resolved successfully (at least one usable current price signal).
- `no_match`: title could not be matched to provider catalog.
- `unsupported`: pricing provider unavailable for this context/configuration.
- `error`: provider/proxy request failed unexpectedly.

Reason field guidance:

- `reason` is a machine-readable debugging hint and should remain stable for analytics/QA.
- UI should prefer friendly messaging mapped from `status` plus release context.

---

## QA Plan (MVP)

- Search match success/failure for common titles.
- Wishlist and non-wishlist default behavior checks.
- Target-price trigger tests.
- Currency and formatting checks (`USD` default in v1).
- Regression checks:
  - entry add/edit/delete unaffected
  - sync/export unaffected except schema additions

---

## Scope Boundaries for Phase 4

Included:

- single-user pricing watch
- one primary provider (IsThereAnyDeal)
- in-app notifications + activity logging

Deferred:

- email/push notifications
- multi-currency conversion beyond provider-returned currency
- console-native price providers
- provider blending/fallback arbitration logic

---

## Decision Recommendation

Start Phase 4 with IsThereAnyDeal as the MVP aggregator and keep the adapter boundary so future providers can be added later without schema churn.

---

## Reference Links

- IGDB API docs: https://api-docs.igdb.com/
- IsThereAnyDeal API docs: https://docs.isthereanydeal.com/
