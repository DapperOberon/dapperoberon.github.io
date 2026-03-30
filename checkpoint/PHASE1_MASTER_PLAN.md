# Checkpoint Phase 1 Master Plan

## Purpose

This document captures the current audit of the Checkpoint scaffold and defines the implementation plan for **Phase 1**.

Phase 1 should deliver a usable single-user web app for tracking games across storefronts with:

- local persistence
- add-game flow
- status management for `playing`, `finished`, and `archived`
- searchable library views
- per-game detail pages
- clear integration seams for future metadata, SteamGrid art, and Google Drive sync

Phase 1 is **not** the full product vision. It is the first stable milestone that turns the current prototype into a practical app foundation.

---

## Audit Summary

## What Is Working

- The app has a clean single-entry boot path in `checkpoint/index.html` and `checkpoint/app.js`.
- The visual direction is strong and now aligned to the design-reference baseline.
- The app has a functioning local state model in `checkpoint/modules/store.js`.
- Local persistence exists in `checkpoint/modules/persistence.js`.
- There is already a sample library and sample catalog model in `checkpoint/data/sample-data.js`.
- The UI supports the major surface areas we need:
  - dashboard
  - detail view
  - settings/sync view
  - add-game modal
- The app already has integration adapters separated into:
  - `checkpoint/services/storefronts.js`
  - `checkpoint/services/steamgrid.js`
  - `checkpoint/services/google-drive.js`

## What Is Still Prototype-Level

- The data model is still tied to seeded sample data rather than a durable app schema.
- Add-game intake only supports create flow, not edit, delete, or restore workflows.
- Metadata and art services are mock implementations.
- Google Drive sync is only a placeholder.
- There is no import/export strategy yet.
- There is no validation layer for library entries.
- There is no error handling or user-facing feedback system.
- There are no loading, empty, failure, or recovery states beyond minimal placeholders.
- There is no automated QA, smoke testing, or regression checklist specific to Checkpoint.
- There is no accessibility audit yet.
- Tailwind is loaded via CDN, which is fine for prototyping but not ideal for long-term maintainability.

## Main Risks

- The current render layer is large and template-heavy, which will get harder to maintain as behavior grows.
- Library data and catalog data are mixed in a way that may become awkward once live metadata sources are introduced.
- Persistence currently stores only the library array, not full app preferences or future sync metadata.
- The current UX assumes seeded art is always available; real integrations will introduce missing art, partial metadata, and API failure cases.

---

## Phase 1 Goal

Ship a polished local-first version of Checkpoint that a single person can actually use to:

1. add games manually
2. track storefront and play status
3. browse and search their library
4. open a game detail view with notes and metadata
5. keep their data between sessions
6. understand where future sync and metadata integrations will plug in

---

## Phase 1 Scope

## In Scope

- local-first app behavior
- manual game entry creation
- searchable/filterable library
- status changes
- detail screen with notes and metadata
- local persistence for app data
- better entry schema and normalization
- empty, loading, and validation states
- initial import/export support via JSON
- roadmap-ready settings panel for sync and integrations
- lightweight QA checklist and implementation docs

## Out of Scope

- real Google Drive OAuth and file sync
- live SteamGrid API integration
- live storefront metadata APIs
- user accounts or authentication
- multiplayer/shared libraries
- advanced statistics and charts
- mobile-native packaging

---

## Deliverables

## Product Deliverables

- stable dashboard using the current design baseline
- stable game detail page
- stable add-game modal
- stable settings/preferences surface
- local JSON export
- local JSON import
- clearer empty states and validation messages

## Technical Deliverables

- normalized Phase 1 data schema
- persistence versioning plan
- renderer cleanup or partial decomposition
- service adapter contracts documented
- QA checklist for manual testing
- Phase 1 implementation notes

---

## Recommended Workstreams

## 1. Foundation Hardening

Goal: make the app reliable before adding more features.

Tasks:

- define the canonical entry schema
- define the canonical catalog schema
- decide what belongs in persisted state versus derived state
- persist preferences alongside library data
- add schema migration handling for future versions
- add helper utilities for dates, IDs, and normalization

Success criteria:

- app loads old or missing data safely
- all persisted data is versioned
- manual entries and seeded entries share one schema

## 2. Library CRUD

Goal: make the tracker genuinely usable.

Tasks:

- keep create flow
- add edit flow for title, storefront, status, notes, and progress
- add delete/remove flow
- add restore flow for archived entries if needed
- add duplicate prevention or conflict warnings

Success criteria:

- users can manage entries without touching code
- the library no longer feels sample-data-only

## 3. Search, Filters, and Views

Goal: improve usability for real collections.

Tasks:

- preserve current search
- add clearer filter state indicators
- support sorting options
- support “recently updated” and “recently added”
- improve empty states for filtered views

Success criteria:

- users can quickly find entries in larger libraries
- dashboard sections still feel visually intentional with real data volumes

## 4. Detail View Completion

Goal: turn the detail surface into a useful record page.

Tasks:

- allow editing notes and progress from detail view
- improve metadata grouping
- handle missing artwork and partial metadata gracefully
- add status controls that do not require returning to the dashboard

Success criteria:

- the detail page becomes the source of truth for a game record

## 5. Import/Export

Goal: protect user data before cloud sync exists.

Tasks:

- export full local state to JSON
- import JSON with validation
- support merge or replace behavior
- show import failures clearly

Success criteria:

- users can back up and restore data locally
- this becomes the bridge to future Drive sync

## 6. Integration Readiness

Goal: make future external integrations low-risk.

Tasks:

- formalize interfaces for SteamGrid lookup, metadata lookup, and Drive sync
- separate mock responses from production adapters
- document expected request/response shapes
- add UI states for loading, success, missing data, and failure

Success criteria:

- future integration work can happen without redesigning the app or rewriting store logic

## 7. QA and Accessibility

Goal: make the first release trustworthy.

Tasks:

- create manual QA checklist
- verify keyboard access for main actions
- verify contrast and focus states
- verify layout behavior on desktop and mobile
- test persistence and import/export flows

Success criteria:

- app is safe to iterate on
- app is not visually polished but operationally fragile

---

## Proposed Implementation Order

## Phase 1A: Data and Persistence

- finalize schemas
- improve persistence payload
- add migration/version handling

## Phase 1B: Core User Actions

- add edit/delete flows
- improve create flow validation
- add better state messaging

## Phase 1C: Library UX

- add sorting and stronger filter behavior
- improve section handling for real data
- polish empty and edge states

## Phase 1D: Detail and Backup

- finish detail editing
- add import/export JSON
- add backup-facing settings copy

## Phase 1E: QA and Ship Prep

- manual QA pass
- accessibility pass
- documentation pass

---

## Acceptance Criteria

Phase 1 is complete when:

- a user can add a game from the UI
- a user can edit and delete a game from the UI
- a user can set storefront, status, notes, and progress
- data survives reloads
- the library can be searched and filtered reliably
- a user can export and import their data
- missing metadata/art does not break the interface
- the app has a written QA checklist and a stable local-first architecture

---

## Suggested First Tickets

1. Normalize persisted state and add schema versioning for preferences plus library data.
2. Add edit-entry flow using the existing add-game modal as the base interaction.
3. Add delete-entry and confirm dialog behavior.
4. Add JSON export/import from the settings surface.
5. Add validation and user-facing error/success messaging.
6. Document service adapter contracts for SteamGrid, metadata, and Drive sync.

---

## Notes

- The current visual baseline is good enough to continue building on.
- The biggest Phase 1 value is not more screens. It is making the current screens real.
- After Phase 1, the most natural Phase 2 work would be live metadata/art ingestion and Google Drive sync.
