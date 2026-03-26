# Cleanup Checklist

Status: Merge Prep

## Completed

- Root app promotion to `star-wars-timeline/`
- Root content pages:
  - `guide/`
  - `privacy/`
  - `terms/`
- Shared shell/content architecture
- Mixed-platform `watchUrl` support
- Wookieepedia info links
- Deep linking and share links
- Stats/preferences alignment and cleanup priorities
- Footer destinations and policy pages
- Favicon wiring
- Legacy asset archiving
- Active JSON move into `data/`
- Active support module cleanup into `modules/`

## Current Structure

- Public root:
  - `index.html`
  - `guide/index.html`
  - `privacy/index.html`
  - `terms/index.html`
- Active code:
  - `app.js`
  - `content-page.js`
  - `modules/`
- Active data:
  - `data/timeline-data.json`
  - `data/music-data.json`
- Archived legacy files:
  - `archive/`

## Final Verification Notes

- Root routes and moved data files return `200` over local HTTP.
- Root helper/module files pass syntax checks.
- The old unused root files have been archived.
- `redesign/` has been reduced to these two docs only.

## Remaining

1. Final manual visual smoke test.
2. Final diff review.
3. Merge to main.
