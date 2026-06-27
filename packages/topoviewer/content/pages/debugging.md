# Debug Rendering

Use this checklist when the YAML parses but the viewport does not look right.

## Blank Viewport

- Confirm the `topology` and `stylesheet` paths resolve from the Markdown page.
- Check diagnostics before changing the graph.
- Verify `layout.width` and `layout.height` are positive.
- Confirm the selected layer IDs include objects in the graph.
- Check browser console errors for blocked SVG, image, or asset paths.

## Missing Links

- Verify every link `source` and `target` matches a node ID exactly.
- Ensure the link layer is selected.
- Check whether `display: none`, `opacity: 0`, or hidden attention state applies.
- For custom node dimensions, keep shape and size valid so endpoints can attach
  to the visible body.

## Bad Selectors

- Use labels for reusable style selectors.
- Keep selector values quoted when they contain punctuation.
- Check case: style keys are canonical camelCase.
- Prefer `node[labels.role = "pe"]` over ID-specific rules unless the style is
  truly one-off.

## Icon Or Label Alignment

- Do not let host CSS define node sizing, line-height, padding, or box model for
  TopoViewer internals.
- Theme CSS may set colors through TopoViewer variables.
- If renderer surfaces differ, compare the same topology and stylesheet in the
  browser harness, MkDocs, and Zensical.

## GitHub Pages Paths

Published paths use the lowercase project base:

- `https://asadarafat.github.io/topoviewer/`
- `https://asadarafat.github.io/topoviewer/docs/mkdocs/`
- `https://asadarafat.github.io/topoviewer/docs/zensical/`
- `https://asadarafat.github.io/topoviewer/harness/`

Next: [Validate YAML](validate-yaml.md) for the command-line checks.
