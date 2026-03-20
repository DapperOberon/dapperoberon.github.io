# Modern Theme Reference Alignment Plan

Status: In Progress
Owner: Modern default theme refresh
Date: 2026-03-13

## 1) Objective

Bring the default `modern-starwars` theme closer to the supplied reference images while preserving the current product structure, theme runtime, accessibility behavior, and interaction model.

## 2) Scope

### In Scope
- Visual refinement of the default `modern-starwars` theme
- Adjustments to shared token usage where the default theme still feels too generic
- Targeted component skin changes for the default theme when tokens alone are not enough
- Reference-driven refinement of hero, filters, cards, rail, modals, and shell surfaces

### Out of Scope
- Reworking non-default themes unless a shared fix is required
- Changing the timeline data model or interaction behavior
- Rebuilding layout structure for a one-off mockup match
- Any new feature work unrelated to visual refinement

## 3) Goals

- The default theme should feel recognizably closer to the reference set, not just like the current baseline with minor tweaks.
- The modern theme should retain strong usability, readability, and responsive behavior.
- Shared theme tokens should remain the first tool; component-specific overrides should be deliberate and limited.
- Any improvements that benefit all themes should be made in the shared contract rather than patched only in the default theme.

## 4) Reference Intent

Target qualities to pull from the reference images:
- more premium editorial framing
- stronger campaign-shell composition
- sharper hierarchy between hero, controls, and content
- more intentional contrast between promo surfaces and utility surfaces
- cleaner, more deliberate CTA treatment
- less generic “dark app shell” feeling

Avoid:
- breaking parity with the other themes
- making the modern theme visually noisy
- degrading card readability in pursuit of drama
- introducing layout drift that only works at one viewport

## 5) Workstreams

### WS1 — Reference Audit

Targets:
- reference screenshots
- `styles.css`
- `themes.css`

Actions:
1. Compare the current `modern-starwars` look against the reference images.
2. Identify the largest mismatches in composition, shell treatment, typography, controls, cards, and modal presentation.
3. Convert those mismatches into a ranked implementation list.

Definition of Done:
- A concrete mismatch list exists and is ordered by impact.

### WS2 — Default Theme Token Refresh

Targets:
- `styles.css`

Actions:
1. Refine the default modern token set where the current base styling feels too generic.
2. Improve shell, panel, card, accent, and focus tokens to better support the reference direction.
3. Keep token naming semantic and reusable.

Definition of Done:
- The default theme token layer supports the target aesthetic without requiring excessive one-off overrides.

### WS3 — Shared Surface Rebalancing

Targets:
- `styles.css`

Actions:
1. Rework the default hero shell and command area to better match the reference hierarchy.
2. Rebalance filters, chips, rail, cards, and CTA surfaces for stronger modern editorial structure.
3. Ensure settings modal, stats drawer, and entry modal remain visually consistent with the updated default shell.

Definition of Done:
- The main user-facing surfaces feel cohesive and materially closer to the reference set.

### WS4 — Focused Default Theme Overrides

Targets:
- `themes.css` if needed

Actions:
1. Add `modern-starwars` overrides only where the base shared layer cannot reasonably carry the design.
2. Group overrides by surface family.
3. Avoid scattering one-off fixes across unrelated selectors.

Definition of Done:
- Any default-theme-only overrides are intentional, minimal, and maintainable.

### WS5 — QA + Sign-off

Targets:
- new `MODERN_THEME_QA_CHECKLIST.md`
- optional screenshot artifacts

Actions:
1. Create a focused QA checklist for the modern default theme refresh.
2. Validate desktop and mobile behavior.
3. Validate filters, stats drawer, settings modal, entry modal, and theme persistence.
4. Validate keyboard focus, contrast, and less-motion parity.

Definition of Done:
- The refreshed modern theme is reference-aligned, regression-safe, and documented.

## 6) Suggested Execution Order

1. Audit the references and document the major mismatches.
2. Refresh the default token layer.
3. Rework the highest-impact shared surfaces.
4. Add any minimal `modern-starwars`-specific overrides.
5. Run QA and record sign-off notes.

## 7) Risks

- The default theme may drift too far from the established product shell and break parity with the other themes.
- Overcorrecting toward the references could reduce clarity in filters, cards, or modal content.
- Small visual tweaks in shared surfaces may unintentionally affect the non-default themes.

Mitigations:
- Use before/after review checkpoints.
- Prefer token changes first, shared surface changes second, default-specific overrides last.
- Recheck the non-default themes after meaningful shared-surface edits.

## 8) WS1 Audit Output

Status: Complete on 2026-03-13

Primary reference for the default theme:
- 2026-03-10

Supporting references for the default theme:
- 2011-10-01
- 2015-01-23
- 2015-04-30
- 2019-08-31
- 2019-12-01

These references consistently point toward:
- a stronger cinematic hero
- a more premium campaign-shell feeling
- clearer separation between promotional and utility surfaces
- cleaner media hierarchy
- less “generic dark app” presentation

### Ranked Mismatch List

#### 1. The hero is too small and too structurally polite

Current state:
- The current header reads as a compact application intro rather than a dominant promotional hero.
- The copy, controls, and shell all sit too close together visually.

Reference direction:
- The references use a stronger image-first or campaign-first hero zone with more breathing room and clearer hierarchy.

Why this matters:
- This is the first impression of the modern theme, and it currently under-sells the “premium StarWars.com” direction.

Priority:
- Highest

#### 2. The command/filter area feels like app controls, not premium franchise navigation

Current state:
- Search, chips, filter groups, and utility controls read like a functional toolbar.
- The expanded filters behave cleanly, but still feel product-like rather than editorial/streaming-like.

Reference direction:
- The references use more branded navigation rails, content-category bars, and polished media utility framing.

Why this matters:
- This is the largest source of “generic dark product UI” feeling in the default theme.

Priority:
- Highest

#### 3. The cards are solid, but they do not feel premium enough

Current state:
- The card system is readable and stable, but the visual hierarchy still feels like a polished web app rather than a campaign/editorial media grid.
- Posters and metadata are structured well, but the surfaces lack enough premium framing and intent.

Reference direction:
- The references lean on stronger media-card hierarchy, clearer promo emphasis, and more deliberate image-to-copy balance.

Why this matters:
- Cards dominate the main content experience, so the theme cannot feel reference-aligned unless they do.

Priority:
- Highest

#### 4. The shell lacks a stronger campaign identity

Current state:
- The page background and surrounding shell are competent, but they still read as a dark neutral platform.
- The current starfield/slab treatment does not yet feel distinctive enough.

Reference direction:
- The references often use a branded shell: starfield slabs, stronger promo framing, or cinematic backdrops that make the page feel like a destination.

Why this matters:
- Without a stronger shell, even good component refinements will still feel like “dark theme UI.”

Priority:
- High

## 9) Progress Snapshot

Updated: 2026-03-13

- [x] WS1 audit completed and ranked
- [x] Hero and top-shell hierarchy rebuilt for `modern-starwars`
- [x] Command/filter/navigation language rebalanced for `modern-starwars`
- [x] Card hierarchy and CTA treatment upgraded for `modern-starwars`
- [x] Rail, drawer, and modal surfaces brought into the same refreshed default-theme language
- [ ] Modern-theme QA checklist created and executed

Adjustment note:
- `2026-03-10` is now the primary aesthetic anchor for `modern-starwars`.
- `2011-10-01`, `2015-01-23`, `2015-04-30`, `2019-08-31`, and `2019-12-01` should only inform supporting cues where they reinforce the 2026 direction.

#### 5. The timeline rail still feels more functional than branded

Current state:
- The rail works, but it reads as a utility enhancement.
- It does not yet feel like part of a premium editorial navigation language.

Reference direction:
- The references use category rails, icon strips, tabs, and subtle navigation chrome that feels more franchise-branded.

Why this matters:
- The rail is visible for most of the experience, so its tone strongly affects the default theme’s identity.

Priority:
- High

#### 6. The settings modal and stats drawer are thematically safe, but not very distinctive

Current state:
- They are consistent with the current shell, but they do not yet feel “modern StarWars.com” specifically.
- They read as strong UI components, but not as premium franchise panels.

Reference direction:
- Supporting surfaces in the references still feel integrated into the same branded shell language as the rest of the page.

Why this matters:
- Once the main shell improves, these surfaces will stand out if they are left behind.

Priority:
- High

#### 7. The entry modal is visually strong, but still more “product modal” than “campaign media sheet”

Current state:
- The modal is visually capable and content-rich, but it still behaves and reads like an application modal.
- The composition is not yet fully aligned with a modern media destination feel.

Reference direction:
- The references favor richer promo/media framing, stronger poster or hero-image integration, and clearer separation between showcase and utility content.

Why this matters:
- The modal is one of the most visible premium surfaces in the experience.

Priority:
- Medium-high

#### 8. CTA styling needs to feel more deliberate and brand-forward

Current state:
- Calls to action work, but they are not yet visually emphatic in the way the modern references suggest.
- The system has buttons; it needs better campaign-grade buttons.

Reference direction:
- The references use clear, intentional CTA emphasis, especially in later 2019/2026-era surfaces.

Why this matters:
- CTA polish is one of the fastest ways to shift the default theme from “app UI” to “franchise destination.”

Priority:
- Medium-high

#### 9. Typography hierarchy is a little too generic

Current state:
- The type system is clean and readable, but the modern theme headings and labels do not yet feel branded enough.
- Some uppercase labeling exists, but the hierarchy is not as sharp as the references.

Reference direction:
- The references use stronger headline contrast, tighter uppercase systems, and clearer distinction between promo headlines and utility labels.

Why this matters:
- Typography is doing less thematic work than it should in the default theme.

Priority:
- Medium

#### 10. Utility surfaces are slightly too visually equal

Current state:
- Hero-adjacent controls, panels, chips, and cards all sit within a relatively even design language.
- This keeps the UI coherent, but also flattens the intended hierarchy.

Reference direction:
- The references differentiate promo surfaces, category/navigation surfaces, and utility surfaces more clearly.

Why this matters:
- Stronger hierarchy is required for the modern theme to feel premium rather than merely orderly.

Priority:
- Medium

### Recommended Implementation Order

1. Rebuild the hero and shell hierarchy
2. Rework the command/filter/navigation language
3. Upgrade card hierarchy and CTA treatment
4. Bring rail, stats drawer, settings modal, and entry modal into the new modern shell
5. Do a targeted typography and contrast cleanup pass
