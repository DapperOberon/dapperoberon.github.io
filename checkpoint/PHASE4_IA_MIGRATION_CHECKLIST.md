# Checkpoint Phase 4 IA Migration Checklist

This checklist separates run-tracking surfaces from browse/wishlist decision surfaces.

## Goal

Move from a single mixed library/details model to a clearer IA:

- `Library` (run tracking): playing, finished, backlog
- `Discover` (catalog-first): search/add/explore
- `Wishlist` (decision-first): pricing, release timing, buy intent

## Slice 1: Navigation + Surface Split (Now)

- [x] Add top-level nav items:
  - `Library`
  - `Discover`
  - `Wishlist`
  - `Settings`
- [x] Keep global search + add-game in header for all surfaces.
- [x] Route `Wishlist` to a dedicated page surface (not mixed shelves).
- [x] Route wishlist entry details to a dedicated wishlist detail template (no run workspace fields).

Definition of done:
- Wishlist has its own view and detail shape, distinct from run-centric pages.

## Slice 1B: URL + Slug Routing Foundation (Phase 4)

- [x] Introduce page/slug URL contract:
  - `/checkpoint/library/`
  - `/checkpoint/library/game/?id=<gameId>`
  - `/checkpoint/discover/`
  - `/checkpoint/discover/game/?id=<gameId-or-igdbId>`
  - `/checkpoint/wishlist/`
  - `/checkpoint/wishlist/game/?id=<gameId>`
  - `/checkpoint/settings/`
- [x] Add route parser + route serializer in app bootstrap so URL is source-of-truth for current surface.
- [x] Ensure top-nav, card click, and back actions push the correct URL for each surface.
- [x] Support direct deep-link open for tracked-entry detail pages (`library|wishlist|discover` + `id`).
- [x] Add `popstate` handling so browser back/forward restores view + selected game context.
- [x] Preserve backwards compatibility for `/checkpoint/` by mapping it to `/checkpoint/library/`.

Definition of done:
- URL and UI state stay synchronized across refresh, direct links, and browser navigation.

## Slice 1C: Document Scroll Rendering (Phase 4)

- [x] Remove app-level internal page scrolling (`overflow-y-auto` page roots) for library/discover/wishlist/details/settings.
- [ ] Use document scroll (`html/body`) for full-page rendering and screenshot compatibility.
- [ ] Keep modal/body locking behavior safe so overlays still trap focus and scroll as expected.
- [ ] Keep sticky header/rails working with document scroll and responsive breakpoints.
- [ ] Verify Firefox full-page screenshots capture full content height.

Definition of done:
- Page surfaces render as full document flow (no internal scroll dependence), and Firefox full-page capture works.

## Slice 2: Library Becomes Run-Centric

- [ ] Remove wishlist shelf from main run-tracking library dashboard.
- [ ] Keep primary library emphasis on:
  - playing
  - finished
  - backlog
- [ ] Ensure backlog/wishlist continue hiding run-only stats when not applicable.

Definition of done:
- Library reads as a run tracker, not a mixed dashboard.

## Slice 3: Discover Becomes Add/Browse Hub

- [ ] Move add flow entrypoint emphasis from Library into Discover.
- [ ] Introduce discover-first search results pattern:
  - type query
  - choose game
  - open log modal/workspace
- [ ] Keep manual entry fallback for unmatched titles.

Definition of done:
- Discover is the default place to find and add games.

## Slice 4: Wishlist Decision UX

- [ ] Wishlist page defaults to price/release/priority sorting.
- [ ] Add quick filters:
  - on sale
  - coming soon
  - target hit
  - no data
- [ ] Add quick actions on wishlist cards:
  - refresh price
  - open details
  - remove from wishlist

Definition of done:
- Wishlist helps answer “what should I buy next?” quickly.

## Slice 5: IA Cleanup + Documentation

- [ ] Update `PHASE4_TASK_CHECKLIST.md` to reference IA split completion.
- [ ] Update `PHASE4_WISHLIST_CHECKLIST.md` statuses after each migrated item.
- [ ] Add short IA map to `DESIGN.md` for future cohesion.

Definition of done:
- Docs and implemented navigation/surfaces are fully aligned.

---

## Exit Criteria

- [ ] Wishlist no longer inherits run-save detail mental model.
- [ ] Library remains focused on active/completed tracking.
- [ ] Discover owns find/add workflows.
- [ ] Surface responsibilities are obvious to a first-time user.
- [ ] URL/slug routing is stable and deep-linkable across all primary surfaces.
- [ ] Document scroll is the default page-render model.
