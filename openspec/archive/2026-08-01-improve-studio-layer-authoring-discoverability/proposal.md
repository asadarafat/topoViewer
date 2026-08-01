## Why

Studio already supports layer creation, rename, reorder, visibility, membership,
and safe deletion, but hides those operations inside a Topology Outline row with
no expansion affordance. Authors reasonably conclude that layer authoring is
missing, while current documentation still points to a canvas-toolbar control
that the YAML-first workbench removed.

## What Changes

- Keep layer definitions and membership under the YAML-first Project Source
  navigator rather than adding another drawer or state owner.
- Give the Layers row explicit expand/collapse, add, count, and source-navigation
  affordances with accessible Material UI controls.
- Ask for a meaningful layer name before creating YAML and preview the
  deterministic layer ID that the existing core helper will create.
- Show each layer's object usage count while preserving visibility, reorder,
  membership, rename, and safe replacement-on-delete behavior.
- Correct Studio documentation and specifications that still describe a
  removed canvas-toolbar Layers control.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `studio-yaml-first-workbench`: make layer authoring discoverable in Project
  Source and separate structural expansion from source navigation.
- `studio-direct-manipulation`: relocate the dedicated layer-authoring control
  contract from the removed canvas toolbar to the YAML-first Project Source
  navigator without changing mutation semantics.

## Impact

The change affects the core package's pure layer-usage projection,
`packages/topoviewer-studio` Project Source and layer controls, browser and unit
tests, OpenSpec contracts, and canonical/generated Studio documentation. It
does not change YAML schemas, layer runtime behavior, renderer behavior,
project persistence, host contracts, or dependencies. Browser and Wails hosts
continue to mount the same Studio implementation.
