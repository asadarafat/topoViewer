## 1. Audit And Contract

- [x] 1.1 Compare `b0dc545` with current Monaco, YAML-assist, workspace, and
  host ownership
- [x] 1.2 Reproduce current topology and stylesheet Code behavior and record
  the discoverability regression
- [x] 1.3 Define the product and spec-driven authoring regression contract
- [x] 1.4 Validate the OpenSpec change strictly

## 2. Test-First Evidence

- [x] 2.1 Add browser coverage for the context-help command in topology,
  stylesheet, and mapper Code
- [x] 2.2 Run the focused browser test before implementation and confirm it
  fails because the command is absent

## 3. Shared Implementation

- [x] 3.1 Add one context-aware help operation to the shared Monaco editor
  handle
- [x] 3.2 Add one shared Material context-help control without importing
  Monaco into parent workspaces
- [x] 3.3 Expose the control from topology, stylesheet, and mapper Code

## 4. Documentation

- [x] 4.1 Update canonical Properties and Mapper documentation with the
  context-help command
- [x] 4.2 Synchronize generated documentation and review projection drift

## 5. Validation And Review

- [x] 5.1 Run focused YAML-assist unit and browser tests
- [x] 5.2 Run Studio typecheck, Material ownership, bundle, and quality gates
- [x] 5.3 Review accessibility, lazy-loading, host parity, and diff ownership
- [ ] 5.4 Run full local CI on a clean committed tree and archive the change
  only after every gate passes
