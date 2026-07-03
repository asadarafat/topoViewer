# Speed Up CI Feedback Loop

## Why

TopoViewer's GitHub `CI` workflow is reliable, but it is now slow enough to
shape the development loop. The latest successful `development` run took about
11.5 minutes, with several recent runs landing around 10-12 minutes and one
recent run near 16 minutes. The slowest tail in the latest run was:

- dependency install and browser setup, about 1.5 minutes;
- documentation build and smoke, about 1.4 minutes;
- TopoViewer package tests, about 40 seconds;
- VS Code harness tests, about 2.4 minutes;
- package inspection, about 1 minute;
- public-readiness guardrails, about 2.9 minutes.

The earlier CI stabilization work made lanes observable and reliable. This
change focuses on speed without weakening the safety net.

The first measurable target is to reduce normal remote `CI` wall-clock by at
least 20% versus the latest 687 second baseline, or bring normal `CI` under 540
seconds, while preserving required coverage.

## What Changes

Investigate and implement a faster feedback loop for GitHub Actions:

- measure recent `CI`, `Docs`, `Security`, and `CodeQL` run duration by
  workflow, job, and step;
- identify duplicated work across `CI` and `Docs`;
- identify duplicated work inside `ci:package` and `ci:public-readiness`;
- identify duplicated work between `CI` and `Security`, especially because both
  currently run public-readiness and security/package checks;
- decide which checks must stay on every push and which can move to PR-only,
  scheduled, manual, or release-gate workflows;
- consider splitting the monolithic `CI` job into parallel jobs after measuring
  the total runtime and compute cost tradeoff;
- add timing output to local and remote CI lanes so regressions are visible;
- preserve required coverage for package safety, docs safety, renderer parity,
  public-readiness, security, and release artifacts.

The target is faster signal, not fewer checks for the sake of speed.

## Capabilities

### New Capabilities

- `ci-duration-baseline`: a documented baseline for recent GitHub workflow,
  job, and step durations.
- `ci-speed-budget`: explicit target and ceiling for normal push feedback.
- `ci-lane-timing`: local and remote CI lane output includes elapsed time per
  lane and per sub-step.
- `ci-work-deduplication`: duplicated work between lanes and workflows is
  either removed, justified, or moved to a more appropriate workflow.
- `ci-check-relocation-contract`: moved checks name the exact workflow file,
  trigger, required/optional status, and release/deploy gate relationship that
  preserves coverage.
- `ci-parallel-feedback`: independent CI lanes may run as separate jobs where
  doing so reduces wall-clock time without hiding failures.

## Impact

- `.github/workflows/ci.yml` may split into multiple jobs for generated checks,
  quality/schema checks, docs smoke, package tests, harness tests, package
  artifacts, and public-readiness guardrails.
- `.github/workflows/docs.yml` may stop duplicating checks that are already
  proven by `CI`, while keeping all checks needed before deploying Pages.
- `scripts/ci.mjs` may record timings and emit a summary table.
- `ci:public-readiness` may be narrowed to readiness-only guardrails when
  `ci:package`, docs smoke, and security workflows already cover the expensive
  package/security checks in the same commit.
- `.github/workflows/security.yml` may stop repeating full public-readiness if
  the equivalent adoption/security risks remain covered by `CI`, scheduled
  security checks, or release-gate workflows.
- GitHub workflow concurrency may cancel stale in-progress branch runs where it
  is safe to do so.
- Documentation should explain which workflows are fast feedback, release
  gates, scheduled hardening, and deployment gates.

## Non-Goals

- Do not hide real failures behind retries.
- Do not remove docs smoke before Pages deployment.
- Do not stop running package artifact checks before publishing.
- Do not move security checks out of the normal development signal without an
  equivalent scheduled or required workflow.
- Do not optimize only for GitHub billing if it makes the developer feedback
  loop worse.
- Do not require external paid CI services.
