## Why

TopoViewer Studio has the right authoring capabilities, but its current
four-workspace shell exposes implementation categories instead of the user's
immediate intent. Objects, Edit, Viewport, and Mapper compete with the canvas,
the application only has a real dark theme, and viewport colors are persisted
as fixed dark values.

The product should become quieter and easier to understand without creating a
second authoring model. Dieter Rams' principles provide the evaluation lens:
make the product useful, understandable, unobtrusive, honest, durable,
thorough, and no more designed than necessary.

## What Changes

- replace Objects, Edit, Viewport, and Mapper with Add, Properties, and Mapper;
- make Properties contextual to a selected object, a multi-selection, or the
  empty canvas;
- retain Visual and Code as representations inside Properties and Mapper;
- add host-owned System, Light, and Dark appearance preferences using one MUI
  color-scheme theme;
- make Monaco and non-Material canvas chrome follow the effective scheme;
- migrate canvas background and grid preferences to theme-owned or
  user-customized colors;
- simplify the header and canvas toolbar while retaining every authoring
  command;
- expand light, dark, narrow, accessibility, and interaction evidence;
- keep topology, stylesheet, mapper, renderer, and export contracts unchanged.

## Capabilities

### Modified Capabilities

- `studio-product-contract`: contextual canvas-first navigation and coherent
  light/dark Material UI.
- `studio-production-readiness`: measurable theme, workflow, visual, and
  accessibility gates.

## Impact

- `packages/topoviewer-studio` application shell, theme, workspace navigation,
  Monaco setup, viewport preferences, tests, and product documentation.
- Browser and VS Code host preference implementations through the existing
  `StudioHost` contract.
- Documentation screenshots and Studio parity claims.
- No public `topoviewer` API or YAML schema changes.

## Non-Goals

- Changing topology, stylesheet, or mapper YAML.
- Adding a destination-specific authoring wizard.
- Adding another design-system, state-management, or theme dependency.
- Maintaining old and new shells in parallel after cutover.
- Changing rendered topology colors when the user has authored them.
- Promoting Studio beyond Beta Preview as part of this change.
