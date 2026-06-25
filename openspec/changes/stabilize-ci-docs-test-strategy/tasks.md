# 1. Investigation

- [x] 1.1 Collect the last 10 GitHub `CI` runs on `development` with run ID, commit, result, duration, and failed step
- [x] 1.2 Collect the last 10 GitHub `Docs` runs on `development` with run ID, commit, result, duration, and failed step
- [x] 1.3 Classify each failure using the taxonomy in `design.md`
- [x] 1.4 For each failure, record whether it reproduced locally with Node 24
- [x] 1.5 For each failure, record whether it reproduced locally with `CI=true`
- [x] 1.6 Identify which failures had enough artifacts/logs to diagnose without rerunning
- [x] 1.7 Record the investigation summary in this OpenSpec change or a linked study file

# 2. CI Command Decomposition

- [x] 2.1 Audit every root `npm run *` command and classify it as `dev`, `serve`, `sync`, `check`, `validate`, `build`, `test`, `ci`, `pack`, `wheel`, `benchmark`, or `clean`
- [x] 2.2 Audit workspace `npm run *` commands that are called by root scripts
- [x] 2.3 Identify duplicate or confusing aliases such as overlapping docs/MkDocs build commands
- [x] 2.4 Define which commands may write files and which commands must be check-only
- [x] 2.5 Add an environment report script for Node, npm, Python, OS, Playwright, Chromium, git SHA, and relevant env vars
- [x] 2.6 Add `npm run ci:quality`
- [x] 2.7 Add `npm run ci:schemas`
- [x] 2.8 Add `npm run ci:generated`
- [x] 2.9 Add `npm run ci:build`
- [x] 2.10 Add `npm run ci:test:topoviewer`
- [x] 2.11 Add `npm run ci:test:harness`
- [x] 2.12 Add `npm run ci:package`
- [x] 2.13 Add `npm run ci:docs`
- [x] 2.14 Add `npm run ci:perf:smoke`
- [x] 2.15 Keep `npm run ci` as the full local gate by orchestrating the named commands
- [x] 2.16 Add `npm run ci:remote-parity` to run the full gate with GitHub-like `CI=true` behavior
- [x] 2.17 Ensure successful `check:*`, `validate:*`, `test:*`, and `ci:*` commands do not leave generated source/projection diffs

# 3. GitHub Workflow Alignment

- [x] 3.1 Update `.github/workflows/ci.yml` to call the named CI commands as separate visible steps
- [x] 3.2 Update `.github/workflows/docs.yml` to call `npm run ci:docs` instead of duplicating docs command order
- [x] 3.3 Keep Node.js pinned to 24 in both workflows
- [x] 3.4 Keep Python setup explicit in both workflows
- [x] 3.5 Upload Playwright traces, screenshots, and relevant generated artifacts on failure
- [x] 3.6 Ensure Pages deploy runs only after docs smoke validation succeeds

# 4. Generated Artifact Contract

- [x] 4.1 Ensure content projection checks fail before browser tests when generated docs/examples are stale
- [x] 4.2 Add or tighten checks for committed MkDocs embed assets after `sync:mkdocs-assets`
- [x] 4.3 Add or tighten checks for Zensical generated source and asset drift
- [x] 4.4 Add or tighten checks for browser harness static fixture index drift
- [ ] 4.5 Ensure failure output names the canonical source file and stale projection file

# 5. Playwright Hardening

- [x] 5.1 Set package Playwright server reuse to `false` under `CI=true`
- [x] 5.2 Set harness Playwright server reuse to `false` under `CI=true`
- [ ] 5.3 Add a clear server/build marker check so tests do not attach to stale local servers
- [ ] 5.4 Replace brittle SVG path formatting assertions with path-command or geometry-aware checks
- [ ] 5.5 Replace transient status-only assertions with durable YAML, object state, or button state assertions
- [ ] 5.6 Review geometry assertions and name tolerances where pixel drift is acceptable
- [ ] 5.7 Ensure console error filtering is explicit and does not hide actionable errors
- [x] 5.8 Keep traces and screenshots retained on failure

# 6. Docs Smoke Coverage

- [x] 6.1 Add a MkDocs built-site smoke test for at least one representative TopoViewer embed
- [x] 6.2 Add a Zensical built-site smoke test for at least one representative TopoViewer embed
- [x] 6.3 Add a Zensical lifecycle test that catches "requires manual refresh" regressions
- [x] 6.4 Add a browser harness static-site smoke test for `/topoviewer/harness/`
- [x] 6.5 Validate representative selected-layer and attention attributes in deployed docs artifacts
- [x] 6.6 Keep smoke tests local to built `site/**`, not the public GitHub Pages URL

# 7. Performance And Stress Policy

- [x] 7.1 Keep the 1k-node attention benchmark as required smoke coverage
- [ ] 7.2 Define where 10k-node stress runs live: scheduled workflow, manual workflow, or local-only command
- [ ] 7.3 Document performance budgets for default fixtures, dense fixtures, and stress fixtures
- [x] 7.4 Preserve benchmark output as CI artifacts if a performance gate fails

# 8. Documentation

- [x] 8.1 Document the failure taxonomy for contributors
- [x] 8.2 Document which targeted CI command to run for common change types
- [x] 8.3 Document the remote-only failure triage process using `gh run view --log-failed`
- [x] 8.4 Document when retries are allowed and why retries must not hide regressions
- [x] 8.5 Document the npm command taxonomy and mutation rules
- [ ] 8.6 Document any retained compatibility aliases and any deprecated command names
- [x] 8.7 Update `openspec/README.md` when this change is implemented or archived

# 9. Validation

- [ ] 9.1 Run `npm run ci:remote-parity`
- [ ] 9.2 Run `npm run ci`
- [ ] 9.3 Push to `development`
- [ ] 9.4 Confirm GitHub `CI` passes
- [ ] 9.5 Confirm GitHub `Docs` passes
- [ ] 9.6 Archive this OpenSpec change only after the latest remote `CI` and `Docs` runs are green

Local targeted validation completed on the active patch set:

- [x] `npm run ci:env`
- [x] `npm run ci:quality`
- [x] `npm run ci:build`
- [x] `npm run docs:build:fast`
- [x] `TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD=1 npm run zensical:build`
- [x] `npm run vscode:harness:build`
- [x] `npm run docs:smoke`
- [x] `npm run ci:schemas`
- [x] `CI=true npm run ci:test:harness`
- [x] `CI=true npm run ci:test:topoviewer`
- [x] `npm run ci:perf:smoke`
- [x] `npm run ci:package`
- [x] `git diff --check`

`npm run ci` and `npm run ci:remote-parity` intentionally remain for the clean
commit/remote verification stage because `ci:generated` and `ci:docs` fail by
design while this patch set is uncommitted and generated projections are dirty.
