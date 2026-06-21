## Why

The browser harness currently treats fixtures as editable documents, but users
need a clearer contract: fixtures are starting templates, while their own work
can be saved, restored after refresh, or reverted back to the template.

The YAML editor should also match the documentation ergonomics by exposing a
small copy button in the editor surface.

## What Changes

- Treat browser fixtures as templates.
- Add browser-harness controls to create a custom topology, save current YAML,
  and revert a template-derived topology.
- Persist topology and stylesheet YAML per template/custom topology in browser
  local storage.
- Restore the last active template or saved topology after browser refresh.
- Add a transparent top-right copy button for the active Monaco YAML editor.

## Impact

- Browser harness host adapter gains local workspace persistence behavior.
- VS Code webview host remains unaffected.
- Playwright coverage verifies custom topology creation, save/reload, template
  revert, and YAML copy feedback.
