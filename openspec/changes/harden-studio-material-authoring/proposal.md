# Harden Studio Material Authoring

## Why

TopoViewer Studio has the correct canvas-first product direction, but its UI is
not yet one coherent production application. It mixes Material icons and one
Material tab family with handwritten buttons, inputs, selects, menus, dialogs,
and more than three thousand lines of page-level CSS. That inconsistency makes
control behavior, focus, density, theming, and responsive behavior harder to
maintain and visually uneven.

The authoring model also has product gaps. Color metadata exists, but the
Inspector only exposes a picker when the current value is a six-digit hex
color. Nodes, shapes, and callouts can be resized, but resize feedback is not a
formal shared interaction. TopoViewer has no independent text-box primitive,
and changing visible text still requires the Inspector or YAML instead of a
direct canvas gesture.

## Product Promise

Studio SHALL provide one coherent Material UI authoring application while the
public renderer remains host and design-system neutral.

An author SHALL be able to:

- edit every color-valued style through a visible color control and a textual
  CSS-value field;
- drag a text object from the palette and use it as a resizable standalone
  diagram primitive;
- resize nodes, shapes, callouts, and text boxes with immediate geometry and a
  short, reduced-motion-safe completion cue;
- double-click visible object text or labels and edit them next to the object;
- undo every edit as one deterministic source-preserving command.

## What Changes

- Add a Studio-owned Material UI theme and reusable control layer, then migrate
  Studio application controls away from feature-local native implementations.
- Add `diagram.texts` as an additive TopoViewer model, schema, compiler,
  renderer, authoring, and documentation contract.
- Add host-neutral object double-click events and shared resize feedback at the
  renderer boundary.
- Add a schema-driven color editor that remains available for hex, RGB(A), CSS
  variables, and other accepted textual color values.
- Add direct text editing in Studio through a Material UI anchored editor.
- Add visual, accessibility, reduced-motion, source-preservation, performance,
  bundle, browser, and VS Code parity gates.

## Ownership

- `packages/topoviewer` owns `diagram.texts`, validation, compilation,
  rendering, resize feedback, object double-click events, and pure authoring
  operations.
- `packages/topoviewer-studio` owns the Material UI theme, application controls,
  palette entry, color field, anchored quick editor, and command integration.
- `packages/vscode-topoviewer` owns only the VS Code host and receives the same
  Studio application without a forked UI implementation.
- MkDocs, Zensical, React, Grafana, and static embeds consume the renderer and
  therefore render text objects without depending on Studio or Material UI.

## Compatibility

`diagram.texts` and the double-click callback are additive. Existing YAML,
render output, host callbacks, and authoring behavior SHALL remain compatible.
Material UI SHALL remain an application dependency of Studio and SHALL NOT
become a peer dependency or public API requirement of the `topoviewer` package.

## Non-Goals

- replacing React Flow, Monaco, or the TopoViewer renderer with Material UI;
- making Material styling part of exported diagrams;
- rich-text document editing, collaborative cursors, or presentation slide
  management;
- animating width and height behind the pointer during active resize;
- changing the Studio adoption cohort or release-cutover requirements in task
  19.2 of `build-topoviewer-studio`.

## Impact

- Core package: additive types, schema, validation, compiler, node type,
  authoring helpers, events, tests, examples, and docs.
- Studio package: theme, reusable UI controls, migrated feature controls,
  palette, Inspector color controls, quick editor, tests, and bundle baseline.
- VS Code package: parity verification only unless host mounting needs a scoped
  theme adjustment.
- Public integrations: renderer parity tests for the new text primitive.
