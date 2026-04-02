# Checkpoint Phase 3 Task Checklist

This checklist translates the Phase 3 plan into concrete implementation work.

## Phase 3A: Phase 2 Cleanup and Decomposition

- [x] Remove stale editable-Worker config leftovers from runtime config and docs.
- [x] Audit and remove any remaining stale setup/docs from earlier Phase 2 iterations.
- [x] Split `render.js` into smaller surface-focused modules or helper files.
- [x] Split `store.js` into smaller action-oriented modules or helper files.
- [x] Review temporary design-study files and move or remove anything that should not stay in the main app tree.

## Phase 3B: Multi-Device Sync Foundations

- [x] Define Google account / Drive connection as the sync identity model.
- [x] Add device-aware sync metadata to persisted app state.
- [x] Track last-local-change and last-remote-sync markers.
- [x] Define the comparison model for local vs remote divergence.

## Phase 3C: Conflict Detection and Recovery

- [x] Detect conflicting local and remote states.
- [x] Add clear conflict messaging in settings.
- [x] Support a `keep local` recovery choice.
- [x] Support a `restore remote` recovery choice.
- [x] Support an `export local before resolving` recovery choice.

## Phase 3D: Manual Overrides

- [x] Add manual artwork override support.
- [x] Add manual metadata override support for key catalog fields.
- [x] Add field-lock behavior so refresh does not overwrite user-managed values.
- [x] Add clear/remove override behavior.

## Phase 3E: Activity and History

- [x] Add a lightweight activity log model.
- [x] Capture entry changes, sync actions, and refresh actions in history.
- [x] Add a restrained UI surface for recent activity.

## Phase 3F: Hardening and Release Prep

- [x] Document the full deployment checklist.
- [x] Add config completeness verification for required runtime values.
- [x] Update QA coverage for multi-device and override flows.
- [x] Implement a self-tightening engineering loop (`agent -> rules -> CI -> observability -> tasks -> agent`).
- [x] Run final Phase 3 smoke and manual QA.
  - [x] Smoke pass executed (`2026-04-02`): `bash checkpoint/scripts/smoke_test.sh`
  - [x] Manual browser QA pass + production-origin verification

## Phase 3G: UI Streamlining and Design Alignment

- [x] Capture the UI polish backlog in a dedicated checklist aligned to `design-reference/DESIGN.md`.
- [x] Start the shared button and chip simplification pass.
- [x] Simplify library chrome and top-bar density.
- [x] Simplify settings layout and reduce panel count.
- [x] Simplify the detail page hierarchy and reduce dashboard-like clutter.
- [x] Tone down the global visual treatment and typography noise.

## Phase 3H: Cohesion Audit and Alignment

- [x] Run an exhaustive cohesion audit across UI, state/actions, schema, integrations, and docs.
- [x] Convert audit findings into prioritized actionable todos.
- [x] Execute Priority 1 behavioral cohesion fixes from the audit backlog.
- [x] Execute Priority 2 state/surface cohesion fixes from the audit backlog.
- [x] Execute Priority 3 hardening cohesion fixes from the audit backlog.

## Phase 3I: Backloggd Reference Alignment (Layout + Feature Set)

- [x] Complete screenshot inventory and feature/design audit from `design-reference/backloggd.com`.
- [x] Define which Backloggd patterns are Adopt / Adapt / Avoid for Checkpoint.
- [x] Add layout principles to `design-reference/DESIGN.md` (cover-first hierarchy, template-driven surfaces, one primary CTA per surface).
- [x] Define canonical page templates for Library, Details, Settings, and Activity surfaces.
- [x] Decide scope for browse/discover in Phase 3 vs later phases (defer full Browse/Discover to Phase 5).
- [x] Decide scope for private profile/activity surface in Phase 3 vs later phases (defer profiles to Phase 4).
- [x] Decide settings left-rail IA timing (defer to Phase 4 with profile/settings expansion).

## Phase 3J: Add Flow Rework (IGDB Search -> Log)

- [x] Replace current add modal first step with a search-first experience.
- [x] Integrate IGDB match search via Worker-backed endpoint.
- [x] Show selectable candidate list with key context (title/year/cover/platforms where available).
- [x] Transition selected result into a compact run-log/edit step in the same modal flow.
- [x] Include run-level fields in log step (status, run label, playtime, completion, notes).
- [x] Add explicit manual/custom fallback when no result is suitable.
- [x] Keep “switch to manual” available after selecting an IGDB match.
- [x] Preserve existing validation and duplicate-entry warnings across both IGDB and manual paths.
- [x] Add smoke-test coverage for IGDB add path and manual fallback path.

## Phase 3K: Full UI Design Compliance

- [x] Execute the full design compliance backlog in `PHASE3_DESIGN_COMPLIANCE_TODOS.md`.
- [x] Bring Library, Details, Settings, and Activity into template-driven surface compliance.
- [x] Complete system-wide visual cohesion validation and archive final audit artifacts.
