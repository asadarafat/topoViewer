# Current-State Audit

## Ownership

`packages/topoviewer` owns the public document contract and already compiles
nodes, regions, shapes, and callouts into React Flow nodes. `NetworkNode`,
`ShapeNode`, `CalloutNode`, and `RegionNode` each mount React Flow resize
controls. `packages/topoviewer-studio` owns the product shell and commits the
resulting geometry through core authoring plans. Browser and VS Code hosts mount
the same `StudioApp`.

## Material UI Baseline

Studio depends on `@mui/material`, `@mui/icons-material`, and Emotion. Material
icons are used throughout the shell, palette, canvas, projects, layers,
Inspector, mapper, and export UI. Only Inspector tabs currently use Material UI
components. The remaining interactive controls are feature-local native
elements styled by `src/app/studio.css`, which is 3,151 lines at this baseline.
Studio does not own one authoritative Material theme.

## Color Baseline

Core style metadata correctly classifies color-valued attributes. The Studio
Inspector adds a native color input only when the current draft matches
`#RRGGBB`. Valid values such as `#RGB`, `rgb()`, `rgba()`, named colors, and CSS
variables therefore lose the visual color control.

## Primitive And Interaction Baseline

- `diagram.shapes` and `diagram.callouts` have position and size contracts.
- Graph nodes and regions support direct geometry updates.
- There is no `diagram.texts` collection or text renderer.
- Resize controls are repeated in four renderer components.
- Active resize uses React Flow geometry, but no shared resize completion or
  reduced-motion feedback contract exists.
- `TopoViewer` exposes click and context-menu callbacks, but not object
  double-click callbacks.
- Visible text changes are committed through the Inspector or YAML workspace.

## Risks

- Replacing native controls can change accessible names, keyboard behavior, or
  test selectors.
- Material components can increase initial JavaScript and CSS.
- Geometry animation during active pointer resize can introduce lag and jitter.
- Generic YAML serialization can erase comments or reorder unsupported fields.
- A text primitive must remain inert and must not introduce an HTML execution
  path.
