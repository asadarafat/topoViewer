## ADDED Requirements

### Requirement: Shared Topology And Stylesheet Composition

TopoViewer SHALL provide one shared topology/stylesheet composition contract
used by the browser harness, VS Code webview, MkDocs embed, and Zensical embed.

#### Scenario: Overlapping top-level keys compose identically

Given a topology YAML document and a stylesheet YAML document both define
overlapping top-level keys
When the documents are rendered in harness, MkDocs, and Zensical
Then each surface SHALL render from the same composed TopoViewer document
And the composition precedence SHALL be documented and covered by unit tests.

### Requirement: Viewer-Only Surface Parity

TopoViewer SHALL provide automated parity checks that compare only the rendered
TopoViewer viewport across harness, MkDocs, and Zensical.

#### Scenario: Same fixture renders same graph structure

Given a canonical fixture such as `graph/basic`
When the fixture is rendered through harness, MkDocs, and Zensical parity mode
Then each surface SHALL produce the same node count, edge count, label count,
and icon count
And each surface SHALL produce the same edge path geometry under the same
viewer size and selected layers.

#### Scenario: Same fixture renders same visual result

Given a canonical fixture with SVG icons, labels, regions, and links
When the fixture is rendered through harness, MkDocs, and Zensical parity mode
Then the viewer-only screenshot crops SHALL remain within the accepted visual
threshold
And full-page documentation chrome SHALL NOT be part of the parity comparison.

### Requirement: Explicit Theme Boundary

TopoViewer SHALL distinguish renderer parity from documentation page styling.

#### Scenario: Product themes differ without changing renderer semantics

Given MkDocs and Zensical wrap TopoViewer in documentation-specific CSS
When a fixture is rendered outside parity mode
Then page chrome and wrapper theme may differ
But graph geometry, edge visibility, label placement, icon fit, and supported
style values SHALL remain semantically equivalent.

### Requirement: Asset Freshness Before Parity

Renderer parity checks SHALL run against freshly built and synced embed assets.

#### Scenario: Stale embed assets are caught before publish

Given `packages/topoviewer` has changed renderer behavior
When CI builds docs
Then CI SHALL build the embed bundle, sync MkDocs and Zensical assets, build the
docs sites, and run renderer parity checks against the built `site/` output
before publish.
