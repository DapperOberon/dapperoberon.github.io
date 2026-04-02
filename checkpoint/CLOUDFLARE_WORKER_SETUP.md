# Checkpoint Cloudflare Worker Setup

Checkpoint is designed to stay on GitHub Pages for the frontend and use a free Cloudflare Worker as the SteamGridDB proxy.

## Why this exists

- GitHub Pages is static-only
- SteamGridDB should not be called directly from the browser
- the Worker keeps the SteamGridDB API key private
- the frontend only needs the Worker URL

## Files

- `checkpoint/cloudflare-worker/wrangler.toml`
- `checkpoint/cloudflare-worker/src/index.js`

## Worker secret

Set this secret in the Worker:

- `STEAMGRID_API_KEY`
- `IGDB_CLIENT_ID`
- `IGDB_CLIENT_SECRET`

## Allowed origin

Set `ALLOWED_ORIGINS` in `wrangler.toml` to the origins you want to allow.

Example:

```toml
ALLOWED_ORIGINS = "https://dapperoberon.github.io,http://127.0.0.1:5500"
```

You can keep `ALLOWED_ORIGIN` as a fallback single-origin value, but `ALLOWED_ORIGINS` is the preferred setting.

## Deploy steps

1. Install Wrangler.
2. Log into Cloudflare.
3. From `checkpoint/cloudflare-worker`, deploy the Worker.
4. Set the `STEAMGRID_API_KEY` secret.
5. Copy the deployed Worker URL.
6. Set that URL in `checkpoint/config.js`.

## Frontend flow

The frontend calls:

- `GET /api/steamgrid/artwork?title=...&slug=...`

The Worker:

1. searches SteamGridDB
2. resolves a SteamGridDB game id
3. fetches grids and heroes
4. returns normalized art payloads to Checkpoint

For metadata, the frontend calls:

- `GET /api/igdb/metadata?title=...`

The Worker:

1. authenticates to Twitch using client credentials
2. queries IGDB server-side
3. normalizes the result into Checkpoint metadata fields
4. returns JSON the frontend can consume directly

## Notes

- the Worker is the right long-term place for the SteamGridDB key
- the Worker is also the right place for IGDB/Twitch credentials
- user-specific browser keys are no longer the recommended deployment model
- this same Worker can later host the storefront-agnostic metadata resolver too
