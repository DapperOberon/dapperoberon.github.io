# UID Migration Plan

Status: In Progress  
Branch: `uid-migration-plan`  
Date: 2026-03-26

This document outlines a safe migration from the current title-derived slug ids to shorter stable alphanumeric ids.

## Why Migrate

Current ids are human-readable and useful during authoring, but they have real costs:

- they are long in URLs
- they are tightly coupled to titles and chronology labels
- importer matching gets harder when titles split across chronology ranges
- renaming an entry can imply id churn unless carefully managed

Short stable ids would make the system more durable as content evolves.

## Recommendation

Do not introduce a new parallel primary key if we can avoid it.

Best migration shape:

- keep using the existing `id` field as the app’s primary identifier
- change the value of `id` to a short stable UID
- support migration from old slug ids only inside runtime persistence logic

Why this is the lowest-risk path:

- most runtime code already expects `entry.id`
- importer and validation tooling already understand `id`
- there is no active public product requirement to preserve old shared links right now
- the only compatibility requirement is preserving existing local watched progress

This means we do not need `legacyIds` at this stage.

## Proposed Target Shape

Each entry would look like:

```json
{
  "id": "a7K2pQ"
}
```

Guidelines:

- `id` should be short, stable, and opaque
- old slug ids only need to be recognized during localStorage migration

## UID Format Recommendation

Recommended format:

- 3 characters
- lowercase base36

Suggested practical choice:

- `base36-3`

Why:

- very short in URLs
- `36^3 = 46,656` possible ids, which is plenty for this project
- easier to read and validate than mixed-case schemes

## Deterministic UID Strategy

Yes, the importer can regenerate the same UID every time, but the best implementation is "stable" rather than "derived fresh from display text each run."

Recommended approach:

- keep a checked-in migration manifest that maps an entry’s stable matching signature to its assigned UID
- importer reads that manifest before generating ids
- if an entry already has a UID in the manifest, reuse it
- if an entry is new, generate one UID once, write it to the manifest, and reuse it forever after

Why this is better than hashing title text directly:

- title or chronology labels can still change
- a pure hash of display fields would churn ids if those fields drift
- a manifest gives deterministic reruns without tying the UID to unstable copy

Suggested matching signature for the manifest:

- `era`
- `title`
- `type`
- `releaseYear`
- `year`

For split chronology entries, include the exact chronology `year` token so each split row remains distinct.

## Systems Affected

### Routing

Current dependency:

- [`modules/routing.js`](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/star-wars-timeline/modules/routing.js)

Migration needs:

- share URLs should emit the new short `id`
- no long-term legacy URL alias layer is required right now
- if we later decide to preserve old URLs, that can be added as a separate compatibility feature

### Entry Lookup

Current dependency:

- [`modules/timeline-data.js`](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/star-wars-timeline/modules/timeline-data.js)

Migration needs:

- build the primary `entryMap` by new `id`
- no alias map is required for the first migration pass

### Watched Progress Storage

Current dependency:

- [`modules/persistence.js`](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/star-wars-timeline/modules/persistence.js)

Migration needs:

- current watched key should use the new short `id`
- loader must also check:
  - title-based legacy keys
  - fingerprint legacy keys
  - slug-id keys from the previous `id` scheme
- when old progress is found, rewrite it under the new UID-based key and remove the old key

### Watched State In Source Data

Current issue:

- the live JSON still includes `watched`
- watched state should be local to each user, not shipped as shared product state

Migration needs:

- treat shipped `watched` values as temporary authoring/import data only
- stop relying on `watched` from the source JSON as a meaningful runtime default
- eventually remove `watched` from the live data file or normalize it away to `0` at import/build time

Recommendation:

- after UID migration plumbing is in place, make the live data contract local-first:
  - no persistent watched values in `timeline-data.json`
  - watched state comes from `localStorage` only

### Import Tooling

Current dependency:

- [`scripts/import_chronological_data.py`](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/star-wars-timeline/scripts/import_chronological_data.py)

Migration needs:

- preserve existing `id`
- never regenerate a new `id` for an already-migrated entry unless explicitly asked
- new entries should receive a fresh UID
- preserve local-user-safe metadata only
- do not treat `watched` from imported source data as authoritative shared state

### Validation

Current dependency:

- [`scripts/validate_timeline_data.py`](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/star-wars-timeline/scripts/validate_timeline_data.py)

Migration needs:

- validate UID format
- validate UID uniqueness
- optionally warn if live source data still contains non-zero `watched` values after the migration cleanup

## Migration Phases

### Phase 1: Persistence Compatibility Plumbing

Goal:

- preserve existing local watched progress after ids change

Changes:

- extend persistence to migrate watched-state keys from legacy slug ids
- keep title-key and fingerprint-key migration support
- allow optional one-time migration candidates for old slug ids during the UID cutover
- ensure the current runtime always rewrites loaded progress under the new UID-based key

Success criteria:

- existing watched progress survives when the underlying ids change

### Phase 2: Data Migration Script

Goal:

- generate short ids for every live entry without breaking compatibility

Changes:

- add a one-time migration script that:
  - assigns a new UID to each entry
  - preserves existing metadata exactly
  - writes and reuses a checked-in UID manifest so reruns stay deterministic

Success criteria:

- every entry has a short unique `id`
- rerunning the migration script produces the same ids again

### Phase 3: Importer Integration

Goal:

- make importer output safe for a UID-based dataset

Changes:

- update [`import_chronological_data.py`](/mnt/Misc%20SSD/Github%20Respositories/dapperoberon.github.io/star-wars-timeline/scripts/import_chronological_data.py) so:
  - existing entries keep their UID
  - new entries get a fresh UID
  - no duplicate UIDs are introduced
  - imported `watched` values do not become shared live state

Success criteria:

- importing chronology updates does not churn ids
- new entries enter the system with valid UIDs automatically

### Phase 4: Remove Shared Watched State From Live Data

Goal:

- make watched progress purely local

Changes:

- update the runtime to ignore source `watched` as shared state
- remove `watched` from the live JSON, or force it to `0` in importer output before writing live data
- ensure importer backup/overwrite flow still works

Success criteria:

- a fresh visitor does not inherit authoring watched progress from the shipped data file
- existing local users still retain their own watched progress through `localStorage`

### Phase 5: Validation And Verification

Goal:

- make the migration hard to regress

Current branch status:

- Phase 1 complete on this branch
- Phase 2 complete on this branch
- Phase 3 complete on this branch
- Phase 4 complete on this branch
- Phase 5 in progress, with automated verification already passing

Changes:

- extend timeline validation for UID and alias rules
- add focused tests or checks around:
  - alias URL resolution
  - watched-state migration
  - importer preservation of existing ids

Success criteria:

- `verify_all.sh` still passes
- migration-specific checks pass

## Open Decisions

1. Should the short UID be 6, 7, or 8 characters?
2. Should ids be base36 lowercase only, or base62 mixed-case?
3. Should the migration script be one-off, or built into the importer as an optional mode?
4. Should live JSON drop `watched` entirely, or keep it but force it to `0` everywhere?

## Suggested Execution Order

1. Add persistence migration support for old slug-id keys
2. Add UID validation rules
3. Write the one-time data migration script
4. Migrate the live dataset
5. Update the importer to preserve UIDs
6. Remove shared watched state from live data
7. Re-run full verification and manual watched-state checks

## Definition Of Success

- every entry uses a short stable primary id
- watched progress survives the migration
- importer updates do not churn ids
- shipped data no longer exposes authoring watched progress
- validation catches UID collisions before ship
