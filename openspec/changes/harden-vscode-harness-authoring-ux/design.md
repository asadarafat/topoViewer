# Design

## Product Model

The harness should feel like a topology authoring tool with a live preview, not
like a YAML parser attached to a canvas.

The target editing model borrows from SR Linux CLI interaction patterns:

- `?` asks "what is valid here?";
- completion is contextual and safe;
- edits happen in a candidate/draft;
- applying the candidate updates the active view;
- diagnostics explain what must be fixed before apply.

This does not mean building a network CLI. It means applying the same principles
to YAML authoring.

## Export Contract

### Browser Harness

The browser harness should implement export in the webview, not in the host
adapter mock.

Recommended flow:

1. Add a `previewRef` to the rendered preview panel.
2. On export, find the `.topoviewer` or `.react-flow` export target.
3. Call `downloadTopoViewerPng(target, { fileName, backgroundColor })`.
4. Report durable status such as `Exported layered-network-authoring.png`.
5. Add optional export menu items later for SVG and PDF.

The package already exports `downloadTopoViewerPng`,
`downloadTopoViewerSvg`, and `downloadTopoViewerPdf` from `topoviewer`.

### VS Code Webview

VS Code cannot rely on a browser download. The webview should generate the
artifact data and send a typed message to the extension host.

Recommended message shape:

```ts
type ExportViewportMessage = {
  type: 'exportViewport';
  format: 'png' | 'svg';
  fileName: string;
  dataUrl: string;
};
```

The extension host should:

1. decode the data URL;
2. open a save dialog with the suggested file name;
3. write the file using `vscode.workspace.fs.writeFile`;
4. show a success message with an `Open` action.

Keep PDF as optional follow-up because PNG/SVG provide enough initial value and
are easier to test.

## YAML Context Engine

The current `webviewYamlAuthoring.ts` should be split into two layers:

- `yamlContext.ts`: parse and classify cursor context;
- `webviewYamlAuthoring.ts`: convert context into Monaco suggestions, hover,
  help, and snippets.

The context engine should return a structured object:

```ts
interface YamlCursorContext {
  document: 'topology' | 'stylesheet';
  path: string[];
  parentKind: 'mapping' | 'sequence' | 'scalar' | 'unknown';
  editing: 'key' | 'value' | 'sequenceItem' | 'comment' | 'invalidIndent';
  key?: string;
  selectorKind?: 'node' | 'link' | 'path' | 'region' | 'callout' | 'shape';
  indent: number;
  expectedIndent?: number;
}
```

Implementation options:

- Prefer adding the `yaml` package for CST/AST parsing with ranges and errors.
- Continue using `js-yaml` for runtime validation if migration is risky.
- Use TopoViewer JSON schemas for legal keys and core value types.
- Use `webviewStyleMetadata.ts` for style key groups, enum values, and typed
  style values.

The context engine must survive invalid YAML. A user needs help most when the
document is incomplete or misindented.

## Suggestion Sources

Suggestions should be composed in priority order:

1. syntax/indent correction suggestions;
2. schema keys valid at the current path;
3. typed values valid for the current key;
4. document references from the applied topology, such as node IDs and layer IDs;
5. snippets valid at the current path.

This avoids generic snippets appearing inside scalar values and nested maps.

## Keyboard Contract

Monaco provider changes:

- Remove `' '` from `triggerCharacters`.
- Keep `':'`, `'-'`, quote characters, and possibly `'.'` for selector paths
  only if they do not create noise.
- Register an explicit command for YAML assist:
  - button click;
  - Ctrl/Cmd+Space;
  - `?` only when `YamlCursorContext.editing` is `key`, `sequenceItem`, or
    `invalidIndent`.

`?` behavior:

- If cursor is in a comment, quoted string, plain scalar value, or callout body,
  allow default insertion.
- If cursor is at a structural location, prevent default and open contextual
  help/completion.

Tab behavior:

- If completion widget is visible, accept selected completion.
- Otherwise use Monaco indentation behavior.

## Candidate Apply Model

State should separate draft and applied documents.

Current state:

```ts
interface WebviewState {
  topologyText: string;
  stylesheetText: string;
}
```

Recommended internal UI state:

```ts
interface HarnessDraftState {
  appliedTopologyText: string;
  appliedStylesheetText: string;
  draftTopologyText: string;
  draftStylesheetText: string;
  dirtyTopology: boolean;
  dirtyStylesheet: boolean;
}
```

Host persistence can continue storing the applied state. The browser harness may
also store draft state under a separate key so a refresh does not lose edits.

Apply flow:

1. Validate draft topology + stylesheet.
2. If valid, update applied state, preview document, host persistence, and undo
   stack.
3. If invalid, keep preview on last valid applied state and show draft
   diagnostics.

Structured UI mutations from Build, Inspect, Attention, and Layers can continue
to update the applied YAML directly, but they should first check whether a YAML
draft is dirty:

- either require applying/reverting the draft before structured mutation;
- or apply the structured mutation to the draft and keep it dirty.

The first option is simpler and safer.

## Diagnostics

Keep the status strip, but add an actionable diagnostics list. It can live below
the strip as a collapsible area or as a lightweight `Diagnostics` mode if the
rail needs more room.

Each diagnostic row should include:

- severity icon;
- document name;
- line number;
- code;
- short message.

Clicking a row should:

1. switch to YAML mode;
2. select the topology or stylesheet tab;
3. focus Monaco;
4. reveal the target line;
5. keep the diagnostic decoration visible.

## Test Strategy

Browser harness Playwright tests should assert user outcomes:

- export produces a non-empty download in browser harness;
- VS Code host export message contains format, file name, and data URL;
- `Suggestions`/YAML assist returns valid choices for labels, position list,
  selector, style key, style value, path sequence, and invalid indentation;
- Space inserts a space and does not trigger completion by itself;
- `?` inserts literally inside comments and strings;
- `?` opens contextual help at structural YAML locations;
- invalid draft does not change the canvas;
- valid Apply changes the canvas and persists across refresh;
- clicking a diagnostic reveals the line.

Existing tests that currently accept the mock export event should be replaced.

## Risks

- A full language server integration may be too heavy for this package. Start
  with a small context engine and schema/style metadata.
- Candidate/apply changes affect many existing tests because current tests read
  `__topoviewerHarnessState` immediately after editor edits.
- Export from SVG-heavy diagrams may expose cross-origin or serialization gaps.
  Use local/data SVG fixtures in regression tests.

