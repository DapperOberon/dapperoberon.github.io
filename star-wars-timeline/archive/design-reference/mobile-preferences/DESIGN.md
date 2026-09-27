# Design System Documentation: Cinematic Monolith

## 1. Overview & Creative North Star
This design system is built to evoke the weight, scale, and drama of a cinematic space epic. Our **Creative North Star is "The Cinematic Monolith."** We are not building a standard website; we are crafting a digital theater. This system moves away from the "boxy" nature of the web by utilizing intentional asymmetry, deep tonal layering, and high-contrast focal points that mirror the experience of a film's title sequence.

The layout should prioritize breathing room and "The Void"—using the deep charcoal palette to let content emerge like stars against the night. By overlapping typography onto high-quality imagery and using aggressive scale shifts, we create a sense of depth and immersion that feels premium and intentional.

## 2. Colors
The palette is rooted in a "near-black" philosophy, using charcoal and obsidian tones to create a sense of infinite depth.

*   **Primary Accent (`#fbe419`):** Our "Saber Yellow." This is reserved for high-priority calls to action and critical interactive states. It should feel like a pulse of energy.
*   **Secondary Accent (`#75d1ff`):** "Engine Blue." Used for information, secondary actions, and subtle UI glows to provide a cool, technical contrast to the warmth of the yellow.
*   **The "No-Line" Rule:** To maintain a high-end editorial feel, **1px solid borders are prohibited** for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface_container_low` section should sit on a `surface` background to create a "soft edge."
*   **Surface Hierarchy & Nesting:** Treat the UI as physical layers of tech. Use the `surface_container` tiers (Lowest to Highest) to define importance. An inner container should always be at least one tier higher or lower than its parent to provide "nested depth."
*   **The "Glass & Gradient" Rule:** Use Glassmorphism for floating overlays. Apply a semi-transparent `surface_container_high` with a backdrop-blur (12px–20px). Main CTAs should utilize a subtle linear gradient from `primary` to `primary_container` to give them a metallic, tactile "soul."

## 3. Typography
Typography in this system acts as the "Voice of Authority."

*   **Display & Headlines (Space Grotesk):** This is our "Epic" font. It is modern, clean, and carries a subtle architectural weight. Use `display-lg` (3.5rem) for hero statements to command attention.
*   **Titles & Body (Manrope):** Our "Technical" font. Manrope provides a neutral, high-legibility counterpart to the display face. It should feel like the HUD (Heads-Up Display) of a starship—clear, functional, and sophisticated.
*   **Labels (Inter):** Reserved for metadata and micro-copy. Use uppercase tracking (+5% to +10%) for labels to enhance the "Technical Command" aesthetic.

## 4. Elevation & Depth
Depth is not a drop shadow; it is a manipulation of light and atmosphere.

*   **The Layering Principle:** Stacking surface tiers is the primary method of elevation. A `surface_container_lowest` card sitting on a `surface_container_low` section creates a natural "recessed" look without traditional shadows.
*   **Ambient Shadows:** For floating elements, shadows must be ultra-diffused. Use a blur radius of 30px–60px with a low-opacity (4%-8%) tint of `on_surface`. Shadows should feel like ambient occlusion, not a "drop."
*   **The "Ghost Border" Fallback:** If a container needs structural definition, use the `outline_variant` token at 15% opacity. This "Ghost Border" provides a hint of structure without breaking the cinematic immersion.
*   **Glow States:** Elements with `secondary_fixed` (blue) or `primary_fixed` (yellow) can utilize a "Glow Shadow"—a very soft, low-opacity outer glow in the same hue to simulate an emissive light source.

## 5. Components

### Buttons
*   **Primary:** Pill-shaped (`full` roundedness) using `primary_fixed` (Yellow). Text color is `on_primary_fixed`. Include a subtle inner-glow to mimic a backlit physical button.
*   **Secondary:** Ghost-style with a `secondary` (Blue) ghost border (20% opacity). On hover, transition to a 10% `secondary` background fill.

### Cards
*   **Visual-First:** Cards must prioritize high-quality imagery. Content should be overlaid using a gradient scrim (from `surface_container_lowest` at 80% to transparent) at the bottom.
*   **No Dividers:** Never use lines to separate header from body. Use `2.5` (0.85rem) spacing or a subtle shift from `surface_container` to `surface_container_high`.

### Inputs & Text Fields
*   **Modern HUD Style:** Instead of a full box, use a bottom-only border (`outline_variant` at 30%) that glows `secondary` when focused. Labels should use `label-md` and always stay visible above the input.

### Selection Chips
*   **Actionable:** Use `md` (0.375rem) roundedness. Unselected chips should be `surface_container_highest`. Selected chips should glow with a `secondary` tint.

### Navigation
*   **The Floating Bar:** Use a `surface_container_lowest` background with a heavy backdrop-blur. The active link should be denoted by a `primary_fixed` dot or underline, never a box.

## 6. Do's and Don'ts

### Do:
*   **Embrace Asymmetry:** Place a `display-lg` headline off-center to create visual tension.
*   **Use Imagery as Foundation:** UI elements should feel like they are floating over a high-resolution environment.
*   **Scale for Impact:** Don't be afraid of the `24` (8.5rem) spacing scale to separate major narrative blocks.

### Don't:
*   **Avoid "Web Standard" Boxes:** Never use a solid 100% opaque border for a container.
*   **No Pure Black (#000000):** Always use `surface` (#131313) to allow for subtle shadows and tonal layering to remain visible.
*   **Stop the Clutter:** If a piece of information isn't vital to the "story" of the page, hide it in a tooltip or a secondary layer. High-end design is as much about what you remove as what you add.