# Design

## Current Baseline

Recent `development` workflow history shows that `CI` usually takes around
10-12 minutes, with occasional longer runs. The latest measured run was:

- Run: `28655703963`
- Commit: `a8d009f5da773d0c0e82e90929b83a6b751faf3d`
- Result: success
- Created: `2026-07-03T10:49:43Z`
- Completed: `2026-07-03T11:01:10Z`
- Wall time: about 11 minutes 27 seconds

The latest job step timings were:

| Step | Approx duration |
| --- | ---: |
| Install Node dependencies | 70s |
| Install Chromium for Playwright | 22s |
| Lint and typecheck | 16s |
| Validate schemas and semantics | 7s |
| Build packages and synced assets | 40s |
| Build and smoke documentation targets | 82s |
| Test TopoViewer package | 40s |
| Test VS Code harness | 146s |
| Run performance smoke | 11s |
| Inspect package artifacts | 60s |
| Check public-readiness guardrails | 176s |

`Docs` is faster, usually around 4 minutes, because it focuses on docs build,
smoke, wheel build, and Pages artifact upload. The last successful Docs run for
the same commit took about 4 minutes.

For baseline comparisons, successful completed runs are used for p50, p90, and
worst-case duration. Failed and cancelled runs are recorded separately because
they often exit before the expensive tail and would distort speed conclusions.

The initial target is:

- reduce remote `CI` wall-clock by at least 20% from the 687 second latest-run
  baseline; or
- bring normal remote `CI` under 540 seconds; and
- keep required package, docs, harness, security, public-readiness, and artifact
  coverage intact.

## Main Speed Problems

### Sequential CI Shape

The `CI` workflow has one large job. It now exposes named steps, which is good
for triage, but the steps still run serially. Independent work such as
TopoViewer tests, harness tests, docs smoke, package inspection, and some
readiness checks could run in separate jobs after shared setup assumptions are
made explicit.

### Duplicate Work Between Lanes

The `package` lane runs package checks, install checks, Grafana build, package
artifact inspection, wheel build, and wheel inspection.

The `public-readiness` lane repeats several expensive checks:

- pack check;
- npm install command check;
- MkDocs install command check;
- Grafana panel build;
- package artifact inspection.

That duplication is defensible while hardening public adoption, but it is a
large part of the final CI tail. If the same commit already ran the package
lane, public-readiness can focus on readiness-only checks plus assertions that
the required package lane was run.

### Duplicate Work Between CI And Security

The `Security` workflow currently runs `npm run ci:public-readiness`, then also
runs `npm run dependency:advisories` and `npm run go:vulncheck`. The
`public-readiness` lane itself already runs those dependency and Go checks. This
creates duplicated security work inside the same workflow and repeats some
checks already present in normal `CI`.

The optimization must not simply delete those checks. Any relocation must name
the exact workflow file, trigger, required/optional status, and relationship to
release or deploy gates.

### Duplicate Work Between CI And Docs

The `CI` workflow runs `ci:docs`; the `Docs` workflow also runs `ci:docs` before
deploying. This is safe but expensive. The right answer may not be simple
removal: the deployment workflow must still validate the artifact it deploys,
while the CI workflow may only need enough docs coverage to catch source
regressions before merge.

### Browser Setup Cost

Playwright Chromium installation costs about 20-30 seconds per job. If CI is
parallelized into many jobs, the total runner time goes up even while wall-clock
time goes down. Splitting jobs should therefore be limited to lanes that save
real waiting time.

## Candidate Improvements

### Add Timing Instrumentation

`scripts/ci.mjs` should print elapsed time for every lane and sub-step. In
GitHub Actions, the timing summary should be written to the step summary. This
turns performance drift into observable data rather than anecdote.

### Split CI By Feedback Class

A likely split is:

- `generated-quality`: generated content, lint/typecheck, schemas;
- `build-docs`: package build, docs build, docs smoke, docs artifact check;
- `test-runtime`: TopoViewer package tests and performance smoke;
- `test-harness`: VS Code harness tests;
- `package-artifacts`: npm package, install checks, Grafana build, wheel checks;
- `public-readiness`: readiness-only guardrails after required jobs pass.

This is not free. Every job repeats checkout and dependency installation unless
the workflow uses artifacts or caching carefully. The split should be validated
with real remote timing before keeping it.

### Narrow Public-Readiness Duplication

Public-readiness should verify the public adoption contract. It should not
rebuild every artifact already built by a required job in the same workflow
unless the script is intentionally being used as a standalone local gate.

The local `npm run ci:public-readiness` may remain complete, while the GitHub
workflow can call a narrower mode such as `ci:public-readiness --assume-ci-lanes`
or a new lane if that contract is clearer.

### Separate Fast Feedback From Release Hardening

Every push should remain meaningful. But some checks are better as:

- release preflight;
- manual workflow dispatch;
- nightly scheduled hardening;
- publish workflow preflight.

Examples to investigate:

- full wheel inspection on every push versus release/package paths;
- repeated package artifact inspection in both package and public-readiness;
- expensive security/reporting checks already covered by `Security`.

Any moved check needs an exact owner. "Scheduled" or "release gate" is not
specific enough. The investigation must name the workflow file, trigger, and
whether the result is expected to be required, advisory, deployment-gating, or
release-gating.

### Workflow Concurrency

For branch pushes, stale in-progress CI runs may be safely cancelled when a new
commit supersedes them. Deployment workflows need more care because Pages
deploys should remain ordered.

## Acceptance Criteria

The change is only successful if it proves both speed and coverage:

- `investigation.md` records pre-change and post-change GitHub Actions run IDs,
  commit SHAs, workflow durations, step timings, and the comparison method;
- the before/after comparison includes absolute seconds saved or added,
  percentage change, and whether the target was met;
- latest remote `CI` wall-clock is at least 20% faster than the 687 second
  latest-run baseline or under 540 seconds, or the investigation documents why
  retained coverage justifies not meeting that target;
- required package, docs, harness, security, public-readiness, and artifact
  checks still run in an appropriate workflow before release or deployment;
- failures remain easy to diagnose by lane and step;
- local `npm run ci` remains the full local gate;
- no public docs, package, or release workflow points at a removed command.
