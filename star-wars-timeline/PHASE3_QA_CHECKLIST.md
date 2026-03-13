# Phase 3 Theme QA Checklist

Status: Ready for Sign-off
Owner: Theme system / visual identity pass
Date: 2026-03-13

## Release Gate

Phase 3 can ship when:
- all 4 themes pass the checklist below
- persistence works across reloads
- desktop and mobile views are visually stable
- no console/runtime errors appear in smoke coverage
- unresolved issues = 0 for release-blocking items

## Theme Set Under Test

- `modern-starwars`
- `holonet-archive`
- `prequel-portal`
- `databank-dashboard`

## Smoke Coverage Already Completed

- [x] `modern-starwars` basic app load + theme switching smoke
- [x] `holonet-archive` app load + settings + modal smoke
- [x] `prequel-portal` app load + settings + modal smoke
- [x] `databank-dashboard` app load + settings + modal smoke

Notes:
- Current smoke coverage is Chromium-based.
- Each verified pass rendered 50 cards and opened Preferences and the first entry modal without console/runtime errors.

## Per-Theme Checklist

Use this section once per theme.

### 1. Theme Restore + Preferences

- [ ] Theme restores correctly from saved preference
- [ ] Preferences selector shows the correct selected theme
- [ ] Theme description matches the selected theme
- [ ] Switching away and back updates the UI immediately

### 2. Desktop Visual Pass

- [ ] Header / hero looks intentional and theme-consistent
- [ ] Search and filter controls match the theme language
- [ ] Expanded filters panel matches the theme language
- [ ] Active filter chips match the theme language
- [ ] Timeline rail matches the theme language
- [ ] Era headers match the theme language
- [ ] Entry cards match the theme language
- [ ] Stats drawer matches the theme language
- [ ] Settings modal matches the theme language
- [ ] Entry modal matches the theme language
- [ ] Footer and empty states match the theme language

### 3. Mobile Visual Pass

- [ ] Header remains readable and usable
- [ ] Search and filters remain usable
- [ ] Expanded filters remain usable
- [ ] Cards remain legible without broken spacing
- [ ] Settings modal scales correctly
- [ ] Entry modal scales correctly
- [ ] No clipped controls or overflow regressions

### 4. Interaction Parity

- [ ] Search works
- [ ] Primary filters work
- [ ] Expanded filters work
- [ ] Active filter chips can be cleared
- [ ] Continue CTA still works
- [ ] Era collapse / expand works
- [ ] Stats drawer opens and closes
- [ ] Preferences modal opens and closes
- [ ] Entry modal opens and closes
- [ ] Mark next / watched interactions still work

### 5. Accessibility + Motion

- [ ] Focus-visible styling is clear on keyboard navigation
- [ ] Text contrast is readable across header, cards, controls, and modals
- [ ] Hover/active states do not reduce readability
- [ ] Decorative glow/shadow does not obscure content
- [ ] Less-motion / reduced-motion behavior remains acceptable

### 6. Regression Check

- [ ] No console errors
- [ ] No page runtime errors
- [ ] No missing layout-critical assets
- [ ] No theme-specific broken component structure

## Theme Run Log

### `modern-starwars`

- Status: QA pass complete
- Notes:
  - 2026-03-13: Chromium desktop + mobile pass completed
  - theme restored correctly in both viewports
  - Preferences showed `modern-starwars` with the correct description
  - Stats drawer opened/closed successfully
  - Entry modal opened successfully on `Young Jedi Adventures`
  - Progress filter applied and produced 1 active chip
  - Search reduced visible cards from 12 to 1 under the filtered state
  - Era collapse/expand worked
  - No console errors or page runtime errors
  - Manual screenshot review: no obvious desktop/mobile clipping or broken layout structure observed
  - Keyboard focus smoke passed: shared controls and entry cards showed visible outlines, and keyboard activation opened settings and entry modal
  - Less-motion toggle persisted and added `body.less-motion` successfully
  - Manual screenshot review found no obvious contrast blockers

### `holonet-archive`

- Status: QA pass complete
- Notes:
  - 2026-03-13: Chromium desktop + mobile pass completed
  - theme restored correctly in both viewports
  - Preferences showed `holonet-archive` with the correct description
  - Stats drawer opened/closed successfully
  - Entry modal opened successfully on `Young Jedi Adventures`
  - Progress filter applied and produced 1 active chip
  - Search reduced visible cards from 12 to 1 under the filtered state
  - Era collapse/expand worked
  - No console errors or page runtime errors
  - Manual screenshot review: old-web direction reads consistently across header, filters, cards, and timeline on desktop/mobile
  - Keyboard focus smoke passed: shared controls and entry cards showed visible outlines, and keyboard activation opened settings and entry modal
  - Less-motion toggle persisted and added `body.less-motion` successfully
  - Manual screenshot review found no obvious contrast blockers

### `prequel-portal`

- Status: QA pass complete
- Notes:
  - 2026-03-13: Chromium desktop + mobile pass completed
  - theme restored correctly in both viewports
  - Preferences showed `prequel-portal` with the correct description
  - Stats drawer opened/closed successfully
  - Entry modal opened successfully on `Young Jedi Adventures`
  - Progress filter applied and produced 1 active chip
  - Search reduced visible cards from 12 to 1 under the filtered state
  - Era collapse/expand worked
  - No console errors or page runtime errors
  - Manual screenshot review: bronze framing and module treatment stayed coherent across desktop/mobile with no obvious clipping
  - Keyboard focus smoke passed: shared controls and entry cards showed visible outlines, and keyboard activation opened settings and entry modal
  - Less-motion toggle persisted and added `body.less-motion` successfully
  - Touch-mode retest confirmed the mobile card tap path opened the entry modal
  - Manual screenshot review found no obvious contrast blockers

### `databank-dashboard`

- Status: QA pass complete
- Notes:
  - 2026-03-13: Chromium desktop + mobile pass completed
  - theme restored correctly in both viewports
  - Preferences showed `databank-dashboard` with the correct description
  - Stats drawer opened/closed successfully
  - Entry modal opened successfully on `YOUNG JEDI ADVENTURES`
  - Progress filter applied and produced 1 active chip
  - Search reduced visible cards from 12 to 1 under the filtered state
  - Era collapse/expand worked
  - No console errors or page runtime errors
  - Manual screenshot review: command-center styling remained consistent across cards, rail, and shell on desktop/mobile
  - Keyboard focus smoke passed: shared controls and entry cards showed visible outlines, and keyboard activation opened settings and entry modal
  - Less-motion toggle persisted and added `body.less-motion` successfully
  - Manual screenshot review found no obvious contrast blockers

## Sign-off Notes

- Release blocker issues:
- None identified in current Chromium automation coverage
- Non-blocking polish items:
- No release-blocking issues currently identified
- Final sign-off date: 2026-03-13
