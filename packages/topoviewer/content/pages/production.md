# Production Hardening

This document defines the production guardrails for TopoViewer as a general diagramming DSL and declarative graph renderer.

## Validation Gates

Run both gates in CI:

```bash
npm run validate:schemas
npm run validate:semantics
npm test
```

JSON Schema catches malformed shape. Semantic lint catches broken meaning:

- Duplicate IDs.
- Missing names on graph objects.
- Links with missing source/target nodes.
- Paths with missing sequence nodes.
- Stitched child paths with missing or invalid parent paths.
- Regions with missing members or parents.
- Unknown layers.
- Unused stylesheet selectors.
- Unsafe image references.
- Renderer limit violations.

## Renderer Limits

Default limits are intentionally conservative:

| Limit | Default |
|---|---:|
| Nodes | 1200 |
| Edges | 2400 |
| Path segments | 1600 |
| Labels | 2000 |
| Callouts | 250 |
| Shapes | 500 |
| Embedded image bytes | 750000 |

Override only when the target environment is known:

```yaml
limits:
  maxNodes: 2000
  maxEdges: 4000
  maxPathSegments: 2400
```

If a use case has thousands of repeated services, model them as aggregate objects with `data.serviceCount`; do not render thousands of individual lanes by default.

## Schema Versioning And Migration

Use `version` on authored documents:

```yaml
version: "0.1"
```

Missing versions are migrated to the current compatible version at runtime. Breaking model changes must add a migration step instead of silently changing semantics.

## Reference Resolution Rules

For Markdown and image references:

- Relative paths are resolved by the host: MkDocs, browser app, or portal.
- `https:` is allowed for remote references.
- `http:` should only be used in trusted lab environments.
- Data images are allowed for PNG, JPEG, GIF, and WebP.
- SVG data URLs are blocked in Markdown image references.
- Inline icon SVG is sanitized before being converted to a data image.

MkDocs embeds resolve `topology` and `stylesheet` relative to the Markdown page.

## Security Baseline

TopoViewer treats authored diagrams as content, not code:

- Markdown rendering escapes raw HTML.
- Markdown links are URL-filtered.
- Markdown image URLs are URL-filtered.
- Inline SVG icons strip `script`, `foreignObject`, event-handler attributes, and JavaScript hrefs.
- Public documentation should not enable untrusted third-party YAML without server-side review.

## Accessibility Baseline

TopoViewer provides:

- A top-level `role="img"` with diagram label.
- Node `role="group"` labels from object names.
- Callout `role="note"`.
- Theme-aware CSS variables for light/dark mode.

Authoring guidance:

- Do not rely on color alone. Use labels, line style, shape, or icons.
- Keep sufficient contrast in both light and dark themes.
- Use `name` on graph objects for readable labels, tooltips, and export.

## Static Export

The package exports:

- `topoviewerToSvg`
- `topoviewerToPng`
- `topoviewerToPdf`
- `downloadTopoViewerSvg`
- `downloadTopoViewerPng`
- `downloadTopoViewerPdf`

For deterministic exports:

- Use explicit `layout.mode: manual`, or fixed force-layout parameters.
- Set deterministic viewport size in the host.
- Avoid remote images unless the host can load them consistently.
- Prefer packaged fonts or system-safe fonts.

## Visual Regression

DOM tests are not enough for diagrams. Use Playwright screenshots for baseline views and interaction-critical views. Update snapshots only after reviewing the visual change.
