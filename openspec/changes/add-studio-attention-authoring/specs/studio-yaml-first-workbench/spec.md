## ADDED Requirements

### Requirement: Discoverable visual attention authoring

Studio SHALL present the singleton topology Attention policy as an explicit,
collapsible capability in Project Source's Topology Outline while preserving
`topology.yaml` as the authoritative source.

#### Scenario: Discover Attention without navigating source

- **WHEN** Project Source renders the Topology Outline
- **THEN** Attention shows whether a policy is configured and exposes an
  explicit expand/collapse affordance
- **AND** expanding or collapsing the manager does not change the active source
  document, source range, selection, history, or project YAML
- **AND** no duplicate Attention control appears on the canvas toolbar

#### Scenario: Start an unconfigured policy

- **WHEN** no Attention policy exists and the author expands the manager
- **THEN** Studio offers direct actions to enable click focus or focus the
  compatible canvas selection
- **AND** does not present Attention as an addable multi-object collection

#### Scenario: Author focus from stable objects

- **WHEN** the author chooses supported node, link, link-direction, path, or
  region IDs or uses the compatible canvas selection
- **THEN** Studio updates the policy's ID focus through one visual control
- **AND** the preview immediately derives the configured attention state
- **AND** unsupported diagram selections are not added as attention IDs

#### Scenario: Configure presentation and click focus

- **WHEN** the author changes focus mode, interactive attention, or click mode
- **THEN** Studio commits the corresponding schema-compatible value
- **AND** the controls expose their current values without relying on color

#### Scenario: Preserve advanced focus clauses

- **WHEN** a policy contains label, data, selector, dependency, or change focus
  clauses and the author changes a common visual field
- **THEN** Studio visibly reports that additional YAML criteria are active
- **AND** preserves those criteria unchanged
- **AND** offers direct navigation to the owning Attention YAML

#### Scenario: Aggregate selected topology structure

- **WHEN** the author selects a region or a parent node with children and
  creates an aggregate group
- **THEN** Studio adds one valid group and lists its source and initial expanded
  state
- **AND** the author can change start-expanded state, configure click
  expansion, or remove that group

#### Scenario: Configure parallel-link grouping

- **WHEN** the author enables parallel-link grouping
- **THEN** Studio exposes enabled state, threshold, grouping keys, selector,
  and click-expansion controls
- **AND** valid changes update the rendered aggregate-link behavior
- **AND** advanced viewport thresholds remain available through View YAML

#### Scenario: Remove the complete policy deliberately

- **WHEN** the author requests removal of a configured Attention policy
- **THEN** Studio requires explicit confirmation
- **AND** canceling preserves source and history
- **AND** confirming removes only the top-level Attention policy

#### Scenario: Protect an invalid topology draft

- **WHEN** an invalid unapplied topology draft exists
- **THEN** every attention action that mutates topology YAML is disabled
- **AND** disclosure, summary, selection inspection, and View YAML remain
  available
- **AND** the invalid draft is neither discarded nor overwritten

#### Scenario: Use Attention in browser or desktop Studio

- **WHEN** the same project and visual action are used in browser and Wails
  Studio
- **THEN** both hosts commit the same topology source result through the shared
  Studio application
- **AND** neither host implements attention policy independently
