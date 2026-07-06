# Canvas Authoring Baseline Audit

Date: 2026-07-06

## Current Authoring Surface

The Harness is reliable for topology-as-code authoring, but it is still mostly
panel-driven rather than canvas-native.

## Capability Matrix

| Capability | Current State | Gap For Draw.io/PowerPoint-Like Authoring |
| --- | --- | --- |
| New topology | Supported | Starter is clean, but canvas does not guide first object placement. |
| Node creation | Supported through Build buttons | Needs click-to-place at pointer coordinate from a selected tool. |
| Node movement | Supported by drag and Inspector | Needs richer direct manipulation affordances, nudge, align, distribute. |
| Node resize | Mostly stylesheet-driven | Needs explicit decision: only show resize when object-level geometry exists. |
| Link creation | Supported through combobox relationship composer | Needs drag-to-connect with live preview and handle/endpoint awareness. |
| Path creation | Supported through relationship composer | Needs click-to-build node sequence with preview and keyboard commit/cancel. |
| Region creation | Supported from selected nodes | Needs marquee/bounds workflow and clearer group-like behavior. |
| Region movement | Partially supported depending on runtime region behavior | Needs explicit model: translate members, move explicit geometry, or no resize/move handles. |
| Callout creation | Supported from selection | Needs click target + click placement workflow and direct leader/placement editing. |
| Shape authoring | Partially supported for seeded shapes and Inspector edits | Needs canvas drawing, move, resize, duplicate, delete. |
| Multi-select | Supported | Needs marquee selection and group transform from canvas. |
| Clipboard | Not a primary workflow | Needs copy/paste/duplicate with deterministic ID/reference rewriting. |
| Delete | Supported through Inspector | Needs keyboard delete/backspace and context menu delete. |
| Undo/redo | Supported | Needs every canvas-native action to be one durable transaction. |
| Alignment helpers | Supported as helper lines | Needs align/distribute commands and optional grid snap. |
| YAML draft safety | Supported for panel/YAML flows | Needs canvas mutation guard while draft YAML is dirty. |
| Documentation | Documents Harness and YAML authoring | Needs UI-first graph authoring guide and generated-YAML explanation. |
| Regression coverage | Good for current flows | Needs object/action/input CRUD matrix for canvas-native permutations. |

## Minimum Viable Canvas-Native Slice

The first implementation slice should be deliberately narrow:

1. Tool-state architecture and dirty-draft mutation guard.
2. Floating canvas toolbar with select, pan, node presets, and link tools.
3. Click-to-place node/router/service/controller/external at pointer coordinate.
4. Drag-to-connect link between nodes with valid-drop commit and invalid-drop cancel.
5. Keyboard Delete and Escape behavior.
6. Undo/redo and reload persistence for every mutation.
7. Playwright coverage asserting both UI state and YAML output.

Do not start with resize handles, clipboard, alignment commands, or region
marquee authoring. Those are important, but they depend on a stable tool model
and mutation boundary.

## Baseline Evidence

Focused authoring CRUD coverage has been added in
`packages/vscode-topoviewer/tests/harness-authoring.spec.ts`.

Local evidence already captured in command output:

- `npm --workspace vscode-topoviewer run test:vscode-harness -- tests/harness-authoring.spec.ts`
  passed with `4 passed`.
- `npm run test:vscode-harness` passed with `54 passed`.
- `npm --workspace vscode-topoviewer run typecheck` passed.
- `npm run lint` passed.
- `git diff --check` passed.

