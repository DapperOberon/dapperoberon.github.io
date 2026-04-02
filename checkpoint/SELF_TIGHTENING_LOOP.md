# Checkpoint Self-Tightening Loop

This loop keeps quality tightening over time:

`agent -> rules -> CI -> observability -> tasks -> agent`

## 1) Agent

Every implementation pass should start by reading:

- `checkpoint/ENGINEERING_RULES.md`
- `checkpoint/AGENT_LOOP_TASKS.md`

Then execute the highest-priority open tasks first.

## 2) Rules

Rules are codified in:

- `checkpoint/ENGINEERING_RULES.md`

They are written to be operational (testable in automation), not aspirational.

## 3) CI

GitHub Actions workflow:

- `.github/workflows/checkpoint-loop.yml`

It runs the loop runner script on `push`, `pull_request`, and manual dispatch for `checkpoint/**` changes.

## 4) Observability

Loop runner script:

- `checkpoint/scripts/loop_cycle.mjs`

Outputs:

- JSON report: `checkpoint/observability/latest-loop.json`
- Markdown summary: `checkpoint/observability/latest-loop.md`

CI also uploads these as workflow artifacts for post-run inspection.

## 5) Tasks

The loop script regenerates:

- `checkpoint/AGENT_LOOP_TASKS.md`

When checks fail, this file is populated with actionable fix tasks tied to failing checks.
When checks pass, it records a clean baseline and keeps a small proactive backlog.

## 6) Agent (next pass)

The next implementation pass consumes the regenerated tasks file and repeats the cycle.
