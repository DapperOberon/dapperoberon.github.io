# Checkpoint Phase 3 Plan

## Purpose

Phase 3 should turn Checkpoint from a polished single-browser app into a more durable personal platform.

Phase 2 established:

- real SteamGrid artwork via Cloudflare Worker
- real IGDB metadata via the same Worker
- automatic enrichment on save
- library-wide metadata and artwork refresh
- real Google Drive full app-state sync
- restore safety snapshots and auto-backup behavior
- automated integration verification

Phase 3 should focus on making that connected foundation more resilient across devices, more controllable by the user, and easier to maintain.

For Phase 3, Checkpoint should treat the connected Google account as the sync identity boundary. The app does not need a separate first-party login system yet, because Google Drive auth already determines who owns the synced state.

---

## Phase 3 Goals

Phase 3 should deliver:

- Google-account-backed multi-device sync foundations
- multi-device-aware sync foundations
- conflict detection and recovery flows
- manual metadata/art override tools
- stronger library history and activity tracking
- Phase 2 cleanup and decomposition for long-term maintainability
- deployment and release hardening

Phase 3 should remain:

- single-user
- private by default
- non-social in the product UI
- local-first in feel, even when cloud sync is enabled

Shared libraries, public profiles, and social discovery should remain out of scope.

Phase 3 should explicitly not build:

- a separate Checkpoint username/password system
- public reviews or social feeds
- shared/public profile pages

Those should wait for a later account-and-community phase built on top of Google-authenticated identity.

## Locked Scope Decisions (2026-04-01)

- Phase 3 stays focused on **My Library** workflows.
- Full Browse/Discover should move to **Phase 5**.
- Profile surfaces and broader account settings expansion should move to **Phase 4**.
- Settings left-rail IA should move to **Phase 4** with the profile/settings expansion.
- Phase 3 should still improve add-to-library reliability with an IGDB-backed search-first add flow.

---

## Phase 2 Cleanup First

This should happen before major new features land.

### Cleanup Goals

- remove leftover migration code from the Phase 2 architecture shift
- simplify service config and runtime assumptions
- reduce monolithic file pressure in renderer and store
- make sync and enrichment behavior easier to reason about

### Immediate Cleanup Targets

- remove stale config paths from the pre-Worker and pre-Drive implementations
- split large renderer sections into focused view modules or helper files
- split large store behavior into smaller action groups:
  - entry CRUD
  - enrichment
  - backup/import/export
  - Drive sync
- tighten docs so deployment/setup instructions match the current implementation exactly
- review whether temporary design-study files should stay in the main product tree

### Cleanup Success Criteria

- no stale “old model” references remain in code or docs
- service configuration is explicit and minimal
- renderer/store are easier to extend without creating new hotspots
- Phase 3 features can land without further architectural churn first

---

## Phase 3 Workstreams

## 1. Multi-Device Sync Foundations

Goal:

- move from “single device with cloud backup” to “multiple devices can safely participate”

Primary tasks:

- treat the connected Google account as the owner of the synced library state
- identify device/session ownership in synced app state
- add sync metadata such as:
  - device id
  - device label
  - last sync timestamp
  - last local mutation timestamp
- persist remote revision details so the app can explain what it last synced against
- distinguish local state, remote state, and last-known sync state
- prepare a conflict detection model before adding conflict resolution UI

Phase 3 should use this concrete model:

- each browser install generates a persistent local `deviceId`
- each device also has a user-editable `deviceLabel`
- synced state should track:
  - `lastLocalMutationAt`
  - `lastLocalMutationByDeviceId`
  - `lastLocalMutationByDeviceLabel`
  - `lastRemoteSyncAt`
  - `lastRemoteFileId`
  - `lastRemoteModifiedTime`
  - `lastRemoteVersion`
  - `lastSyncedByDeviceId`
  - `lastSyncedByDeviceLabel`
- Settings should surface the current device label and the last synced device label when known
- when local and remote state diverge, Checkpoint should pause auto-backup until the user resolves the conflict

Success criteria:

- Google Drive account ownership is the clear sync identity model
- Checkpoint can tell when two devices have diverged
- sync state becomes explainable instead of implicit

## 2. Conflict Detection and Recovery

Goal:

- prevent silent overwrite between devices once Phase 3 sync expands

Primary tasks:

- detect conflicting local vs Drive state
- add explicit conflict messaging in settings
- support safe user choices:
  - keep local
  - restore remote
  - export local before resolving
- log conflict outcomes in sync history

Conflict rules for this phase:

- never silently choose between local and remote when divergence is detected
- present modified dates for both sides and visually point toward the newer candidate
- keep the decision explicit so the user remains in control
- pause auto-backup while unresolved conflict state exists

Success criteria:

- multi-device sync never silently destroys newer local data
- the user always has a recovery path

## 3. Manual Overrides and Metadata Control

Goal:

- let the user correct or personalize provider data

Primary tasks:

- add manual artwork override support
- add manual metadata override support for key catalog fields
- support “lock this field” behavior so refresh does not overwrite a user fix
- add “clear override” controls to return fields to provider-managed values

Success criteria:

- provider data is helpful but not authoritative
- users can curate the catalog without losing control on refresh

## 4. Activity and History

Goal:

- make Checkpoint better at tracking how a run evolved over time

Primary tasks:

- add a lightweight activity log for:
  - add/edit/delete
  - status changes
  - progress changes
  - sync actions
  - refresh actions
- show recent activity in the UI without making the app noisy
- consider timestamped milestones for completed or resumed runs

Success criteria:

- the app feels more like a living archive than a static list
- important changes are traceable

## 5. Renderer and Store Decomposition

Goal:

- reduce the risk of Phase 3 turning the codebase into two giant files

Primary tasks:

- split `render.js` by surface:
  - library
  - details
  - settings
  - overlays
- split `store.js` by behavior clusters or helper modules
- centralize shared UI state messages and service-result formatting

Success criteria:

- no single UI/state file remains the only safe place to make changes
- future work is easier to review and test

## 6. Release Hardening

Goal:

- make deployment and maintenance safer

Primary tasks:

- document full deployment checklist for:
  - GitHub Pages
  - Cloudflare Worker
  - Google OAuth
- add stronger verification around config completeness
- review what should be tracked vs ignored in git
- tighten smoke and QA workflows for release readiness

Success criteria:

- a fresh clone can be configured without tribal knowledge
- deployment mistakes become easier to catch

## 7. Add Flow Rework (IGDB Search -> Log)

Goal:

- make adding games reliable before full Browse/Discover exists

Primary tasks:

- replace the first add step with a single IGDB-powered search surface
- show candidate matches from IGDB with clear select actions
- on selection, transition to a run-log/edit step inspired by Backloggd’s compact logging workflow
- include run-level controls in the log step:
  - status
  - run label
  - playtime
  - completion
  - notes
- keep a manual/custom fallback path when no IGDB result matches
- keep a visible “switch to manual” escape route even after a result is selected
- route all provider search through the Worker boundary (no direct browser-to-IGDB calls)

Success criteria:

- users can reliably find and add a game without leaving the modal
- users can complete a first run log during add
- manual entry remains viable when provider search is imperfect

## Future Direction After Phase 3

Once multi-device sync is stable, the next major product layer can build on the same Google-authenticated identity:

- account settings tied to the connected Google identity
- optional profile surfaces
- private or public reviews for games at the catalog-game level
- social discovery and community features

Planned phasing from current decisions:

- Phase 4: profile and expanded settings architecture
- Phase 5: full Browse/Discover experience

Notes and progress should remain per run, while reviews should be modeled per game.

That future phase should reuse Google sign-in rather than introducing a separate password system unless a later product requirement makes that necessary.

---

## Recommended Implementation Order

### Phase 3A: Phase 2 Cleanup

- remove stale config and doc leftovers
- simplify service config assumptions
- begin renderer/store decomposition

### Phase 3B: Multi-Device Sync Foundations

- add device-aware sync metadata
- prepare divergence detection

### Phase 3C: Conflict Handling

- implement conflict detection
- add recovery choices and messaging

### Phase 3D: Manual Overrides

- artwork overrides
- metadata overrides
- field lock behavior

### Phase 3E: Activity and History

- add lightweight history surfaces
- connect sync and enrichment events into a readable timeline

### Phase 3F: Hardening and Release Prep

- deployment docs
- config verification
- final QA and regression coverage

### Phase 3G: Add Flow Rework (IGDB Search -> Log)

- implement search-first add modal
- transition selected result into compact run-log step
- preserve manual/custom fallback and escape hatch

---

## Main Risks

## 1. Sync Complexity Growth

Multi-device sync can make a previously simple app much harder to reason about.

Mitigation:

- add conflict detection before conflict resolution UI
- keep explicit backup and rollback paths

## 2. Provider vs User Authority

Automatic refresh can fight user overrides if ownership is unclear.

Mitigation:

- add explicit override and lock semantics
- keep provider refresh scoped to non-locked fields

## 3. Monolithic File Pressure

New features could make `render.js` and `store.js` too risky to change.

Mitigation:

- cleanup and decomposition first
- keep new Phase 3 work out of the existing hotspots where possible

## 4. Config Drift

With GitHub Pages, Cloudflare, and Google all in play, docs can drift from reality.

Mitigation:

- keep deployment docs current during implementation
- add config verification to smoke/release checks

---

## Success Criteria

Phase 3 is successful when:

- Checkpoint can safely detect multi-device divergence
- users can recover from sync conflicts without losing trust
- metadata and artwork refresh no longer override deliberate user curation
- the codebase is noticeably easier to extend than at the end of Phase 2
- deployment and maintenance are better documented and less fragile

---

## Out of Scope for Phase 3

- public profiles
- social discovery
- community reviews
- multiplayer/shared libraries
- recommendation engines
- broad analytics dashboards
- full Browse/Discover game exploration
- expanded profile/settings IA redesign (left-rail profile architecture)

Those should move to a later phase only if Checkpoint still wants to become more than a private personal archive.
