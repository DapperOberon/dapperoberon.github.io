# Checkpoint Cohesion Audit (Phase 3)

This audit reviews cohesion across product language, UI behavior, state semantics, integrations, docs, and maintainability.  
Goal: convert drift into a concrete, prioritized todo backlog.

## Scope

- UI surfaces: library, details, settings
- Store/actions and state model
- Service/integration boundaries
- Persisted schema and sync semantics
- Docs/checklists and verification workflow

## Cohesion Findings

## High Priority

1. Sync preference semantics are not reflected in sync payload behavior.
- Evidence:
  - `syncPreferences.includeArtwork` and `syncPreferences.includeNotes` exist in schema and UI.
  - `buildSyncPayload()` sends full export state regardless of these toggles.
- Impact:
  - User-facing controls imply behavior that does not actually happen.
  - Settings trust gap.
- Files:
  - [store.js](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/modules/store.js)
  - [settings.js](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/modules/render/settings.js)
  - [schema.js](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/modules/schema.js)

2. Toggle preference action allows arbitrary keys.
- Evidence:
  - `togglePreference(key)` mutates `state.syncPreferences[key]` with no allowlist.
- Impact:
  - Invalid keys can be introduced from UI/DOM misuse.
  - State shape integrity risk.
- Files:
  - [entry-actions.js](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/modules/store/entry-actions.js)

3. Action naming was inconsistent with user intent.
- Evidence:
  - Previously, UI button label was `Sync Now` while event action was `mark-all-synced`.
- Impact:
  - Increases cognitive overhead during maintenance.
  - Harder to follow intent through render → store.
- Files:
  - [settings.js](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/modules/render/settings.js)
  - [render.js](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/modules/render.js)
  - [store.js](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/modules/store.js)

## Medium Priority

4. Sync history model existed without a current UI surface (resolved).
- Evidence:
  - `state.syncHistory` is populated.
  - A compact `Recent Sync Activity` surface is now present in Settings.
- Impact:
  - Previously looked partially implemented.
  - Now provides user-facing value for sync traceability.
- Files:
  - [store.js](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/modules/store.js)
  - [drive-sync-actions.js](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/modules/store/drive-sync-actions.js)
  - [shared.js](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/modules/render/shared.js)

5. Action state contained an unused channel (resolved).
- Evidence:
  - `actionState.integrations` was initialized but unused.
- Impact:
  - Previously added dead-state noise; now removed.
- Files:
  - [store.js](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/modules/store.js)

6. Detail-page copy and field labeling still mix two language systems.
- Evidence:
  - Most of details moved to calmer labels, but metadata/artwork form labels still use older uppercase-heavy style.
- Impact:
  - Intra-page style inconsistency.
- Files:
  - [details.js](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/modules/render/details.js)

7. Library state bar may still be denser than the new design direction.
- Evidence:
  - It is simplified, but still competes with dashboard hero in scoped and unscoped views.
- Impact:
  - Slightly noisy first scan.
- Files:
  - [library.js](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/modules/render/library.js)

## Lower Priority / Hardening

8. Production styling pipeline is still CDN Tailwind.
- Evidence:
  - `index.html` loads `cdn.tailwindcss.com`.
- Impact:
  - Console warning in production.
  - Build/deploy cohesion gap with release-hardening goals.
- Files:
  - [index.html](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/index.html)

9. Config completeness checks are mostly runtime, not preflighted.
- Evidence:
  - Service failures are handled at call time; no single preflight report.
- Impact:
  - Slower setup troubleshooting.
- Files:
  - [services/config.js](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/services/config.js)
  - [scripts/smoke_test.sh](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/scripts/smoke_test.sh)

## Actionable Todo Backlog

## Priority 1: Behavioral Cohesion

- [x] Implement payload filtering for `includeArtwork` and `includeNotes` in sync/export paths.
- [x] Add unit/integration verification that each sync preference changes payload content as expected.
- [x] Guard `togglePreference` with an explicit allowlist: `autoBackup`, `includeArtwork`, `includeNotes`.
- [x] Rename sync action/event path from `mark-all-synced` to `sync-now` (UI label aligned).
- [x] Update docs to explicitly describe what each sync preference includes/excludes.

## Priority 2: State and Surface Cohesion

- [x] Decide on `syncHistory` product status:
- If keeping: add a compact settings surface for recent sync events.
- If deferring: stop collecting history and remove dead renderer helper.
- [x] Remove unused `actionState.integrations` or wire it to real UI messaging.
- [x] Finish detail-page typography normalization in metadata/artwork forms.
- [x] Recheck and optionally trim library state-bar density after current UI simplification.

## Priority 3: Hardening Cohesion

- [x] Replace Tailwind CDN runtime with a build-time CSS pipeline.
- [x] Add a config preflight script that reports missing/invalid runtime config in one place.
- [x] Expand smoke tests to validate sync preference semantics and conflict-resolution branches.

## Suggested Execution Order

1. Sync preferences behavior + toggle allowlist + action rename.
2. Sync history decision and dead-state cleanup.
3. Final detail/library typography trim.
4. Tailwind build pipeline and config preflight.
5. QA sweep and checklist closeout.

## Definition of Done for Cohesion Pass

- Settings controls map 1:1 to real behavior.
- Action names in UI/event/store are intent-aligned.
- No dead state branches or orphaned renderer helpers.
- Detail/library/settings share one clear language system.
- Deployment/docs/testing reflect actual runtime expectations.
