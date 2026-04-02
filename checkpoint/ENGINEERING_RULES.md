# Checkpoint Engineering Rules

These rules are designed to be enforced by automation.

## Build + Runtime Rules

1. CSS build must pass.
   - Command: `npm run build:css` (in `checkpoint/`)
2. Runtime config preflight must pass.
   - Command: `node checkpoint/scripts/preflight_config.mjs`
3. Smoke test must pass.
   - Command: `bash checkpoint/scripts/smoke_test.sh`

## Quality Gate Rules

1. Any failed loop check is release-blocking until resolved.
2. Loop outputs must be regenerated after substantive code changes.
3. New critical checks should be added to `checkpoint/scripts/loop_cycle.mjs`.
4. Regressions discovered in QA should become explicit checklist items or automated checks.

## Documentation Rules

1. Phase checklists must reflect actual implementation status.
2. If a behavior is user-visible and stability-critical, it should exist in:
   - a checklist item, and
   - either smoke/integration coverage or a manual QA step.

## Definition of Green

A green loop means:

- All loop checks pass.
- `checkpoint/AGENT_LOOP_TASKS.md` has no active blocker tasks.
