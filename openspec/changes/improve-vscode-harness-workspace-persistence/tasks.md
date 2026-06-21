## 1. Browser Workspace Model

- [x] 1.1 Mark bundled browser fixtures as templates
- [x] 1.2 Add browser-local custom topology index
- [x] 1.3 Persist full topology and stylesheet state per fixture/custom topology
- [x] 1.4 Restore last active fixture/custom topology after browser refresh

## 2. Harness Controls

- [x] 2.1 Add `New topology` browser harness control
- [x] 2.2 Add explicit `Save` control
- [x] 2.3 Add `Revert template` control for template-derived edits
- [x] 2.4 Add custom topology removal path

## 3. YAML Copy

- [x] 3.1 Add transparent top-right Monaco YAML copy button
- [x] 3.2 Add clipboard fallback when browser clipboard permission is denied
- [x] 3.3 Show copy feedback in the status strip

## 4. Validation

- [x] 4.1 Run `npm --workspace vscode-topoviewer run build`
- [x] 4.2 Run `npm --workspace vscode-topoviewer run test:vscode-harness`
- [x] 4.3 Run `git diff --check`
