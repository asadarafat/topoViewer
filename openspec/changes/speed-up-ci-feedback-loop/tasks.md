# Execution Rule

Implement this change sequentially. Do not start a later phase until the prior
phase is complete, validated, and recorded in the task list. The only exception
is read-only investigation that gathers evidence for the current phase.

# 1. Baseline And Evidence

- [x] 1.1 Collect the last 20 `CI` runs on `development` with run ID, commit, result, total duration, and failed step when applicable
- [x] 1.2 Collect the last 20 `Docs` runs on `development` with run ID, commit, result, total duration, and failed step when applicable
- [x] 1.3 Collect current `Security` and `CodeQL` duration baselines
- [x] 1.4 Record step-level timing for the latest successful `CI` run
- [x] 1.5 Identify p50, p90, and worst-case duration for `CI` and `Docs`
- [x] 1.6 Record baseline runner setup cost: checkout, Node setup, Go setup, Python setup, `npm ci`, and Playwright install
- [x] 1.7 Record baseline repeated-work cost for package checks, docs checks, and public-readiness checks
- [x] 1.8 Record the baseline in `investigation.md`
- [x] 1.9 Stop and review the baseline before implementation; no optimization may be implemented before this evidence exists

# 2. Timing Instrumentation First

- [x] 2.1 Add elapsed-time reporting for every `scripts/ci.mjs` lane
- [x] 2.2 Add elapsed-time reporting for every sub-step inside a lane
- [x] 2.3 Write a GitHub Actions step summary table when `GITHUB_STEP_SUMMARY` is available
- [x] 2.4 Ensure failed steps still emit the timing summary before exiting
- [x] 2.5 Run a focused local lane and capture sample timing output in `investigation.md`
- [x] 2.6 Record a local before/after timing sample proving instrumentation overhead is negligible for a small lane
- [x] 2.7 Run `git diff --check`
- [x] 2.8 Commit the timing instrumentation as its own conventional commit before any dedupe or workflow-shape change

# 3. Duplicate Work Audit

- [x] 3.1 Compare `ci:package` and `ci:public-readiness` command-by-command
- [x] 3.2 Identify package checks repeated in public-readiness
- [x] 3.3 Compare `CI` docs coverage and `Docs` deployment coverage
- [x] 3.4 Identify checks that must remain before Pages deploy
- [x] 3.5 Compare `CI`, `Security`, and `ci:public-readiness` command-by-command
- [x] 3.6 Identify duplicated dependency advisory, Go vulnerability, package, and readiness checks in `Security`
- [x] 3.7 Identify checks that can move to release, scheduled, manual, or publish workflows
- [x] 3.8 Document every proposed removal or relocation with exact replacement coverage: workflow file, trigger, required/optional status, and release/deploy gate relationship
- [x] 3.9 Stop and choose exactly one first duplicate-work reduction candidate; do not change workflow parallelism in this phase

# 4. Duplicate Work Reduction

- [x] 4.1 Implement the single selected duplicate-work reduction candidate
- [x] 4.2 Preserve local `npm run ci` as the full local gate
- [x] 4.3 Update public-readiness checks if a command contract changes
- [x] 4.4 Update `.github/workflows/docs.yml` only if docs duplication is intentionally changed
- [x] 4.5 Update contributor or maintainer docs if the workflow contract changes
- [x] 4.6 Run the affected targeted CI lanes locally
- [x] 4.7 Record local before/after timing for the affected lane or workflow command
- [x] 4.8 Record which coverage remains unchanged and where it runs
- [x] 4.9 Run `git diff --check`
- [x] 4.10 Commit duplicate-work reduction as its own conventional commit before workflow parallelization is considered

# 5. Workflow Shape Decision

- [ ] 5.1 Re-read the baseline and post-dedupe local timings
- [ ] 5.2 Evaluate whether `CI` should stay single-job, become split jobs, or use a hybrid model
- [ ] 5.3 If keeping single-job, document why in `investigation.md` and skip phase 6
- [ ] 5.4 If splitting jobs, define job dependencies so public-readiness runs only after required prerequisite jobs pass
- [ ] 5.5 If splitting jobs, estimate repeated setup cost for Node, Go, Python, npm install, and Playwright browser install
- [ ] 5.6 Stop and document the selected workflow shape before editing `.github/workflows/ci.yml`

# 6. Workflow Shape Implementation

- [ ] 6.1 Update `.github/workflows/ci.yml` according to the selected shape
- [ ] 6.2 Add branch concurrency cancellation for stale non-deployment CI runs only if the design says it is safe
- [ ] 6.3 Do not cancel Pages deployment runs in a way that can publish older artifacts after newer ones
- [ ] 6.4 Keep local `npm run ci` as the full sequential local gate
- [ ] 6.5 Run all affected CI lanes directly
- [ ] 6.6 Record expected remote before/after wall-clock hypothesis before pushing
- [ ] 6.7 Run `git diff --check`
- [ ] 6.8 Commit workflow-shape changes as their own conventional commit

# 7. Final Local Validation

- [ ] 7.1 Run `npm run ci:env`
- [ ] 7.2 Run `npm run ci:generated`
- [ ] 7.3 Run `npm run ci:quality`
- [ ] 7.4 Run `npm run ci:schemas`
- [ ] 7.5 Run all CI lanes directly if lane orchestration changed
- [ ] 7.6 Run full `npm run ci`
- [ ] 7.7 Record final local validation in `investigation.md`

# 8. Remote Validation

- [ ] 8.1 Push to `development`
- [ ] 8.2 Confirm remote `CI` passes
- [ ] 8.3 Confirm remote `Docs` passes
- [ ] 8.4 Confirm remote `Security` and `CodeQL` are not regressed by workflow or command changes
- [ ] 8.5 Collect post-change remote `CI`, `Docs`, `Security`, and `CodeQL` run IDs and durations for the pushed commit
- [ ] 8.6 Compare post-change remote runtime against the baseline p50, p90, worst case, and latest-run values
- [ ] 8.7 Record absolute seconds saved or added, percentage change, and whether the result met the target
- [ ] 8.8 Record coverage tradeoffs: unchanged, moved, narrowed, or removed checks
- [ ] 8.9 If speed regressed or coverage weakened unexpectedly, either fix forward or revert the specific optimization commit
- [ ] 8.10 Archive this change only after remote validation and before/after timing comparison are complete
