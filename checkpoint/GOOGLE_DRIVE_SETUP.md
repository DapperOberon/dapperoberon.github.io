# Checkpoint Google Drive Setup

This document defines the recommended Google Drive architecture for Checkpoint on `GitHub Pages + Cloudflare Worker`.

## Recommended Architecture

Checkpoint should use:

- `GitHub Pages` for the frontend
- `Google Identity Services` in the browser for per-user OAuth
- direct `Drive API` REST calls from the browser after the user grants access
- the Drive `appDataFolder` for hidden, per-user app-state backups

This is the best fit for the current product direction because:

- it stays free
- it preserves single-user, browser-first behavior
- it does not require storing Google refresh tokens on a backend
- the backup file stays hidden from the user's normal Drive UI

## Why This Model

Google's current browser guidance recommends the `google.accounts.oauth2` token model for browser-based apps. The access token is obtained in the browser, has a short lifetime, and can be used with REST and CORS for Google APIs.

For Checkpoint, that means:

1. the user clicks `Connect Google Drive`
2. Google shows the popup consent flow
3. Checkpoint receives an access token
4. Checkpoint uses Drive REST endpoints to:
   - locate an existing backup in `appDataFolder`
   - create or update the backup JSON file
   - restore from that backup later

## Storage Location

Checkpoint should store the backup in `appDataFolder`, not normal Drive space.

Reasons:

- `appDataFolder` is hidden from the user and other Drive apps
- it is meant for application-specific data
- it matches Checkpoint's full-app-state backup model

Checkpoint should use one canonical hidden file, for example:

- `checkpoint-app-state.json`

## OAuth Scope

Checkpoint should request:

- `https://www.googleapis.com/auth/drive.appdata`

This is the correct scope for the hidden app data folder and keeps Drive access narrower than broader file scopes.

## Credentials Needed

Checkpoint needs one Google OAuth client for the web app:

- `GOOGLE_DRIVE_CLIENT_ID`

Recommended:

- no Google client secret in the browser
- no Drive API key unless we later adopt `gapi` discovery loading

For the planned REST-based implementation, `CLIENT_ID` is enough.

## Frontend Config

`checkpoint/config.js` should eventually expose:

```js
window.CHECKPOINT_CONFIG = {
  steamGridWorkerUrl: "https://checkpoint-steamgrid-proxy.camerosmit.workers.dev/",
  googleDriveClientId: "YOUR_GOOGLE_WEB_CLIENT_ID"
};
```

`googleDriveClientId` is public-safe client configuration, not a secret.

## Browser Flow

The intended runtime flow is:

1. Load the Google Identity Services script.
2. Initialize a token client with `googleDriveClientId`.
3. On user action, request the `drive.appdata` scope.
4. Store the short-lived access token in memory only.
5. Use `fetch()` against Drive REST endpoints with:
   - `Authorization: Bearer <token>`
6. Re-request an access token through a user gesture when needed.

Checkpoint should not persist the Google access token in local storage.

## Drive Operations Needed

Phase 2E only needs a small subset of Drive functionality:

1. `list`
   Find `checkpoint-app-state.json` inside `appDataFolder`.

2. `create`
   Create the hidden backup file if it does not exist.

3. `update`
   Replace the file contents with the latest normalized app-state JSON.

4. `get`
   Read the backup contents during restore.

## File Strategy

Recommended strategy:

- keep exactly one active backup file in `appDataFolder`
- update it in place after the first create

Optional later enhancement:

- add versioned snapshots or timestamped recovery copies

## UI Model

The settings screen should eventually support:

- `Connect Google Drive`
- `Disconnect`
- `Sync Now`
- `Restore From Drive`
- connection status
- last sync time
- last sync result

The existing sync history panel can be reused for this.

## What Should Happen On Sync

`Sync Now` should:

1. build the normalized exported app state
2. find or create `checkpoint-app-state.json` in `appDataFolder`
3. upload the full JSON payload
4. mark local entries as synced when the upload succeeds

## What Should Happen On Restore

`Restore From Drive` should:

1. fetch the hidden backup file
2. validate and normalize it with the existing schema path
3. present the same `replace` vs `merge` choice already used for JSON imports
4. apply the selected restore behavior locally

## What We Should Not Do

Checkpoint should not:

- store Google refresh tokens in the frontend
- require a backend just for Drive auth in Phase 2
- store backups in visible root Drive by default
- ask for broad Drive scopes if `drive.appdata` is enough

## Implementation Order

Recommended order for Phase 2E:

1. Add Google Drive client ID config support.
2. Load Google Identity Services in the app shell.
3. Replace the mock drive service with a real browser token-client service.
4. Implement `connect`, `disconnect`, and token lifecycle handling.
5. Implement `syncAppState()` to `appDataFolder`.
6. Implement `restoreFromDrive()`.
7. Add explicit replace vs merge restore UI.

## Manual Setup Steps

When implementation begins, the setup sequence should be:

1. Create a Google Cloud project.
2. Enable the Google Drive API.
3. Configure OAuth consent.
4. Create a `Web application` OAuth client.
5. Add authorized JavaScript origins for:
   - `https://dapperoberon.github.io`
   - `http://127.0.0.1:5500`
6. Copy the web client ID into `checkpoint/config.js`.

## Official References

- Google Drive JavaScript quickstart:
  https://developers.google.com/workspace/drive/api/quickstart/js
- Google Identity Services token model:
  https://developers.google.com/identity/oauth2/web/guides/use-token-model
- Drive `appDataFolder` guide:
  https://developers.google.com/workspace/drive/api/guides/appdata
- Drive spaces overview:
  https://developers.google.com/workspace/drive/api/guides/about-files
