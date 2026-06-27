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

### Requirement: Documentation CSS Does Not Affect Renderer Geometry

TopoViewer SHALL isolate renderer geometry from host documentation CSS while
still allowing documentation pages to provide color-related CSS variables.

#### Scenario: Documentation SVG resets do not change node geometry

Given a documentation host applies broad content rules such as
`svg { max-width: 100%; height: auto; }`
And a TopoViewer node declares unequal `width` and `height`
When the node is rendered in MkDocs or Zensical
Then the node icon container, inner SVG geometry, and visible body shape SHALL
match the harness geometry for the same YAML
And `square` and `circle` SHALL keep their aspect-preserved visible body.

#### Scenario: Documentation image resets do not change icon fit

Given a documentation host applies broad content rules to `img`
And a TopoViewer node uses an image or embedded SVG icon
When the node is rendered in MkDocs or Zensical
Then the icon image SHALL obey the TopoViewer stylesheet `iconWidth`,
`iconHeight`, `iconSize`, `iconFit`, and `iconPadding` values
And host `max-width`, `height`, or aspect-ratio rules SHALL NOT alter the icon
box.

#### Scenario: Documentation button and typography rules do not change graph controls

Given a documentation host applies broad content rules to buttons or text
When TopoViewer viewport controls are rendered
Then control dimensions, icon dimensions, and graph interaction targets SHALL
come from TopoViewer CSS
And the documentation host MAY still change approved color variables.

#### Scenario: Documentation fonts do not change node label metrics

Given MkDocs or Zensical loads, omits, or overrides documentation page fonts
When TopoViewer renders node labels, metadata, edge labels, or badges
Then their font size, line height, letter spacing, and measured geometry SHALL
come from TopoViewer renderer CSS
And the same YAML SHALL produce equivalent label and metadata boxes across
harness, MkDocs, and Zensical.

### Requirement: Asset Freshness Before Parity

Renderer parity checks SHALL run against freshly built and synced embed assets.

#### Scenario: Stale embed assets are caught before publish

Given `packages/topoviewer` has changed renderer behavior
When CI builds docs
Then CI SHALL build the embed bundle, sync MkDocs and Zensical assets, build the
docs sites, and run renderer parity checks against the built `site/` output
before publish.

### Requirement: Automatic Fit Uses React Flow Default Scale As Upper Bound

TopoViewer SHALL use React Flow's default `zoom: 1` as the upper bound for
automatic viewport fitting.

#### Scenario: Small diagrams are not enlarged by automatic fit

Given a small manual-layout topology such as `graph/basic`
When it is rendered in the harness, MkDocs, or Zensical
Then automatic `fitView` SHALL NOT choose a zoom greater than `1`
And fit-to-screen controls SHALL keep the same max zoom cap.

#### Scenario: Large diagrams can still fit down

Given a topology larger than the available viewport
When it is rendered or the user activates fit-to-screen
Then TopoViewer MAY zoom below `1` so the diagram fits
But it SHALL NOT use fit as an automatic magnifier for small diagrams.

### Requirement: Aspect-Sensitive Node Shapes Remain Semantic

TopoViewer SHALL preserve the visual semantics of aspect-sensitive node body
shapes.

#### Scenario: Square and circle preserve one-to-one geometry

Given a node stylesheet declares `shape: square` or `shape: circle`
And `width` and `height` are different
When the node is rendered
Then the visible node body SHALL use the smaller dimension for both body axes
And the body SHALL be centered inside the configured node box.

#### Scenario: Rectangle and ellipse intentionally stretch

Given a node stylesheet declares `shape: rectangle` or `shape: ellipse`
And `width` and `height` are different
When the node is rendered
Then the visible node body SHALL stretch to the configured width and height.

### Requirement: Region Hulls Use Compiled Member Dimensions

TopoViewer SHALL recompute region hulls from compiled node dimensions that
match the rendered node stack.

#### Scenario: Draggable region recomputes around visible member stack

Given a draggable region contains a node with a body, label, and metadata
When the region is dragged and dependent parent or sibling hulls are recomputed
Then the recomputed hull SHALL contain the visible member node stack
And region bounds SHALL still respect explicit `nodeWidth` and `nodeHeight`
overrides when an author provides them.
