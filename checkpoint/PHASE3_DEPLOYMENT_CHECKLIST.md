# Checkpoint Phase 3 Deployment Checklist

This checklist is the release-hardening runbook for the Phase 3 baseline.

## 1) Local Build + Validation

- [x] In `checkpoint/`, install local dependencies:
  - `npm install`
- [x] Build Tailwind output:
  - `npm run build:css`
- [x] Confirm generated CSS exists:
  - `checkpoint/tailwind.generated.css`
- [x] Run smoke test:
  - `bash checkpoint/scripts/smoke_test.sh`
- [x] Ensure smoke passes with:
  - config preflight pass
  - no Tailwind CDN in `checkpoint/index.html`
  - integration verification pass

## 2) Runtime Config Verification

Config file:

- `checkpoint/config.js`

Required checks:

- [x] `steamGridWorkerUrl` is set to deployed worker URL.
- [x] `googleDriveClientId` is set to valid Google Web OAuth client ID.
- [x] `node checkpoint/scripts/preflight_config.mjs` shows no errors.

## 3) Cloudflare Worker (SteamGrid + IGDB Proxy)

Worker project:

- `checkpoint/cloudflare-worker/`

Checks:

- [x] Worker deployed successfully via Wrangler.
- [x] `ALLOWED_ORIGIN` includes all intended origins:
  - GitHub Pages production origin
  - local dev origin(s) if needed (for local testing)
- [x] Proxy endpoints respond for both metadata and artwork routes.
- [x] CORS headers match app origins.

## 4) Google OAuth / Drive Sync

Google Cloud setup:

- [x] OAuth consent configured for app.
- [x] OAuth client type is Web.
- [x] Authorized JavaScript origins include:
  - GitHub Pages production origin
  - local testing origin(s), when used
- [x] Drive scope flow works from Settings -> Connect Drive.

In-app checks:

- [x] Connect Drive succeeds.
- [x] Sync Now succeeds.
- [x] Restore From Drive succeeds.
- [x] Disconnect returns app to local-only state.

## 5) GitHub Pages Publish

- [ ] Commit:
  - `tailwind.generated.css`
  - app/module/style/doc changes
- [ ] Do not commit:
  - `checkpoint/node_modules/`
  - local backup JSON exports
  - worker secret/env files
- [ ] Push to deployment branch.
- [ ] Verify GitHub Pages deployment is green.

## 6) Post-Deploy Sanity Checks (Production URL)

- [x] App shell loads with no missing asset errors.
- [x] Library, Details, Settings routes/views render.
- [x] Add flow works (IGDB search + manual fallback).
- [x] Entry detail save actions work:
  - Save Details
  - Save Progress
  - Save Notes
- [x] Settings right rail + Activity sections render correctly.
- [x] Sync conflict UI appears when induced and resolution paths work.

## 7) Release Sign-off

- [x] Smoke test artifact captured.
- [x] Phase 3 QA checklist reviewed and signed.
- [x] Phase 3 task checklist updated.
- [x] Known issues documented (if any).

Automation artifact note:
- `2026-04-02`: local `npm run build:css`, `node checkpoint/scripts/preflight_config.mjs`, and `bash checkpoint/scripts/smoke_test.sh` all passed.
- Manual QA note (`2026-04-02`): no issues reported.
