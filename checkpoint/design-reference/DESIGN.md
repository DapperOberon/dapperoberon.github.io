This document describes the foundational design choices for our product, ensuring consistency and a unified user experience.

## Theme Overview

Our theme is designed with a **dark color mode**, emphasizing visual clarity and reducing eye strain in low-light environments. The overall aesthetic leans towards a **modern and clean** feel, with a focus on usability.

## Typography

We employ a consistent typographic system across the application to enhance readability and visual hierarchy:

*   **Headlines:** `Manrope` for impactful titles.
*   **Body Text:** `Manrope` for clear and legible content.
*   **Labels:** `Space Grotesk` for distinct and functional labels.

## Color Palette

The primary color scheme is driven by a vibrant blue, complemented by a deep dark neutral base.

*   **Primary Color:** `#00D4FF` - A striking blue, used for key interactive elements, call-to-actions, and branding accents.
*   **Neutral Color:** `#0A0B0C` - A very dark, almost black, color that provides a deep background for the UI, ensuring the primary color stands out.

## Shape and Spacing

We apply specific guidelines for the shape of UI elements and the spacing between them to create a harmonious layout:

*   **Roundedness:** A **moderate** level of roundedness (value `2`) gives UI elements a friendly yet professional appearance, balancing modern aesthetics with approachability.
*   **Spacing:** A **normal** level of spacing (value `2`) provides a balanced visual density, ensuring elements are neither too cramped nor excessively spread out, contributing to a comfortable user experience.

## Global UI Guardrails

These are hard constraints that apply across all surfaces and components:

*   **No 1px Border Reliance:** Do not rely on `1px` borders as the primary structure or separation mechanism. Prefer either:
    *   flatter, border-light surfaces with spacing and contrast doing the structural work, or
    *   stronger border weights (greater than `1px`) when borders are needed for hierarchy.
*   **Minimum Font Size:** Do not use font sizes smaller than `8pt` equivalent anywhere in the product.
    *   For web implementation, treat this as a strict minimum readability floor and avoid sub-`8pt` text for labels, helper text, and controls.

## Layout Principles

These principles define structure and interaction hierarchy (independent from color/typography styling):

*   **Cover-First Hierarchy:** Game art and title should be the first visual scan target; supporting metadata is secondary.
*   **Template-Driven Surfaces:** Library, Details, Settings, and Activity should follow stable templates instead of one-off compositions.
*   **One Primary Action Per Surface:** Each major surface or section should have one clear primary CTA; all other controls should be secondary.
*   **Progressive Disclosure:** Show core tasks first, then reveal advanced controls (maintenance, overrides, diagnostics) in clearly scoped sections.
*   **Stable Navigation:** Keep global navigation persistent, and keep local navigation patterns consistent on each surface.
*   **Density by Intent:** Browsing surfaces may be denser; editing/settings flows should remain calmer and easier to parse.
*   **Explicit Scope Labels:** Action labels should encode scope directly (for example, `This Entry` vs `Library-wide`).
*   **Local-First Clarity:** Cloud/sync state should be visible and trustworthy, but never dominate core run-tracking workflows.

## IA Map (Current Surface Responsibilities)

Use this as the default information architecture map when designing or refactoring UI:

*   **Library (`/checkpoint/library/`):** Run-tracking workspace for `playing`, `finished`, and `backlog` entries.
    *   Primary goal: update run progress and review tracked library state.
*   **Library Details (`/checkpoint/library/game/?id=...`):** Run-centric detail template for tracked entries.
    *   Primary goal: maintain run details/progress/notes and view metadata in context.
*   **Discover (`/checkpoint/discover/`):** Catalog-first search/browse surface for finding titles before tracking.
    *   Primary goal: evaluate and select games to add to wishlist or library.
*   **Discover Details (`/checkpoint/discover/game/?id=...`):** Decision workspace with richer metadata, media, links, and price snapshot.
    *   Primary goal: make add/wishlist decisions with minimal friction.
*   **Wishlist (`/checkpoint/wishlist/`):** Decision-first planning surface.
    *   Primary goal: evaluate buy timing via price/release context, not run progress.
*   **Wishlist Details (`/checkpoint/wishlist/game/?id=...`):** Wishlist-specific details with price-watch and release context.
    *   Primary goal: monitor price and intent-to-buy signals.
*   **Settings (`/checkpoint/settings/`):** Device/sync/backup/maintenance/activity configuration.
    *   Primary goal: configure behavior without interrupting run-tracking workflows.
