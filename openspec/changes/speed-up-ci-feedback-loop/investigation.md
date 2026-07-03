# CI Speed Investigation

## Baseline Method

Baseline statistics use the last 20 `development` runs per workflow collected
on 2026-07-03. p50, p90, and worst-case duration use only completed successful
runs. Failed runs are tracked separately because they can exit before expensive
tail checks and would distort normal feedback timing.

The initial target is to reduce normal remote `CI` wall-clock by at least 20%
from the latest 687 second baseline, or bring normal remote `CI` under 540
seconds, while preserving required package, docs, harness, security,
public-readiness, and artifact coverage.

## Workflow Baseline

| Workflow | Success / 20 | Failed / 20 | p50 | p90 | Worst success | Latest success |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| CI | 18 | 2 | 654s | 836s | 958s | 687s |
| Docs | 18 | 2 | 246s | 727s | 1358s | 241s |
| Security | 17 | 3 | 330s | 428s | 446s | 310s |
| CodeQL | 20 | 0 | 112s | 121s | 127s | 108s |

Latest baseline commit: `a8d009f5da773d0c0e82e90929b83a6b751faf3d`.

## Recent CI Runs

| Run | Result | Duration | Commit |
| --- | --- | ---: | --- |
| 28655703963 | success | 687s | a8d009f |
| 28650643468 | success | 664s | ca22a59 |
| 28649941028 | success | 642s | aaf6ef4 |
| 28649460023 | success | 688s | 0800e26 |
| 28648735517 | success | 644s | 6090b38 |
| 28640153478 | success | 718s | 4203eb8 |
| 28622151990 | success | 650s | 6b646dc |
| 28621019363 | success | 958s | ddfd483 |
| 28614575705 | success | 595s | 31073ad |
| 28613217802 | success | 654s | fac4737 |
| 28609228645 | success | 836s | 3f83417 |
| 28566923143 | failure | 458s | a0d1663 |
| 28552100086 | success | 622s | 918f8fa |
| 28551507698 | failure | 290s | e0c9116 |
| 28547221874 | success | 686s | 505ea81 |
| 28541248773 | success | 629s | b3662b1 |
| 28540135526 | success | 632s | 7145543 |
| 28539147753 | success | 830s | 5b817e3 |
| 28538840218 | success | 607s | 1548bc9 |
| 28534367974 | success | 705s | 95a43d9 |

Failed CI runs in this sample:

- `28566923143`: failed at `Inspect package artifacts`.
- `28551507698`: failed at `Build and smoke documentation targets`.

## Recent Docs Runs

| Run | Result | Duration | Commit |
| --- | --- | ---: | --- |
| 28655703935 | success | 241s | a8d009f |
| 28650643463 | success | 247s | ca22a59 |
| 28649940936 | success | 230s | aaf6ef4 |
| 28649460037 | success | 255s | 0800e26 |
| 28648735544 | success | 255s | 6090b38 |
| 28640153487 | success | 231s | 4203eb8 |
| 28622151995 | success | 253s | 6b646dc |
| 28621019377 | success | 269s | ddfd483 |
| 28614575720 | success | 231s | 31073ad |
| 28613217791 | success | 1358s | fac4737 |
| 28609228655 | success | 727s | 3f83417 |
| 28566923147 | success | 221s | a0d1663 |
| 28552100051 | success | 253s | 918f8fa |
| 28551507766 | failure | 211s | e0c9116 |
| 28547221888 | success | 241s | 505ea81 |
| 28541248820 | success | 231s | b3662b1 |
| 28540135546 | success | 226s | 7145543 |
| 28539147814 | success | 246s | 5b817e3 |
| 28538840238 | failure | 218s | 1548bc9 |
| 28534367947 | success | 336s | 95a43d9 |

Failed Docs runs in this sample:

- `28551507766`: failed at `Build and smoke documentation targets`.
- `28538840238`: failed at `Build MkDocs wheel`.

## Recent Security And CodeQL Runs

Security sample:

- Success / 20: 17.
- Failed / 20: 3.
- p50: 330s.
- p90: 428s.
- Worst successful run: 446s.
- Latest successful run: 310s.

Failed Security runs in this sample:

- `28566923477`: failed at `Public readiness guardrails`.
- `28551507926`: failed at `Public readiness guardrails`.
- `28540135793`: failed at `Public readiness guardrails`.

CodeQL sample:

- Success / 20: 20.
- Failed / 20: 0.
- p50: 112s.
- p90: 121s.
- Worst successful run: 127s.
- Latest successful run: 108s.

## Latest CI Step Timing

Latest successful CI run: `28655703963`.

| Step | Duration |
| --- | ---: |
| Checkout | 1s |
| Set up Node.js | 2s |
| Set up Go | 4s |
| Set up Python | 0s |
| Install Node dependencies | 70s |
| Install Chromium for Playwright | 22s |
| Report environment | 1s |
| Check generated content | 1s |
| Lint and typecheck | 16s |
| Validate schemas and semantics | 7s |
| Build packages and synced assets | 40s |
| Build and smoke documentation targets | 82s |
| Test TopoViewer package | 40s |
| Test VS Code harness | 146s |
| Run performance smoke | 11s |
| Inspect package artifacts | 60s |
| Check public-readiness guardrails | 176s |

## Baseline Runner Setup Cost

Latest CI setup and dependency cost before the first project check:

- checkout: 1s;
- Node setup: 2s;
- Go setup: 4s;
- Python setup: 0s;
- `npm ci`: 70s;
- Playwright Chromium install: 22s.

Total setup cost before project checks: about 99s.

## Baseline Repeated-Work Cost

Known repeated or overlapping work before implementation:

- `ci:package` runs pack/install/Grafana artifact/package/wheel checks and took
  about 60s in the latest CI run.
- `ci:public-readiness` repeats pack check, consumer install check, MkDocs
  install check, Grafana panel build, package artifact inspection, dependency
  advisory check, and Go vulnerability check; the full public-readiness lane
  took about 176s in latest CI.
- `Security` also runs `ci:public-readiness`, then runs dependency advisory and
  Go vulnerability checks again as standalone steps.
- `CI` and `Docs` both run `ci:docs`; `Docs` must still validate the Pages
  artifact before deploy, so this is not automatically removable.

## Baseline Review

Phase 1 evidence supports implementation of timing instrumentation first. The
first optimization candidate should be duplicate-work reduction around
public-readiness/package/security checks, not workflow parallelization. Parallel
jobs would repeat the roughly 99s setup cost unless caching or artifacts offset
it, so splitting CI should wait until after dedupe evidence exists.

## Timing Instrumentation Validation

Small-lane timing sample for `npm run ci:env` under Node 24:

| Run | Result | Outer shell time | Script-reported lane time |
| --- | --- | ---: | ---: |
| Before instrumentation | success | 0.256s | n/a |
| After instrumentation | success | 0.220s | 92ms |

The small-lane sample shows no material overhead from timing instrumentation.
The difference is below normal shell/process noise and should not be treated as
a speedup.

GitHub step-summary behavior was checked locally by setting
`GITHUB_STEP_SUMMARY=/tmp/topoviewer-ci-summary.md` for `npm run ci:env`. The
summary included total elapsed time, lane status, step status, and duration.

Failure behavior was checked by invoking `scripts/ci.mjs --lane env` with the
child `node` command intentionally unavailable in `PATH`. The command exited
with status 1 and still wrote both the failure summary and the timing table.

Multi-step lane timing was checked with `npm run ci:schemas`; the lane passed
and reported:

- `validate schemas`: 1.2s;
- `validate semantics`: 5.9s;
- lane total: 7.0s.

## Duplicate Work Audit

`ci:package` owns package artifact and install-contract checks:

- pack check;
- consumer install command check;
- MkDocs PyPI install command check;
- Grafana plugin artifact build;
- package artifact inspection;
- MkDocs wheel build;
- MkDocs wheel inspection.

Full `ci:public-readiness` previously repeated several checks already owned by
`ci:package`:

- pack check;
- consumer install command check;
- MkDocs PyPI install command check;
- Grafana plugin artifact build;
- package artifact inspection.

Full `ci:public-readiness` also runs dependency advisory and Go vulnerability
checks. The `Security` workflow then ran full public-readiness and repeated
dependency advisory and Go vulnerability checks as standalone steps.

`CI` and `Docs` both run `ci:docs`. This remains intentionally unchanged in
this slice because Pages deployment must validate the artifact it publishes.

## Duplicate Work Reduction

Selected first candidate: introduce `ci:public-readiness:core` for remote
`CI` and `Security`, while keeping full `ci:public-readiness` as the local and
release public-adoption gate.

`ci:public-readiness:core` keeps:

- docs lint;
- object reference drift check;
- curated examples audit;
- renderer parity asset preparation;
- renderer parity;
- hostile-content tests;
- security health report;
- public-readiness guardrails.

The core lane removes package checks and dependency/Go checks because:

- package checks still run in `.github/workflows/ci.yml` through `npm run
  ci:package`;
- dependency advisory and Go vulnerability checks still run in
  `.github/workflows/security.yml` as standalone steps;
- full local/release `npm run ci` still runs full `ci:public-readiness`, so the
  local gate remains conservative.

Exact replacement coverage:

| Removed from remote public-readiness core | Replacement owner |
| --- | --- |
| pack check | `.github/workflows/ci.yml`, push/pull_request, `npm run ci:package`, required CI gate |
| consumer install check | `.github/workflows/ci.yml`, push/pull_request, `npm run ci:package`, required CI gate |
| MkDocs PyPI install check | `.github/workflows/ci.yml`, push/pull_request, `npm run ci:package`, required CI gate |
| Grafana plugin artifact build | `.github/workflows/ci.yml`, push/pull_request, `npm run ci:package`, required CI gate |
| package artifact inspection | `.github/workflows/ci.yml`, push/pull_request, `npm run ci:package`, required CI gate |
| dependency advisory check | `.github/workflows/security.yml`, push/pull_request/schedule/workflow_dispatch, standalone `npm run dependency:advisories`, security gate |
| Go vulnerability check | `.github/workflows/security.yml`, push/pull_request/schedule/workflow_dispatch, standalone `npm run go:vulncheck`, security gate |

Local timing after implementation:

| Command | Result | Duration |
| --- | --- | ---: |
| `npm run ci:package` | pass | 48.9s |
| `npm run ci:public-readiness:core` | pass | 43.4s |
| `npm run ci:public-readiness` | pass | 95.9s |

The local readiness-lane delta is 52.5s saved when remote workflows use the
core lane instead of full public-readiness. The expected remote `CI` improvement
is lower than the full 52.5s if runner variance dominates, and higher if the
remote repeated package/security checks are slower than local. This change is
not expected to meet the full 20% CI target by itself; it is the first safe
dedupe slice before considering workflow shape.
