# Product Polish Plan

Status: Ready For Execution  
Date: 2026-03-26

## Purpose

This document turns the current product assessment for `star-wars-timeline/` into a concrete polish plan focused on usability, visual restraint, accessibility, and implementation quality.

This is not a redesign brief. The goal is to make the existing app feel more intentional, easier to use, and easier to maintain without changing its core product direction.

## Current Read

- The app already has a strong visual identity and a clear product premise.
- The runtime structure is in good shape for a hand-built app:
  - shell rendering is separated into `modules/shell.js`
  - page composition is separated into `modules/app-layout.js`
  - rendering orchestration is separated into `modules/app-renderer.js`
  - interaction wiring is separated into `modules/app-interactions.js`
  - app bootstrap and progress state are separated into `modules/app-state.js`
- The main opportunities are now polish opportunities rather than rescue work:
  - navigation and information architecture feel slightly split
  - mobile utility lags behind desktop utility
  - some visual treatments stack on top of each other and reduce clarity
  - accessibility and focus behavior can be tightened
  - the render/event model works, but future polish work will get harder if it stays fully rebind-on-render

## Guiding Principles

- Keep the cinematic tone.
- Prefer clarity over adding more UI.
- Remove visual noise before adding new decoration.
- Improve mobile and accessibility in the same pass whenever possible.
- Favor small structural cleanups that make future product polish easier.

## Priority Workstreams

### 1. Navigation And Information Architecture

Priority: Highest  
Goal: Make the app feel like one coherent product instead of a strong app shell plus secondary pages

Problems to solve:

- Primary navigation is split between top bar, footer, and content pages.
- Preferences is discoverable only through a profile icon.
- Guide exists, but it is not part of the primary app navigation.
- The main brand mark in the app shell is not a home link.

Primary files:

- `index.html`
- `modules/shell.js`
- `modules/app-layout.js`
- `modules/app-interactions.js`

Implementation todos:

- [ ] Make the main brand mark in the runtime shell navigate to the timeline home state.
- [ ] Decide on the canonical primary nav set for the app shell.
- [ ] Expose `Guide` more clearly in the main experience if it remains a supported destination.
- [ ] Replace the ambiguous profile-only access to preferences with a clearer label or hybrid icon+label treatment.
- [ ] Ensure desktop and mobile navigation expose the same core destinations.
- [ ] Audit footer links so they support, rather than compensate for, the primary navigation.

Definition of done:

- Users can understand the app’s main destinations from the first screen.
- App pages and content pages feel like the same product family.
- No important destination depends on “finding it in the footer.”

### 2. Hero And Timeline Entry Flow

Priority: Highest  
Goal: Make the first screen more useful and less generic while preserving the cinematic feel

Problems to solve:

- The hero presentation is visually strong, but the message is generic.
- The primary CTA is tied to the selected hero entry, not necessarily the viewer’s true next item.
- Mobile hero utility is lighter than it should be for a watch-progress app.

Primary files:

- `modules/app-layout.js`
- `modules/timeline-data.js`
- `modules/app-domain.js`
- `modules/app-state.js`

Implementation todos:

- [ ] Replace generic hero copy with language that explains the product value faster.
- [ ] Derive a true “next unwatched” or “best next entry” target instead of always using the hero card entry.
- [ ] Clarify whether the primary CTA means “continue progress,” “open details,” or “start next.”
- [ ] Improve mobile hero utility so key actions and state are visible without extra taps.
- [ ] Make empty-filter states feel intentional and helpful rather than placeholder-like.

Definition of done:

- The first screen explains what the app is and what to do next in one glance.
- The primary CTA reflects actual user progress.
- Mobile users get the same sense of direction as desktop users.

### 3. Mobile Utility And Search

Priority: High  
Goal: Bring mobile usability closer to desktop usability

Problems to solve:

- Search is a desktop-only utility.
- Mobile relies heavily on chips and filter entry points.
- For a large content set, quick find is one of the most important workflows.

Primary files:

- `modules/shell.js`
- `modules/app-layout.js`
- `modules/app-interactions.js`
- `modules/filters.js`

Implementation todos:

- [ ] Add a usable mobile search entry point in the main timeline view.
- [ ] Decide whether mobile search should be inline, sheet-based, or top-bar driven.
- [ ] Ensure the mobile search affordance remains visible when the user has scrolled deep into the timeline.
- [ ] Review mobile chips so they aid orientation without crowding the viewport.
- [ ] Verify search and filter combinations remain understandable on small screens.

Definition of done:

- Mobile users can quickly find an entry without opening multiple layers first.
- The top mobile workflows are searchable, scrollable, and understandable with one hand.

### 4. Visual Restraint And Surface Consistency

Priority: High  
Goal: Make the interface feel more premium by reducing competing treatments

Problems to solve:

- The app uses multiple fonts, glow systems, glass surfaces, gradients, and pill styles at once.
- Many individual pieces look good, but together they occasionally feel slightly transitional or over-specified.
- Some product surfaces read more like decorated components than a unified visual system.

Primary files:

- `index.html`
- `styles.css`
- `modules/shell.js`
- `modules/app-layout.js`
- `modules/timeline-renderers.js`
- `modules/utility-renderers.js`

Implementation todos:

- [ ] Reduce typography complexity and assign clearer roles to the remaining typefaces.
- [ ] Audit repeated glow, blur, and ghost-border treatments and remove low-value variants.
- [ ] Standardize button and pill hierarchy so each control style has a clear job.
- [ ] Simplify utility panels where card treatment is doing more styling than information work.
- [ ] Review section spacing and density so the app feels calmer without losing richness.
- [ ] Keep the visual signature centered on atmosphere, poster imagery, and strong hierarchy rather than added ornament.

Definition of done:

- The interface feels more cohesive without losing personality.
- Primary actions, secondary actions, and passive metadata are easier to distinguish.
- Removing decorative effects would not collapse the design.

### 5. Accessibility And Focus Behavior

Priority: High  
Goal: Make the app more robust for keyboard users, assistive tech, and general interaction quality

Problems to solve:

- Focus trapping is custom and minimal.
- Some controls rely heavily on iconography or symbols.
- Semantic landmarks and navigation clarity can be improved.
- Dynamic UI states should expose clearer affordances and focus destinations.

Primary files:

- `index.html`
- `modules/shell.js`
- `modules/app-state.js`
- `modules/app-interactions.js`
- `modules/timeline-renderers.js`
- `modules/utility-renderers.js`
- `styles.css`

Implementation todos:

- [ ] Add or review semantic landmarks for nav, main content, dialogs, and supporting panels.
- [ ] Improve visible focus styles across buttons, chips, links, and modal actions.
- [ ] Review icon-only controls for accessible naming and clarity.
- [ ] Strengthen modal and filter panel focus management and focus return behavior.
- [ ] Confirm keyboard access for timeline cards, modal episode actions, filters, and page navigation.
- [ ] Add a quick accessibility verification checklist to the project docs.

Definition of done:

- All primary flows are keyboard reachable and understandable.
- Opening and closing overlays never strands focus.
- Controls remain understandable even without visual context.

### 6. Render And Interaction Cleanup

Priority: Medium-High  
Goal: Reduce the maintenance cost of future polish work

Problems to solve:

- The app re-renders large HTML sections with `innerHTML`.
- Interaction wiring rebinds listeners after every render across many selectors.
- This is workable now, but it increases fragility as the product surface grows.

Primary files:

- `app.js`
- `modules/app-renderer.js`
- `modules/app-interactions.js`
- `modules/app-runtime.js`
- `modules/app-wiring.js`

Implementation todos:

- [ ] Identify the highest-churn interactions that should move to delegated event handling first.
- [ ] Reduce repetitive query-and-bind patterns for controls that are recreated every render.
- [ ] Separate “full page render” triggers from “small state update” triggers where practical.
- [ ] Keep behavior identical while lowering the amount of event rebinding work.
- [ ] Add brief notes in the runtime architecture docs if the interaction model changes.

Definition of done:

- The app remains behaviorally stable.
- Interaction code becomes easier to change without missing selectors.
- Future polish work requires less repeated binding boilerplate.

### 7. Production Readiness Cleanup

Priority: Medium  
Goal: Remove the last prototype-era choices from the delivery path

Problems to solve:

- Tailwind is currently loaded from the CDN.
- The app behaves like a product, so the production pipeline should reflect that.

Primary files:

- `index.html`
- `tailwind-config.js`
- project-level package/build files if introduced

Implementation todos:

- [ ] Decide whether to keep the current no-build approach or introduce a small build step.
- [ ] If a build step is introduced, move Tailwind generation out of the CDN path.
- [ ] Keep the resulting workflow documented and lightweight.
- [ ] Verify the generated output still supports the static hosting model cleanly.

Definition of done:

- Asset delivery feels deliberate and production-ready.
- The styling pipeline is documented and repeatable.

## Suggested Execution Order

### Phase 1. Product Clarity

- [ ] Navigation and IA pass
- [ ] Hero and next-action pass
- [ ] Mobile search pass

### Phase 2. Surface Quality

- [ ] Visual restraint pass
- [ ] Button, chip, and panel consistency pass
- [ ] Empty states and minor copy cleanup

### Phase 3. Interaction Quality

- [ ] Accessibility and focus pass
- [ ] Overlay behavior and keyboard flow verification

### Phase 4. Technical Support Work

- [ ] Event delegation and render cleanup
- [ ] Tailwind delivery decision
- [ ] Documentation updates

## Recommended First Sprint

If only one polish sprint is available, start here:

- [ ] Make the shell navigation coherent across desktop and mobile.
- [ ] Add mobile search.
- [ ] Make the hero CTA point at the actual next item.
- [ ] Tighten focus states and modal/filter focus return.
- [ ] Reduce one layer of unnecessary glass/glow/pill styling from the most visible screens.

## Verification Checklist

- [ ] Timeline, stats, preferences, guide, privacy, and terms still load correctly.
- [ ] Search works on both desktop and mobile.
- [ ] Filter, modal, and navigation flows are keyboard-usable.
- [ ] Focus returns correctly after closing overlays.
- [ ] The hero CTA resolves to the intended entry.
- [ ] Visual changes remain consistent across desktop and mobile breakpoints.
- [ ] Existing verification scripts still pass.

## Success Criteria

- The app feels easier to understand on first use.
- Mobile and desktop feel like equally supported experiences.
- The visual language feels more deliberate and less busy.
- Keyboard and overlay behavior feel trustworthy.
- The next round of polish can happen faster because the interaction model is less brittle.

## Notes

- This plan intentionally favors high-leverage polish over feature expansion.
- The current product direction is already strong enough that the best next work is refinement, not reinvention.
