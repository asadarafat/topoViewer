## ADDED Requirements

### Requirement: Inspect rows fit the authoring rail

The VS Code browser harness SHALL render Labels, Data, and Style rows without
horizontal clipping inside the authoring rail.

#### Scenario: Dense style rows remain readable

- **WHEN** a selected object has several effective style rows
- **THEN** Inspect SHALL show key/value controls without clipping
- **AND** provenance and row actions SHALL remain visible
- **AND** the row SHALL wrap or stack secondary actions when the rail is too
  narrow for a single-line layout

#### Scenario: Label and data rows remain editable

- **WHEN** a selected object has existing labels or data
- **THEN** key/value controls SHALL fit inside the rail
- **AND** remove/apply actions SHALL not push controls outside the panel

### Requirement: Mode tabs are stable at default desktop width

The harness mode switcher SHALL expose the primary modes predictably at the
default one-third rail width.

#### Scenario: Primary modes are visible

- **WHEN** the harness loads at a desktop viewport with the default rail width
- **THEN** Build, Inspect, YAML, Attention, and Layers SHALL be directly visible
- **AND** normal desktop width SHALL NOT hide `Layers` behind scroll arrows

### Requirement: Stacked responsive layout preserves panel content

The stacked responsive layout SHALL show active mode panel content before the
canvas.

#### Scenario: Inspect content is visible when stacked

- **WHEN** the viewport is narrow enough for the workspace to stack
- **AND** Inspect is the active mode
- **THEN** the selected object's Inspect fields SHALL be visible before the
  canvas
- **AND** the canvas SHALL not immediately follow the mode tabs without panel
  content

#### Scenario: YAML and Attention content are visible when stacked

- **WHEN** YAML or Attention is the active mode in a stacked viewport
- **THEN** the active panel content SHALL have a usable height
- **AND** the panel SHALL not collapse to zero height

### Requirement: Editor affordances remain aligned

The YAML editor SHALL keep editor-specific affordances aligned without causing
outer panel overflow.

#### Scenario: Copy button stays in editor corner

- **WHEN** the YAML panel is active
- **THEN** the copy button SHALL be pinned inside the editor's top-right corner
- **AND** it SHALL not overlap the first meaningful YAML line

#### Scenario: Diagnostics highlight editor lines

- **WHEN** the active YAML document has a parse or validation diagnostic with a
  known line
- **THEN** Monaco SHALL show a marker and whole-line highlight at that line

### Requirement: Layout tests separate intentional editor scroll from panel overflow

The harness SHALL allow Monaco's internal horizontal scrolling while preventing
outer panel overflow.

#### Scenario: Monaco overflow is not treated as panel failure

- **WHEN** YAML contains long lines
- **THEN** Monaco MAY scroll internally
- **AND** the surrounding authoring rail and panel SHALL remain aligned with the
  workspace
