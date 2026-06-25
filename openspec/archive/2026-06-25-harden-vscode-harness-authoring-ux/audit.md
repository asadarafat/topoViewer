# Harness Usability Audit

Collected on 2026-06-25 against the local browser harness at
`http://127.0.0.1:5174/`.

Reference behavior reviewed:

- SR Linux CLI `?` help shows usage for the current command/location.
- SR Linux CLI Tab completion completes unambiguous input and shows choices
  when multiple options exist.
- SR Linux candidate mode keeps edits separate from committed running
  configuration until commit/apply.
- Source: https://documentation.nokia.com/srlinux/SR_Linux_HTML_R21-11/SysMgmt_Guide/cli-interface.html

## Confirmed Issues

### Export Is A Mock

Runtime probe:

```text
export: accessibleButtons=1
export: downloaded=false
export: mockEvent=true
```

Code evidence:

- `BrowserHarnessHostAdapter.exportImage()` dispatches
  `topoviewer-export-mock`.
- `VsCodeHostAdapter.exportImage()` posts `exportImage`.
- The VS Code extension handles `exportImage` by showing
  "TopoViewer export is handled inside the preview webview."
- Existing Playwright coverage treats the mock event as successful export
  behavior.

User impact:

- The camera/export icon suggests a real artifact will be produced.
- No file is downloaded in the browser harness.
- No save dialog or artifact is produced in VS Code.
- The current test locks in the wrong behavior.

Intended behavior:

- Export should produce a real viewport artifact.
- Browser harness should download a PNG by default and may expose SVG/PDF as
  secondary options.
- VS Code should save or reveal the artifact through VS Code APIs.

### Suggestions Button Has No Clear Intent

Runtime probe:

```text
suggestion button: visibleSuggestWidgets=1
```

The button does open Monaco suggestions, but it does not define whether it means:

- complete the current key;
- show legal child keys;
- show legal values;
- show examples/snippets;
- explain the current YAML path.

In the captured screenshot, it opened generic root suggestions while the cursor
was on `graph:`. That is technically a completion popup, but it is weak
authoring guidance.

Intended behavior:

- Replace generic "Suggestions" with "YAML Assist" or equivalent.
- Show context help and completions based on cursor path and indentation.
- Explain why each suggestion is valid at that location.

### YAML Intelligence Is Line-Heuristic, Not Context-Aware

Runtime probe:

```text
labels-context suggestions=id, name, labels, data, layers, position, node snippet, link snippet
bad-indent stylesheet suggestions=selector, style, stylesheet rule snippet
position-list suggestions=id, name, labels, data, layers, position, node snippet, link snippet
width value suggestions=0, 1, 2, 4, 8, 12, 16, 24
```

Good:

- Typed values exist for known style keys such as `width`.

Bad:

- Inside `labels`, the engine suggests object-level keys and object snippets.
- Inside a `position` list, it suggests object-level keys and snippets.
- Misindented stylesheet content falls back to top-level stylesheet keys instead
  of diagnosing indentation or offering a correction.
- The engine cannot tell whether the user is editing a mapping key, scalar
  value, list item, or malformed node.

Code evidence:

- `webviewYamlAuthoring.ts` uses regex and line scanning:
  - `yamlPathAtLine`
  - `currentYamlKey`
  - `isKeyContext`
  - `isStylesheetStyleContext`
- Trigger characters include `' '`, `':'`, `'-'`, `'"'`, and `"'"`.

Intended behavior:

- Use a parsed YAML document with ranges, indentation, collection type, and
  parent path.
- Use TopoViewer JSON schemas and style metadata to determine legal keys and
  values.
- Return corrections when indentation makes the location invalid.

### Keyboard Behavior Is Brittle

Code evidence:

- Monaco completion trigger characters include a literal space.
- The editor intercepts `?`, calls `preventDefault`, and always triggers
  suggest.

User impact:

- Space can activate suggestions while the user is simply typing.
- `?` cannot reliably be typed as literal text in comments, labels, data values,
  or callout bodies.
- Suggestion activation is not predictable enough for an authoring tool.

Intended behavior:

- Space always inserts a space.
- Ctrl/Cmd+Space and the YAML assist button trigger completion.
- `?` opens contextual help only when the cursor is at a key/command location;
  inside strings/comments/scalars it inserts a literal question mark.
- Tab accepts a selected completion when the popup is visible and indents
  otherwise.

### YAML Edits Apply Too Early

Current behavior:

- Monaco `onChange` updates `state.topologyText` or `state.stylesheetText`
  immediately.
- Validation and preview composition run from that same state.
- Invalid or half-written YAML can immediately affect diagnostics and render
  gating.

User impact:

- There is no clear candidate state.
- "Apply" is absent in the YAML action row.
- The user cannot freely edit a draft before deciding to update the canvas.

Intended behavior:

- YAML editor owns a draft buffer.
- `Apply` validates the draft, then updates harness state and preview.
- `Revert draft` restores the last applied state.
- Dirty state is visible and persistent across tabs.

### Diagnostics Are Useful But Too Passive

Current behavior:

- The status strip shows either diagnostics or transient messages.
- Monaco markers exist for diagnostics.
- There is no dedicated diagnostics list or click-to-line workflow in the rail.

User impact:

- A user can see "1 diagnostic" but still has to discover the exact fix path.
- Transient messages can replace diagnostic context.

Intended behavior:

- Status strip remains short and durable.
- Diagnostics list shows all issues with document, line, severity, code, and
  message.
- Clicking a diagnostic switches to the right YAML tab and reveals the line.

## Additional Usability Gaps Found

- The preview action row says `Validate`, but it only re-sets current state. It
  should validate the draft or be removed once `Apply` owns validation.
- Save, Revert template, and New topology are local-browser persistence actions,
  not filesystem actions. Labels should make the persistence boundary explicit.
- Undo/Redo covers structured harness transactions but not direct Monaco draft
  edits as one unified authoring history.
- Existing tests prove the current mock export and generic completion behavior
  rather than production user outcomes.
- During the audit, the local Vite harness reported
  `ResizeObserver loop completed with undelivered notifications`. That may be
  browser-layout noise, but production-grade harness tests should either remove
  the resize feedback loop or explicitly classify it as benign console noise.
