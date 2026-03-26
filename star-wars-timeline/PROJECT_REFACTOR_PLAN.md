# Project Refactor Plan

Status: Active Planning  
Date: 2026-03-26

## Purpose

This document captures the current codebase assessment for `star-wars-timeline/` and the next five refactors with the highest leverage for maintainability, safety, and day-to-day development speed.

## Current Assessment

- The project structure is strong and easy to navigate.
- Active runtime code, data, scripts, archive material, design references, and QA artifacts are clearly separated.
- The app already shows good modular instincts:
  - UI shell responsibilities are separated into `modules/shell.js`
  - state/bootstrap logic is separated into `modules/app-state.js`
  - interaction wiring is separated into `modules/app-interactions.js`
  - persistence concerns are separated into `modules/persistence.js`
  - data helpers are separated into `modules/data.js`
- The codebase feels like a maintained product, not a throwaway prototype.

## Main Pressure Point

- `app.js` is currently the gravitational center of the application.
- `app.js` is 2,088 lines and still owns too many responsibilities at once:
  - app-level constants and configuration
  - preference defaults and migration logic
  - filtering/search behavior
  - routing/deep-link behavior
  - timeline render orchestration
  - view-specific helper logic
- This is the main source of future maintenance risk even though the app is functioning well today.

## Refactor Priorities

### 1. Break `app.js` Into Domain Modules

Priority: Highest  
Goal: Reduce the size and ownership burden of `app.js`

Move these responsibilities into dedicated modules:

- preferences and theme config
- filter/search creation and matching
- URL/deep-link sync helpers
- timeline preparation and entry indexing helpers
- constants such as era assets, story arc options, and media labels

Suggested target files:

- `modules/preferences.js`
- `modules/filters.js`
- `modules/routing.js`
- `modules/timeline-data.js`
- `modules/constants.js`

Expected outcome:

- `app.js` becomes an orchestration layer rather than a catch-all file.
- New feature work becomes safer because responsibilities are easier to find and change in isolation.

### 2. Normalize Timeline Data Rules Into a Single Data Layer

Priority: High  
Goal: Stop view logic and raw data assumptions from spreading across the app

The project already has good helper functions in `modules/data.js`, but the data contract can be pushed further. Add a normalization layer that guarantees every entry has a predictable shape before rendering begins.

Focus areas:

- normalize poster paths, runtime fields, continuity labels, and optional links
- centralize show-vs-film checks
- centralize entry search text generation
- centralize derived labels such as media type and metadata text

Expected outcome:

- rendering code becomes simpler
- edge-case handling becomes consistent
- future JSON edits are less likely to break UI behavior

### 3. Add Lightweight Automated Verification

Priority: High  
Goal: Catch regressions before visual QA

The repo currently shows careful manual QA, but it would benefit from a small automated safety net. This does not need a large framework rollout to be useful.

Recommended first layer:

- syntax checks for active JavaScript modules
- a validation script for `data/timeline-data.json`
- a validation script for `data/music-data.json`
- a small smoke test for app boot and key routes over local HTTP

Nice second layer:

- a few focused tests for persistence key migration
- a few focused tests for filter logic and search text generation

Expected outcome:

- data mistakes and small refactor regressions get caught early
- confidence increases when touching `app.js` and the JSON payloads

### 4. Document the Runtime Architecture and Data Workflow

Priority: Medium  
Goal: Make the project easier to resume and safer to evolve

The project has planning docs, but it needs one short operational document that explains how the live app fits together.

Recommended content:

- which files are active runtime files
- what is archived and should not be edited casually
- where timeline and music data come from
- what the Python scripts do
- how local watched state is stored and migrated
- how to run a quick verification pass before shipping changes

Expected outcome:

- future cleanup work becomes easier
- “is this active or legacy?” ambiguity keeps shrinking
- the project becomes easier to re-enter after time away

### 5. Consolidate Scripting and Archive Hygiene

Priority: Medium  
Goal: Keep active tooling small and trustworthy

The script cleanup is moving in the right direction already. Continue that by treating the import/update scripts as a minimal supported toolchain instead of a growing pile of one-off utilities.

Recommended actions:

- keep only currently useful scripts in `scripts/`
- move one-off or superseded extractors into `archive/scripts/`
- add a short header comment to each active script describing its purpose and inputs
- document expected output paths and any prerequisites like a logged-in Firefox profile

Expected outcome:

- active tooling stays understandable
- older experiments remain available without cluttering the main workflow
- script usage becomes less dependent on memory

## Recommended Execution Order

1. Extract constants, preferences, and routing helpers from `app.js`
2. Expand the data normalization layer and reduce UI-side assumptions
3. Add validation and smoke-test automation
4. Write a short runtime architecture document
5. Finish script/documentation cleanup around imports and archive boundaries

## Definition Of Success

- `app.js` becomes substantially smaller and easier to scan
- active responsibilities are obvious from file names alone
- JSON data changes have basic automated validation
- key product behaviors can be smoke-tested quickly
- active vs archived tooling is consistently documented

## Notes

- This plan favors maintainability work that improves future feature speed.
- The current UI and product direction are strong enough that architecture cleanup is a better investment than a broad redesign.
