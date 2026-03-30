# Checkpoint Phase 2 Plan

## Purpose

Phase 2 moves Checkpoint from a polished local-first scaffold into a real connected app.

Phase 1 established:

- the local data model
- manual CRUD flows
- detail editing
- JSON backup and restore
- UI refinement
- adapter contracts for future services

Phase 2 should focus on making those adapters real while cleaning up the Phase 1 architecture so future growth stays manageable.

---

## Phase 2 Goals

Phase 2 should deliver:

- real SteamGrid artwork integration
- a storefront-agnostic metadata resolver
- automatic metadata/art fetch on entry save
- a settings action to re-fetch artwork/metadata for the full library
- Google Drive full app-state sync with replace/restore behavior
- Phase 1 cleanup and refactoring for consistency and future-proofing

Phase 2 should remain:

- single-user
- local-first in day-to-day behavior
- non-collaborative
- non-conflict-aware across devices

Multi-device conflict-aware sync should move to Phase 3.

---

## Key Product Decisions

### 1. SteamGrid Comes First

Artwork integration is the first external integration priority.

Why:

- it has immediate visual impact
- it improves the perceived completeness of the app quickly
- it strengthens both library and detail views without changing the core data model

### 2. Storefront-Agnostic Metadata Resolver

Phase 2 should not start with a store-specific app architecture.

Instead, it should introduce a normalized metadata resolution layer that:

- searches for a game in a provider-agnostic way
- returns one Checkpoint-friendly metadata shape
- allows store-specific enrichment behind the same interface later

Why:

- cleaner long-term architecture
- easier to add more providers over time
- less UI/store coupling to a single storefront
- better fit for user-entered manual titles

### 3. Automatic Fetch on Save

When a user saves an entry:

- metadata should resolve automatically
- artwork should resolve automatically

Settings should also include a manual “re-fetch all assets/metadata” action for the current library.

### 4. Google Drive Full App-State Sync

Phase 2 sync should support:

- full app-state backup
- restore behavior
- replace/restore style flows

It should not yet attempt:

- multi-device conflict resolution
- collaborative editing
- account-based shared libraries

---

## Phase 1 Cleanup Workstream

This should happen at the beginning of Phase 2, not at the end.

### Cleanup Goals

- remove dead leftovers from Phase 1
- make Phase 1 code more consistent
- refactor fragile areas before integration work lands
- add a lightweight smoke-test script

### Cleanup Tasks

- remove dead UI/reference leftovers and stale strings
- audit renderer/template duplication and reduce repeated button/layout patterns
- refactor large renderer sections into smaller future-proof modules or helper slices
- tighten naming consistency across state, services, and UI labels
- normalize repeated action-message and panel patterns
- review store methods for consistency in state transitions and notices
- add a small smoke-test script for:
  - app load
  - import/export path sanity
  - critical route/module availability

### Cleanup Success Criteria

- the renderer is less monolithic
- repeated UI patterns are more centralized
- dead code and stale reference artifacts are removed
- integration work can land without multiplying inconsistencies
- a small regression script exists and can be rerun during future phases

---

## Phase 2 Workstreams

## 1. Phase 1 Cleanup and Refactor

Goal:

- stabilize the codebase before real integrations land

Primary tasks:

- complete the cleanup list above
- document any architectural constraints discovered during cleanup

Success criteria:

- renderer and store are easier to extend
- smoke-test script exists
- Phase 1 leftovers are removed

## 2. SteamGrid Artwork Integration

Goal:

- replace mock artwork resolution with real SteamGrid-backed lookups through a free Cloudflare Worker proxy

Primary tasks:

- implement Cloudflare Worker proxy configuration for the GitHub Pages frontend
- support lookup by normalized title/slug through the Worker
- map response into:
  - hero art
  - capsule art
  - screenshots
- keep graceful fallback behavior when art is unavailable
- expose library-wide re-fetch action in settings

Success criteria:

- new entries can resolve real art automatically
- existing entries can be refreshed from settings
- missing art fails gracefully without breaking the app

## 3. Storefront-Agnostic Metadata Resolver

Goal:

- replace mock metadata lookup with a normalized resolver layer

Primary tasks:

- define the resolver strategy and provider order
- keep output normalized to the existing catalog shape
- support partial matches and sparse fallback behavior
- add disambiguation/failure messaging where matching is uncertain
- preserve manual entry support when metadata lookup fails

Success criteria:

- metadata lookup no longer depends on mock data
- the app receives one normalized metadata shape
- users can still save entries even when lookup is incomplete

## 4. Automatic Enrichment Pipeline

Goal:

- make add/edit save flows feel connected and real

Primary tasks:

- automatically trigger metadata and art resolution on save
- distinguish:
  - full success
  - partial success
  - failure with manual fallback
- update entry feedback and notices for live integrations
- add settings action to re-fetch all metadata/art for current library entries

Success criteria:

- save flow enriches entries automatically
- users understand when enrichment succeeded or partially failed
- re-fetch action works for existing libraries

## 5. Google Drive Full App-State Sync

Goal:

- move from simulated sync to real full-state backup/restore integration

Primary tasks:

- implement Google Drive auth and storage flow
- sync the same normalized app-state payload used by local export
- support manual sync to Drive
- support restore-from-Drive behavior
- support replace/restore style user flows clearly
- preserve local safety messaging before destructive restore actions

Success criteria:

- users can push full app state to Drive
- users can restore full app state from Drive
- sync behavior is understandable and safe

## 6. QA and Hardening

Goal:

- make the new integration layer reliable enough for daily use

Primary tasks:

- expand the smoke-test script for integrated flows
- update the manual QA checklist for live services
- verify service failure states
- verify fresh install, existing install, and restored install flows
- verify artwork and metadata refresh behavior on larger libraries

Success criteria:

- major integrated flows are repeatably testable
- failures degrade gracefully
- Drive restore and local restore do not corrupt state

---

## Recommended Implementation Order

### Phase 2A: Cleanup First

- remove leftovers
- refactor renderer/store hotspots
- add smoke-test script

### Phase 2B: SteamGrid Integration

- wire real artwork adapter
- keep current fallback art behavior
- verify automatic art resolution on save

### Phase 2C: Metadata Resolver

- implement storefront-agnostic metadata resolution
- normalize responses into catalog records
- refine partial-match and failure handling

### Phase 2D: Automatic Re-Fetch Flows

- enrich save flow
- add settings action to re-fetch all metadata/art

### Phase 2E: Google Drive Sync

- full app-state Drive backup
- restore/replace flows
- sync status and recovery messaging

### Phase 2F: QA and Ship Prep

- integrated smoke checks
- updated manual QA pass
- final hardening

---

## Main Risks

## 1. Resolver Ambiguity

Storefront-agnostic matching may return uncertain or incorrect results for vague titles.

Mitigation:

- keep manual save fallback
- surface partial-match messaging
- allow later refresh

## 2. External Service Variability

SteamGrid and metadata providers may fail, rate-limit, or return sparse data.

Mitigation:

- preserve empty-state and partial-success handling
- keep adapter boundaries strict
- avoid assuming artwork or metadata always exists

## 3. Renderer Complexity

If cleanup is skipped, Phase 2 integrations could make the renderer much harder to maintain.

Mitigation:

- do cleanup first
- centralize repeated UI patterns before integration surfaces multiply

## 4. Sync Safety

Drive restore introduces real data replacement risk.

Mitigation:

- use explicit restore messaging
- preserve local export path as backup
- keep replace/restore flows clearly separated

---

## Success Criteria

Phase 2 is successful when:

- Checkpoint can save an entry and resolve real artwork automatically
- Checkpoint can resolve real normalized metadata through a storefront-agnostic layer
- users can re-fetch enrichment data for their library from settings
- users can back up and restore the full app state through Google Drive
- the Phase 1 codebase is cleaner, more consistent, and easier to extend than before integration work started

---

## Out of Scope for Phase 2

- multi-device conflict resolution
- user accounts and profile systems
- shared libraries
- social features
- advanced review/rating systems
- analytics-heavy dashboards

Those should be considered for Phase 3 or Phase 4.
