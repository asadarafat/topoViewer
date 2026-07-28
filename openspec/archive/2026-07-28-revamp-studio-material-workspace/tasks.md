Tasks are sequential gates. A later phase MUST NOT begin until the preceding
phase has reviewable evidence and all of its tasks are checked.

## 1. Audit And Baseline

- [x] 1.1 Confirm Studio, core renderer, and host preference ownership
- [x] 1.2 Inventory the four-workspace shell, theme provider, Monaco theme,
  viewport preferences, CSS ownership, and current browser evidence
- [x] 1.3 Record passing baseline theme, Material-control, and dependency checks
- [x] 1.4 Validate this OpenSpec change strictly

## 2. Theme Contract Tests

- [x] 2.1 Add failing tests for System, Light, Dark, effective mode, and host
  preference normalization
- [x] 2.2 Add failing browser tests for persistence, operating-system changes,
  startup scheme, and project-source immutability
- [x] 2.3 Add failing tests for light and dark Monaco selection

## 3. Material Theme Foundation

- [x] 3.1 Add native MUI light and dark color schemes without a custom palette
- [x] 3.2 Add host-owned appearance bootstrap, context, menu, persistence, and
  actionable failure reporting
- [x] 3.3 Add matching Monaco light and dark themes
- [x] 3.4 Update theme ownership enforcement and pass focused theme tests

## 4. Contextual Workspace Contract Tests

- [x] 4.1 Add reducer tests for Add, Properties, Canvas Properties,
  multi-selection, Mapper, creation completion, cancellation, and collapse
- [x] 4.2 Update browser journeys to assert contextual transitions before shell
  implementation
- [x] 4.3 Add accessibility expectations for rail labels, selected state,
  announcements, and focus preservation

## 5. Contextual Workspace Implementation

- [x] 5.1 Replace Objects, Edit, Viewport, and Mapper with Add, Properties, and
  Mapper
- [x] 5.2 Move viewport controls into empty-canvas Properties
- [x] 5.3 Preserve Properties Visual/Code and Mapper Visual/Code ownership
- [x] 5.4 Simplify header status and actions using MUI components
- [x] 5.5 Consolidate canvas controls and selection-only actions
- [x] 5.6 Remove obsolete workspace code and pass focused workflow tests

## 6. Viewport Preference Tests And Migration

- [x] 6.1 Add failing unit tests for legacy default, legacy custom, invalid,
  theme reset, and round-trip preference cases
- [x] 6.2 Add failing browser tests for follow-theme and preserve-custom
  behavior in light and dark modes
- [x] 6.3 Implement versioned theme/custom viewport color preferences
- [x] 6.4 Pass browser, memory, and VS Code host preference tests

## 7. Visual And Accessibility Evidence

- [x] 7.1 Capture normal light and dark Add, Properties, Canvas Properties,
  Mapper, dialog, toolbar, Monaco, desktop, and narrow screenshots
- [x] 7.2 Verify keyboard navigation, screen-reader names, contrast, 200 percent
  zoom, forced colors, and reduced motion
- [x] 7.3 Verify no overlap, blank canvas, stale panel, or unintended focus
  movement across representative authoring permutations

## 8. Architecture And Documentation

- [x] 8.1 Update Studio architecture, accessibility, parity, and support text
- [x] 8.2 Update canonical user documentation for contextual navigation and
  appearance behavior
- [x] 8.3 Refresh generated docs and the dark README hero through the release
  screenshot pipeline
- [x] 8.4 Update CSS, bundle, and theme ownership baselines only with measured
  rationale

## 9. Production Validation

- [x] 9.1 Run Studio typecheck, unit, boundary, Material, theme, and build gates
- [x] 9.2 Run Studio browser, accessibility, production, parity, and VS Code
  host suites
- [x] 9.3 Run dense graph, startup, interaction, memory, and bundle budgets
- [x] 9.4 Run full local CI and fix every regression
- [x] 9.5 Perform adversarial review against all ten Rams principles
- [x] 9.6 Validate OpenSpec strictly, record remaining risks, and archive only
  after every task is complete
