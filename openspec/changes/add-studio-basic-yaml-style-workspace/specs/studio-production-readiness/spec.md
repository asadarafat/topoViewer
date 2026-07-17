# Studio Style Production Readiness Delta

## ADDED Requirements

### Requirement: Verified style-authoring workflow

Studio SHALL treat Visual/Code synchronization, source preservation, contextual
assistance, candidate preview, and style-draft recovery as release-blocking
behavior.

#### Scenario: Run the style acceptance journey

- **WHEN** the browser and VS Code parity suites select node, link, region, and
  annotation targets and edit them through Visual and Code
- **THEN** compatible controls, candidate source, preview, Apply, Revert, Save,
  reload, and export behave equivalently
- **AND** existing stylesheet fixtures render identically after no-op editing

#### Scenario: Verify source preservation

- **WHEN** fixtures contain comments, blank lines, quoted scalars, block scalars,
  aliases, unknown keys, CSS variables, and ordered rules
- **THEN** targeted Visual edits preserve every unrelated source range
- **AND** any unavoidable normalization is explicit and reviewed

#### Scenario: Verify contextual editor behavior

- **WHEN** completion and `?` discovery are exercised in property, value,
  selector, comment, string, block-scalar, and URL contexts
- **THEN** only the valid contexts are modified
- **AND** suggested properties and values remain target-compatible

### Requirement: Bounded candidate performance

Style candidate processing SHALL remain responsive on the representative dense
Studio fixture and SHALL retain existing lazy-load and bundle budgets.

#### Scenario: Type in YAML on a dense project

- **WHEN** an author types continuously with 1,000 nodes and representative links
- **THEN** validation is debounced and stale results cannot replace newer state
- **AND** the canvas keeps its last valid projection, selection, pan, and zoom
- **AND** Monaco remains outside the initial application chunk

#### Scenario: Change Visual controls repeatedly

- **WHEN** an author uses color, number, select, switch, or slider controls
- **THEN** candidate YAML is mutated at bounded transaction points
- **AND** pointer movement does not serialize the full project document

### Requirement: Accessible style authoring

Visual and Code style representations SHALL meet the existing Studio WCAG 2.2 AA target.

#### Scenario: Author styles with a keyboard and screen reader

- **WHEN** an author navigates mode tabs, grouped fields, completion,
  diagnostics, Apply, Revert, Code-owned source navigation, and inline migration
- **THEN** focus order, names, values, errors, source state, and outcomes are
  perceivable without pointer input or color-only meaning
- **AND** mode switches restore a predictable focus target

#### Scenario: Use constrained visual settings

- **WHEN** Studio runs at its documented narrow width, 200 percent zoom, forced
  colors, or reduced motion
- **THEN** the Style workspace remains operable without incoherent overlap
- **AND** the canvas remains available and selected content is not obscured
