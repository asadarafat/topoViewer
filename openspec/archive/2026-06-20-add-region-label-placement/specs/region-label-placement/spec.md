## ADDED Requirements

### Requirement: Region label placement

TopoViewer SHALL allow authors to anchor region labels around the region hull.

#### Scenario: Region label uses explicit anchor

- **WHEN** a region style defines `labelPosition: bottomCenter`
- **THEN** the compiled region label SHALL be anchored at the bottom center of
  the region hull
- **AND** the label SHALL remain independent from member-node placement

#### Scenario: Region label uses explicit margin

- **WHEN** a region style defines `labelMargin: 18`
- **THEN** the compiled region label SHALL use an 18 px margin from the selected
  region edge

#### Scenario: Existing diagrams keep their default label placement

- **WHEN** a region has no explicit `labelPosition` or `labelMargin`
- **THEN** the region label SHALL remain top-left positioned with the historical
  renderer offset

### Requirement: Region label validation

TopoViewer SHALL validate region label placement authoring through semantic
lint.

#### Scenario: Invalid region label position is reported

- **WHEN** a region style defines an unsupported `labelPosition`
- **THEN** semantic lint SHALL report `unsupported-region-label-position`

#### Scenario: Invalid region label margin is reported

- **WHEN** a region style defines a negative or non-numeric `labelMargin`
- **THEN** semantic lint SHALL report `invalid-region-label-margin`

### Requirement: Region label collision guidance

TopoViewer SHALL document how authors reserve space for region labels.

#### Scenario: Single-node region avoids label overlap

- **WHEN** a single-node region keeps its label on the top edge
- **THEN** documentation SHALL show `headerPadding` as the way to reserve
  interior top space
- **AND** documentation SHALL show `labelPosition` and `labelMargin` as visual
  placement controls
