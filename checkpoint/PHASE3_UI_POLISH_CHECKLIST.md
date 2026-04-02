# Checkpoint Phase 3 UI Polish Checklist

This checklist translates the current visual cleanup goals into concrete UI work aligned with [DESIGN.md](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/checkpoint/design-reference/DESIGN.md).

## UI System

- [x] Standardize to one primary button style in `modules/render/shared.js`.
- [x] Standardize to one secondary button style in `modules/render/shared.js`.
- [x] Replace most `rounded-full` action buttons with lightly rounded rectangle buttons.
- [x] Reduce chip usage rules to a calmer shared style.
- [x] Keep chips only where they add fast scan value, not decoration.

## Library Chrome

- [x] Simplify the top navigation and library chrome in `modules/render/library.js`.
- [x] Keep only nav, search, and `Add Game` as the primary top-bar elements.
- [x] Remove or strongly de-emphasize the tracked/local/SteamGrid status strip.
- [x] Reduce small uppercase helper signals around the library header.
- [x] Reassess the library state bar and simplify it if it still feels busy.

## Settings

- [x] Remove the top settings stat cards from `modules/render/settings.js`.
- [x] Keep only actual settings and action groups.
- [x] Reduce the number of visual panels and boxes.
- [x] Increase whitespace between settings groups so the page feels calmer.
- [x] Remove decorative framing that does not improve action clarity.

## Detail Page

- [x] Simplify the detail hero in `modules/render/details.js`.
- [x] Keep the hero wash, but reduce extra supporting signals around it.
- [x] Cut the detail-hero chip count down to only the essentials.
- [x] Make the page read as 4-5 clear sections: `Run Details`, `Progress`, `Notes`, `Game Details`, and `Artwork`.
- [x] Reduce nested sub-surfaces inside each detail section.

## Styling Layer

- [x] Tone down blur in `styles.css`.
- [x] Reduce shadow depth globally.
- [x] Remove excess layered gradients where flatter surfaces will do.
- [x] Keep the dark theme and cyan accent, but make panels feel flatter and cleaner.
- [x] Reduce hover drama so the app feels calmer and less dashboard-like.

## Typography

- [x] Lower uppercase usage across the app.
- [x] Keep uppercase for labels, tabs, and small section eyebrows only.
- [x] Reduce aggressive letter spacing on secondary UI text.
- [x] Convert more helper and body copy to normal-case `Manrope`.
- [x] Reserve `Space Grotesk` label treatment for true labels, not every supporting line.
