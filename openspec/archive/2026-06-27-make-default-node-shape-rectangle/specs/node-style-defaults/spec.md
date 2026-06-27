# Capability: Node Style Defaults

## Requirement: Default Node Shape Is Rectangle

TopoViewer shall render graph nodes with `shape: rectangle` when no node shape
is authored by inline style or stylesheet.

### Scenario: Omitted node shape uses rectangular body

Given a graph node has no inline `style.shape`
And no matching stylesheet rule sets `shape`
And the effective node dimensions are `width: 96` and `height: 56`
When TopoViewer compiles the node
Then the effective node shape is `rectangle`
And the visible body uses width `96`
And the visible body uses height `56`
And the edge anchor uses the same width and height as the visible body.

## Requirement: Aspect-Locked Shapes Are Explicit

TopoViewer shall preserve square/circle semantics only when the author
explicitly chooses `shape: square` or `shape: circle`.

### Scenario: Explicit square rejects unequal dimensions

Given a graph node has effective style `shape: square`
And the authored dimensions are `width: 96` and `height: 56`
When TopoViewer compiles the node
Then semantic validation reports an error
And the error explains that `shape: square` requires equal dimensions
And the error recommends equal dimensions or `shape: rectangle` for a stretched
body.

### Scenario: Explicit circle rejects unequal dimensions

Given a graph node has effective style `shape: circle`
And the authored dimensions are `width: 96` and `height: 56`
When TopoViewer compiles the node
Then semantic validation reports an error
And the error explains that `shape: circle` requires equal dimensions
And the error recommends equal dimensions or `shape: ellipse` for a stretched
oval body.

### Scenario: Explicit square derives missing height

Given a graph node has effective style `shape: square`
And the authored dimensions include `width: 96`
And the authored dimensions omit `height`
When TopoViewer compiles the node
Then the visible body is square
And the visible body uses width `96`
And the visible body uses height `96`
And the edge anchor matches the visible square body.

### Scenario: Explicit circle derives missing width

Given a graph node has effective style `shape: circle`
And the authored dimensions include `height: 64`
And the authored dimensions omit `width`
When TopoViewer compiles the node
Then the visible body is circular
And the visible body uses width `64`
And the visible body uses height `64`
And the edge anchor matches the visible circle body.

## Requirement: Stretched Bodies Use Rectangle Or Ellipse

TopoViewer documentation and YAML assist shall guide users toward `rectangle`
for stretched rectangular bodies and `ellipse` for stretched oval bodies.

### Scenario: Author wants stretched node body

Given a user is editing a node style with unequal width and height
When YAML assist suggests node shape values
Then `rectangle` is presented as the default stretched-body shape
And `ellipse` is described as the stretched oval shape
And `square` and `circle` are described as equal-aspect shapes that reject two
unequal dimensions.

## Requirement: Surfaces Agree On Defaults

Runtime, docs, schema metadata, YAML assist, MkDocs, Zensical, and the browser
harness shall describe the same default node shape.

### Scenario: Public docs and harness metadata agree

Given the canonical style defaults registry declares default node `shape`
When docs and harness metadata are generated
Then the stylesheet reference says node shape defaults to `rectangle`
And YAML assist says node shape defaults to `rectangle`
And no generated public page describes `square` as the default node shape.
