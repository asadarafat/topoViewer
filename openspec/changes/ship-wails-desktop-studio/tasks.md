## 1. Audit And Baseline

- [x] 1.1 Audit Studio, Browser, VS Code, host-contract, persistence, security,
  build, documentation, and CI ownership; record the target boundary in
  `design.md`
- [x] 1.2 Verify the current stable Wails v2 module and platform runtime
  assumptions from authoritative sources and the Go module proxy
- [x] 1.3 Run the current Studio unit, host-conformance, browser golden journey,
  VS Code adapter, build, and bundle-budget baselines before moving ownership
- [x] 1.4 Create and strictly validate the proposal, specifications, design, and
  sequential task contract

## 2. Test-First Directory Host Contract

- [x] 2.1 Add directory-project host tests under `topoviewer-studio` before
  moving implementation and confirm failure because the shared owner is absent
- [x] 2.2 Add tests for canonical paths, symlinks, size limits, source
  projection, revisions, coordinated writes, recovery, conflicts, self-write
  suppression, external changes, cancellation, and typed failures
- [x] 2.3 Add a temporary VS Code consumer contract that imports the future
  Studio-owned directory host and confirm failure before extraction

## 3. Shared Directory Host Implementation

- [x] 3.1 Move host-neutral workspace-project behavior and its port contract
  into `topoviewer-studio` with directory-oriented names and exports
- [x] 3.2 Update Studio host kinds, project labels, lifecycle capabilities, and
  host-conformance fixtures for Browser and Desktop without host-specific UI
  policy
- [x] 3.3 Migrate the temporary VS Code adapter to the shared directory host and
  pass its existing focused tests before retirement
- [x] 3.4 Run Studio typecheck, unit, architecture, security, and temporary
  VS Code parity checks

## 4. Test-First Desktop Native Boundary

- [x] 4.1 Add Go tests for opaque project tokens, path confinement, symlink
  rejection, bounded enumeration, typed errors, revision conflicts,
  transactional writes, rollback, recovery, preferences, and watcher
  suppression; confirm the expected missing implementation failures
- [x] 4.2 Add TypeScript desktop-port and `DesktopStudioHost` tests against a
  fake generated-binding boundary; confirm the expected missing adapter
  failures
- [x] 4.3 Add a desktop golden-journey host fixture and confirm it fails before
  the Wails frontend entry exists

## 5. Wails Desktop Implementation

- [x] 5.1 Add `apps/topoviewer-studio-desktop` with a pinned Wails v2 Go module,
  application metadata, embedded frontend, and private npm frontend workspace
- [x] 5.2 Implement the Go native project service, approved-root registry,
  bounded filesystem DTOs, coordinated save and rollback, native dialogs,
  preferences, recovery, clipboard, export, reporting, and file-change events
- [x] 5.3 Generate pinned Wails TypeScript bindings and add a deterministic
  binding-drift check
- [x] 5.4 Implement the runtime-validating Wails directory port,
  `DesktopStudioHost`, untitled/recent project startup, and one-call native
  first-save transaction; prove cancellation, non-empty destinations, write
  failure, recovery migration, retry, and recent-project promotion behavior
- [x] 5.5 Mount the public Studio application from the thin desktop frontend
  without source aliases, copied feature components, or pointer-time native
  calls
- [x] 5.6 Pass focused Go, frontend unit, host-conformance, golden journey,
  Monaco, mapper, save, reload, recovery, conflict, and export tests

## 6. Desktop Build And Distribution

- [x] 6.1 Add root desktop development, test, binding, build, and package
  commands with explicit Node, Go, Wails, and native dependency checks
- [x] 6.2 Add desktop frontend and native artifact budgets plus package
  inspection for embedded assets, versions, metadata, and forbidden source
  files
- [x] 6.3 Add Linux Wails compile and startup smoke coverage for pull requests
- [x] 6.4 Add macOS universal, Windows amd64, and Linux amd64 release jobs with
  checksums and platform/architecture metadata
- [x] 6.5 Add protected macOS signing/notarization and Windows signing hooks,
  keeping unsigned artifacts explicitly internal
- [x] 6.6 Document Windows WebView2, Linux GTK/WebKitGTK ABI, macOS signing,
  supported architectures, installation, troubleshooting, and rollback

## 7. VS Code Retirement And Documentation

- [x] 7.1 Remove `packages/vscode-topoviewer` only after Desktop Studio passes
  the shared parity gate
- [x] 7.2 Remove VS Code npm workspace, scripts, dependencies, bundle budgets,
  CI paths, issue-template choices, generated artifacts, and live checks
- [x] 7.3 Update authoritative Studio architecture, OpenSpec configuration and
  specifications, README status, canonical docs, contributor guidance, and
  release guidance for Browser and Desktop ownership
- [x] 7.4 Synchronize generated documentation and verify that no live VS Code or
  VSIX product claim remains outside archived historical material

## 8. Validation And Closeout

- [x] 8.1 Run focused TypeScript, Go, host-conformance, security, package, and
  desktop integration checks
- [x] 8.2 Run `npm ci`, the full local `npm run ci` gate, Studio production
  browser tests, and Linux Wails build on a clean committed tree
- [x] 8.3 Perform adversarial ownership, duplication, path-security,
  partial-write, watcher, generated-binding, dependency, bundle, and
  documentation review
- [x] 8.4 Add a failing cross-host direct-move regression, publish the
  source-backed position through the existing incremental renderer path, and
  verify canvas, YAML, recovery, save, and reload consistency
- [ ] 8.5 Push the reviewed commit and require green remote CI plus macOS,
  Windows, and Linux desktop artifact jobs
- [ ] 8.6 Strictly validate and archive the OpenSpec change only after all tasks
  and platform evidence are complete
