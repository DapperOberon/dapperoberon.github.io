# Checkpoint Phase 2 QA Checklist

This checklist covers the real service integrations added during Phase 2.

## Test Setup

- Run one pass from `http://127.0.0.1:5500/checkpoint/`.
- Run one pass from the GitHub Pages deployment origin.
- Use a browser session with:
  - a valid SteamGrid Cloudflare Worker URL in config
  - a valid Google Drive client ID in config
  - a Google account that can authorize the OAuth client
- Run at least one pass with:
  - sample seeded entries
  - one sparse manual entry
  - one entry with refreshed live metadata and artwork

## SteamGrid Worker

- Settings shows the configured Worker URL as read-only.
- `SteamGrid Live` appears in the top shell when the Worker URL is configured.
- `Refresh Assets` on a detail page:
  - succeeds for a known title
  - keeps existing artwork when no match is found
  - shows an error-style message if the Worker request fails
- `Refresh Library Art` runs across multiple tracked titles without breaking the UI.

## IGDB Metadata

- Adding a known title resolves:
  - developer
  - publisher
  - release date
  - genres
  - platforms
  - description
- Adding a sparse manual entry still succeeds when metadata is unavailable.
- `Refresh Metadata` on a detail page updates catalog metadata only.
- `Refresh Library Metadata` updates multiple titles without changing:
  - notes
  - playtime
  - completion
  - run labels

## Enrichment Messaging

- Add/edit flow distinguishes:
  - full enrichment
  - partial enrichment
  - fallback/manual save
- Artwork refresh distinguishes:
  - changed artwork
  - no match
  - request failure
- Metadata refresh distinguishes:
  - changed metadata
  - no match
  - request failure

## Google Drive Auth and Sync

- `Connect Drive` opens the Google auth flow successfully.
- Successful connection changes the settings state to connected.
- `Sync Now` creates or updates the hidden Drive backup.
- A successful sync marks entries as synced.
- `Disconnect` returns the UI to a disconnected state.
- `Restore From Drive` restores a valid hidden backup.

## Restore Safety

- Before a Drive restore, a local safety snapshot is saved.
- A visible `Restore Local Snapshot` action appears after a safety snapshot exists.
- `Restore Local Snapshot` successfully rolls local state back.
- Drive restore does not remove the local safety snapshot metadata.

## Auto-Backup

- With `Auto-backup on state change` enabled and Drive connected:
  - editing notes eventually triggers an auto-backup
  - editing progress eventually triggers an auto-backup
  - adding a game eventually triggers an auto-backup
- Auto-backup does not fire when Drive is disconnected.
- Auto-backup does not create obvious duplicate sync spam for a single small edit.

## Failure Handling

- Invalid Worker configuration leaves the app usable and surfaces a clear message.
- Metadata provider failure leaves run data intact.
- Artwork provider failure leaves current art intact.
- Drive sync failure leaves local state intact.
- Drive restore failure leaves local state intact.
- Failed Drive restore still preserves the previously saved local safety snapshot.

## Large-Library Pass

- Run library-wide metadata refresh with a larger seeded library.
- Run library-wide artwork refresh with a larger seeded library.
- Verify the app remains responsive and the notices stay understandable.
- Verify no visible corruption of cards, detail pages, or settings after bulk refresh.

## Regression Notes

- Log any case where catalog updates overwrite run-specific fields.
- Log any case where sync state becomes misleading after failure.
- Log any case where Drive restore applies an unexpected import mode outcome.
- Log any console errors that appear only during real integration flows.
