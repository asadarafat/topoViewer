## ADDED Requirements

### Requirement: CI Has A Measured Speed Budget

TopoViewer SHALL maintain a measured CI feedback baseline and speed budget
before changing workflow coverage for speed.

#### Scenario: Speed Work Starts

- **WHEN** a maintainer optimizes GitHub Actions runtime
- **THEN** the change SHALL record recent workflow and step durations
- **AND** the change SHALL identify the current slowest steps
- **AND** proposed speedups SHALL name the safety coverage they preserve.

#### Scenario: Speed Target Is Numeric

- **WHEN** a CI speed optimization is proposed
- **THEN** the target SHALL be expressed as a numeric wall-clock target
- **AND** the initial target SHALL be at least 20% faster than the latest 687
  second baseline or under 540 seconds for normal remote `CI`
- **AND** the target SHALL be evaluated against successful completed runs only,
  with failed and cancelled runs tracked separately.

#### Scenario: Before And After Evidence Is Required

- **WHEN** a CI speed optimization is implemented
- **THEN** the change SHALL record pre-change runtime evidence
- **AND** the change SHALL record post-change runtime evidence from GitHub
  Actions after push
- **AND** the evidence SHALL include absolute duration change and percentage
  change
- **AND** the evidence SHALL state whether coverage was unchanged, moved,
  narrowed, or removed.

#### Scenario: CI Runtime Regresses

- **WHEN** the normal `CI` workflow gets materially slower
- **THEN** maintainers SHALL be able to compare the new step timing against the
  recorded baseline
- **AND** decide whether the slowdown is expected product coverage or accidental
  work duplication.

#### Scenario: Speedup Does Not Materialize

- **WHEN** the post-change remote runtime is slower than baseline or fails to
  meet the documented target
- **THEN** the optimization SHALL be fixed forward, reverted, or explicitly
  documented as a coverage-preserving tradeoff
- **AND** the change SHALL NOT be archived as a speed success without that
  explanation.

### Requirement: Timing Is Visible In CI Lanes

TopoViewer SHALL emit timing information for CI lanes and sub-steps.

#### Scenario: Local CI Runs

- **WHEN** a contributor runs a CI lane locally
- **THEN** the output SHALL include elapsed time for the lane
- **AND** the output SHOULD include elapsed time for each sub-step.

#### Scenario: GitHub CI Runs

- **WHEN** GitHub Actions runs CI lanes
- **THEN** the workflow summary SHOULD include a timing table
- **AND** failed runs SHOULD retain enough timing information to show where the
  job spent time before failing.

### Requirement: Speedups Preserve Required Coverage

TopoViewer SHALL NOT remove required safety coverage merely to reduce
wall-clock time.

#### Scenario: A Check Is Removed From Push CI

- **WHEN** a check is removed from the normal push `CI` path
- **THEN** the change SHALL identify where the same risk is still covered
- **AND** that replacement coverage SHALL be release-gate, deployment-gate,
  scheduled, manual, or another required workflow appropriate to the risk.

#### Scenario: A Check Is Moved

- **WHEN** a check moves to another workflow or trigger
- **THEN** the change SHALL name the exact workflow file
- **AND** the change SHALL name the trigger that runs the check
- **AND** the change SHALL state whether the result is required, advisory,
  deployment-gating, or release-gating.

#### Scenario: Public Readiness Is Narrowed

- **WHEN** `ci:public-readiness` is narrowed in GitHub Actions
- **THEN** package artifact checks, install checks, docs checks, security
  checks, and hostile-content checks SHALL still run in an appropriate workflow
- **AND** local `npm run ci` SHALL remain a full local gate.

#### Scenario: Security Workflow Duplicates Public Readiness

- **WHEN** the `Security` workflow runs public-readiness or dependency checks
- **THEN** duplicate work with `CI`, `ci:package`, and standalone security
  checks SHALL be explicitly audited
- **AND** any narrowed security work SHALL retain dependency advisory, Go
  vulnerability, secret scanning, image scanning, OSV, and security health
  reporting coverage in an appropriate workflow.

### Requirement: Parallel CI Is Evidence-Based

TopoViewer SHALL split CI jobs only when the measured feedback benefit justifies
the extra setup cost and complexity.

#### Scenario: CI Jobs Are Split

- **WHEN** the single CI job is split into multiple jobs
- **THEN** each job SHALL have a clear ownership boundary
- **AND** required downstream guardrail jobs SHALL depend on prerequisite jobs
- **AND** the implementation SHALL compare before/after remote wall-clock time.

#### Scenario: Split Jobs Increase Cost Without Useful Speedup

- **WHEN** duplicated setup costs erase the expected wall-clock benefit
- **THEN** the workflow SHALL stay single-job or use a smaller hybrid split
- **AND** the investigation SHALL document that decision.
