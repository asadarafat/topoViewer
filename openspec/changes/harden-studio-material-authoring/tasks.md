# Tasks

Tasks are ordered gates. Do not begin a later phase until the previous phase is
checked with reviewable output or a passing command.

## 1. Audit And Baseline

- [x] 1.1 Map core, Studio, browser-host, and VS Code-host ownership boundaries
- [x] 1.2 Inventory native Studio controls, current Material imports, color-field behavior, resize implementations, and double-click support
- [x] 1.3 Record current Studio CSS and compressed bundle baselines
- [x] 1.4 Validate this change strictly before contract implementation

## 2. Contract Tests

- [x] 2.1 Add failing type, schema, validation, compiler, security, layer, and authoring tests for `diagram.texts`
- [x] 2.2 Add failing renderer event tests for object double-click identity and coordinates
- [x] 2.3 Add failing resize-feedback tests for supported kinds and reduced motion
- [x] 2.4 Add failing Studio tests for Material control ownership, complete color controls, text creation, resize, quick edit, undo, and source preservation

## 3. Core Text Primitive

- [x] 3.1 Add `DiagramText`, `diagram.texts`, limits, migration, incremental compilation, and public types
- [x] 3.2 Add JSON Schema and Zod validation with inert-text security constraints
- [x] 3.3 Add canonical text defaults and spec-driven authoring metadata
- [x] 3.4 Add deterministic text compilation, `TextNode`, layer behavior, accessibility, and renderer registration
- [x] 3.5 Add pure create/find/copy/paste/move/resize/delete/layer authoring operations
- [x] 3.6 Run core unit, schema, semantic, API, package, and security gates before Studio consumption

## 4. Shared Direct-Manipulation Runtime

- [x] 4.1 Add the public host-neutral object double-click event contract for nodes, edges, and link directions
- [x] 4.2 Consolidate node, region, shape, callout, and text resize handles behind one renderer-owned component
- [x] 4.3 Keep active geometry transition-free and add only a reduced-motion-safe completion cue
- [x] 4.4 Verify pointer resize, keyboard resize, selection identity, and dense interaction performance before UI integration

## 5. Material UI Foundation

- [x] 5.1 Add `StudioThemeProvider` with compact density, semantic colors, typography, focus, shape, light/dark, forced-colors, and reduced-motion behavior
- [x] 5.2 Add Studio-owned Material wrappers for buttons, icon buttons, fields, selects, switches, tabs, menus, popovers, dialogs, accordions, tooltips, segmented controls, and progress/status feedback
- [x] 5.3 Enforce supported second-level Material imports and prohibit raw interactive controls outside `src/ui` and documented browser-input exceptions
- [x] 5.4 Capture theme/control visual and accessibility evidence before feature migration

## 6. Migrate Studio Surfaces

- [x] 6.1 Migrate application shell, project lifecycle, loading, error, footer, and presentation controls
- [x] 6.2 Migrate object palette, canvas toolbar, settings, layers, context actions, and export UI
- [x] 6.3 Migrate Inspector, field actions, provenance, Basic/All controls, and profile customization
- [x] 6.4 Migrate mapper workspace, generated mapper fields, sample workspace, and style editor
- [x] 6.5 Migrate YAML workspace, diagnostics, normalization confirmation, external-change handling, and destructive dialogs
- [x] 6.6 Remove superseded control CSS and prove browser/VS Code parity before adding new authoring UX

## 7. Color Authoring

- [x] 7.1 Implement one schema-driven `StudioColorField` with visual well, exact text input, validation, accessible naming, and deterministic normalization
- [x] 7.2 Use the color field for every canonical style and mapper style field whose metadata type is `color`
- [x] 7.3 Test hex, shorthand hex, RGB(A), named colors, CSS variables, invalid values, defaults, unset, undo, and source preservation

## 8. Text And Direct Editing In Studio

- [x] 8.1 Add a Text palette item with click and drag-to-create behavior on the annotations layer
- [x] 8.2 Expose text object fields and styles through Basic/All Inspector views and YAML assist
- [x] 8.3 Add a Material anchored quick editor driven by the core double-click event
- [x] 8.4 Support canonical quick-edit fields for node, region, shape, link, path, callout, text, and link direction
- [x] 8.5 Verify commit, cancel, multiline, focus return, undo/redo, autosave, import/export, and browser/VS Code parity

## 9. Documentation And Consumers

- [x] 9.1 Add canonical text primitive concept, task, object-reference, style-reference, and complete attribute examples
- [x] 9.2 Add Studio guides for Material controls, color editing, resizing, resize feedback, and double-click editing
- [x] 9.3 Synchronize generated docs and examples; verify MkDocs, Zensical, React/embed, and Grafana rendering parity
- [x] 9.4 Update architecture, accessibility, performance, security, parity, and compatibility documentation

## 10. Production Validation

- [x] 10.1 Run lint, typecheck, unit, schema, semantic, API, package, hostile-content, and source-preservation gates
- [x] 10.2 Run Studio browser, accessibility, visual, parity, VS Code-host, and 1,000-node interaction suites
- [x] 10.3 Measure before/after initial CSS, initial JS, lazy chunks, startup, Inspector, resize, and memory behavior; update baselines only with an explicit reviewed rationale
- [x] 10.4 Review desktop, narrow, light, dark, forced-colors, reduced-motion, loading, empty, error, destructive, menu, dialog, popover, and dense Inspector screenshots
- [x] 10.5 Run full local CI on a clean committed tree; push and monitor remote CI only with explicit user approval
- [x] 10.6 Record the archive dependency on `build-topoviewer-studio`; keep this
  implementation-complete change active until that change establishes the
  baseline `studio-*` specs
