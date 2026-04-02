# Checkpoint Phase 3 QA Checklist

Focus: multi-device sync safety, manual overrides, activity history, and release stability.

## Test Environments

- [x] Local origin: `http://127.0.0.1:5500/checkpoint/` (or equivalent local host)
- [x] Production GitHub Pages origin
- [x] At least one browser session with valid:
  - `steamGridWorkerUrl`
  - `googleDriveClientId`

## A) Multi-Device Sync Foundations

- [x] `Current Device ID` is present in Settings.
- [x] Device label can be edited and saved.
- [x] `Last Synced Device` updates after sync.
- [x] Sync status reflects:
  - local-only
  - in-sync
  - local-newer/diverged when appropriate

## B) Conflict Detection + Recovery

- [x] Conflict card appears when local/remote diverge.
- [x] Conflict card shows both local and remote modified context.
- [x] Auto-backup pauses while conflict is unresolved.
- [x] `Keep Local` path succeeds and resumes sync.
- [x] `Restore Drive` path succeeds and resumes sync.
- [x] `Export Local Backup` remains available during conflict.

## C) Sync Preferences Behavioral Checks

- [x] `Include artwork payloads = OFF`:
  - sync payload omits artwork fields
  - local artwork remains unchanged
- [x] `Include archive notes = OFF`:
  - sync payload omits notes content
  - local notes remain unchanged
- [x] Invalid preference keys are ignored (state integrity guard).

## D) Manual Overrides + Lock Behavior

- [x] Save metadata overrides in Details edit mode.
- [x] Save artwork overrides in Details edit mode.
- [x] Locked override values persist through refresh operations.
- [x] `Clear Game Details` reverts to provider-managed metadata values.
- [x] `Clear Artwork` reverts to provider-managed artwork values.

## E) Activity + Sync History

- [x] Recent Sync Activity section shows sync events.
- [x] Recent Activity section shows:
  - entry added/updated/deleted
  - notes/progress/details saves
  - metadata/artwork refresh events
  - sync success/failure/conflict events
- [x] Activity lines include specific game title when relevant.

## F) Add Flow (IGDB -> Log + Manual Fallback)

- [x] Search-first modal step appears on Add Game.
- [x] Candidate list shows title/year/cover context.
- [x] Selecting a result transitions to compact log step.
- [x] Manual entry path works from:
  - no result state
  - selected result state (`Switch to Manual`)
- [x] Duplicate-entry warning still appears where applicable.

## G) UI + Interaction Stability

- [x] Typing in inputs keeps focus.
- [x] Page/input updates do not force-scroll to top.
- [x] Details page remains scrollable on shorter displays.
- [x] Settings right rail is visible on desktop and mobile fallback rail works.

## H) Build + Runtime Hardening

- [x] `npm run build:css` succeeds.
- [x] App loads compiled `tailwind.generated.css`.
- [x] Tailwind CDN is absent from production HTML.
- [x] `node checkpoint/scripts/preflight_config.mjs` passes.
- [x] `bash checkpoint/scripts/smoke_test.sh` passes.

## QA Sign-off

- [x] QA run date recorded.
- [x] Environment(s) recorded.
- [x] Any known residual risks listed.

Recorded pre-QA automation pass:
- Date: `2026-04-02`
- Environment: local dev shell (`/mnt/Misc SSD/Github Respositories/dapperoberon.github.io`) with local HTTP smoke server (`127.0.0.1:8132`)
- Residual risks: manual browser/UI validation still pending for sync conflict UX, Drive OAuth flow, and production-origin behavior

Manual QA sign-off update:
- Date: `2026-04-02`
- Status: No issues found during manual browser QA pass (local + production).
- Residual risks: none noted.
