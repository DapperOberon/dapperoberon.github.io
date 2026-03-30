# Checkpoint Phase 2 Task Checklist

This checklist translates the Phase 2 plan into concrete implementation work.

## Phase 2A: Phase 1 Cleanup and Refactor

- [x] Create the Phase 2 task checklist.
- [x] Remove dead UI/reference leftovers and stale strings from Phase 1.
- [x] Reduce repeated renderer markup for common actions and controls.
- [x] Refactor large renderer sections into smaller future-proof helpers or modules.
- [x] Tighten naming consistency across store, renderer, and services.
- [x] Normalize repeated panel/message/button patterns.
- [x] Add a small smoke-test script for load and critical app flows.

## Phase 2B: SteamGrid Artwork Integration

- [x] Replace mock SteamGrid artwork lookup with a real adapter implementation.
- [x] Resolve hero art, capsule art, and screenshots from real service data.
- [x] Preserve graceful fallback behavior when artwork is unavailable.
- [x] Automatically fetch artwork on entry save.
- [x] Add a settings action to re-fetch artwork for the library.

## Phase 2C: Storefront-Agnostic Metadata Resolver

- [x] Define the storefront-agnostic resolver strategy and provider order.
- [x] Replace mock metadata lookup with a normalized resolver pipeline.
- [x] Keep metadata output aligned to the canonical catalog shape.
- [x] Support partial-match and lookup-failure fallback behavior.
- [x] Preserve sparse manual entry support when metadata cannot be resolved.

## Phase 2D: Automatic Enrichment Flow

- [x] Run metadata and art resolution automatically during save flows.
- [x] Distinguish full success, partial success, and failure messaging.
- [x] Add settings action to re-fetch metadata and artwork for all entries.
- [x] Ensure enrichment updates catalog data without corrupting runs.

## Phase 2E: Google Drive Full App-State Sync

- [x] Implement real Google Drive auth and storage flow.
- [x] Sync the normalized full app-state payload to Drive.
- [x] Add restore-from-Drive behavior with clear replace/restore messaging.
- [x] Preserve local backup safety before destructive restore actions.
- [x] Show clear sync success, failure, and recovery messages.

## Phase 2F: QA and Hardening

- [x] Expand the smoke-test script for integrated flows.
- [x] Update the manual QA checklist for real services.
- [x] Verify failure handling for metadata, artwork, and Drive sync.
- [x] Verify large-library refresh behavior.
- [x] Run final integration QA before closing Phase 2.
