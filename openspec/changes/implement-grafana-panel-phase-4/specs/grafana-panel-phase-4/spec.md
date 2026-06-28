## ADDED Requirements

### Requirement: Grafana Panel Supports Mounted Topology-As-Code Sources

The Grafana panel SHALL support mounted TopoViewer YAML files as the primary
production workflow.

#### Scenario: Existing Fixture Dashboards Continue To Work

- **WHEN** an existing dashboard uses a generated harness fixture
- **THEN** the panel SHALL continue to render the selected fixture
- **AND** telemetry and interaction behavior SHALL remain compatible with Phase
  2 and Phase 3 dashboards
- **AND** fixture mode SHALL be treated as demo and CI support, not the primary
  user workflow

#### Scenario: Mounted Bundle Renders Without Catalog Edits

- **WHEN** a user mounts a bundle root into the Grafana container
- **AND** at least one bundle contains a `*.topo.tv.yaml`, `*.style.tv.yaml`,
  and `*.mapper.tv.yaml` file
- **AND** the panel is configured with the bundle root and selected bundle
- **THEN** the panel SHALL compose and render the TopoViewer document
- **AND** the user SHALL NOT need to create an SVG or map graphics-layer
  element IDs
- **AND** the user SHALL NOT need to know repository structure, edit
  `catalog.yaml`, run fixture sync, or rebuild the plugin

#### Scenario: Multiple Mounted Bundles Are Supported

- **WHEN** a mounted bundle root contains multiple valid bundle directories
- **THEN** the backend SHALL discover them deterministically
- **AND** the panel SHALL let the user select which bundle to render
- **AND** switching bundles SHALL reload topology, stylesheet, mapper,
  diagnostics, and mapping coverage for the selected bundle

#### Scenario: Bundle File Suffixes Are Canonical

- **WHEN** a bundle is discovered without an explicit manifest
- **THEN** the bundle SHALL contain exactly one `*.topo.tv.yaml`, exactly one
  `*.style.tv.yaml`, and exactly one `*.mapper.tv.yaml`
- **AND** missing or duplicate files for any required suffix SHALL produce a
  source diagnostic
- **AND** arbitrary `*.yaml` files SHALL NOT be guessed as topology, style, or
  mapper files

#### Scenario: Mounted Bundle Is Delivered To The Browser Safely

- **WHEN** the panel frontend needs selected mounted bundle content
- **THEN** the plugin SHALL provide a Grafana backend/resource endpoint or
  equivalent provisioning mechanism
- **AND** missing or unreadable mounted bundle files SHALL produce source
  diagnostics
- **AND** the panel SHALL NOT silently fall back to an unrelated fixture

#### Scenario: TopoViewer Mapper Is Explicit

- **WHEN** a mounted source is used
- **THEN** telemetry binding SHALL come from `*.mapper.tv.yaml`
- **AND** the mapper SHALL support compact `rules:` that declare metric,
  selector, join label, value semantic, states, and runtime styles
- **AND** canonical `mappings:` SHALL remain available for advanced object
  resolvers, value extraction, thresholds, conditions, and overlay behavior
- **AND** hidden code-only mapper behavior SHALL NOT be the primary production
  contract

#### Scenario: Mapper Supports Metric-To-Object Rules

- **WHEN** a Grafana data frame contains a supported metric series
- **THEN** `*.mapper.tv.yaml` SHALL be able to map that series to supported
  TopoViewer object kinds through schema-defined compact rules or canonical
  mapping rules
- **AND** supported target kinds SHALL include `node`, `link`, `path`,
  `region`, `layer`, and `graph`
- **AND** each compact rule SHALL explicitly define metric, `select`, optional
  `join`, optional `value`, optional `states`, and `style`
- **AND** each canonical mapping rule SHALL explicitly define the metric
  selector, target kind, resolver mode, value extraction, threshold policy when
  needed, and overlay adapter
- **AND** `layer` and `graph` targets SHALL be treated as aggregate targets
  that can drive summary state, badges, filtering, focus, or child-object
  propagation rather than pretending to be single rendered elements

#### Scenario: Mapper Resolver Modes Are Explicit

- **WHEN** a mapper rule resolves telemetry to TopoViewer objects
- **THEN** resolver modes SHALL be schema-defined rather than arbitrary code
- **AND** initial resolver modes SHALL include object ID matching, label
  matching, data-field matching, link endpoint matching, TopoViewer selector
  matching, aggregate target matching, and explicit static object ID lists
- **AND** resolver diagnostics SHALL explain why a metric series matched zero,
  one, or multiple objects

#### Scenario: Mapper Overlay Adapters Are Target Specific

- **WHEN** a mapper rule targets a TopoViewer object
- **THEN** the panel SHALL apply only overlay controls supported for that target
  kind
- **AND** invalid combinations such as link-only line controls on a node target
  SHALL be reported as mapper diagnostics
- **AND** overlays SHALL remain runtime-only and SHALL NOT mutate topology YAML
  or stylesheet YAML

#### Scenario: Mapper Severity Palette Controls Operational Colors

- **WHEN** a mounted bundle defines severity colors in `*.mapper.tv.yaml`
- **THEN** severity-driven runtime overlays SHALL use that mapper palette
- **AND** missing palette entries SHALL fall back to the built-in Grafana
  TopoViewer severity colors
- **AND** users SHALL be able to change operational colors by editing mapper
  YAML and reloading the selected mounted bundle
- **AND** static shape, icon, and baseline styling SHALL remain in
  `*.style.tv.yaml`

#### Scenario: TopoViewer Mapper Is Schema Backed

- **WHEN** `*.mapper.tv.yaml` support is implemented
- **THEN** the mapper SHALL have a versioned schema
- **AND** the same schema SHALL be used by Grafana validation, browser harness
  YAML assist, VS Code harness YAML assist, documentation, and tests
- **AND** schema validation SHALL report path-specific diagnostics for invalid
  keys, invalid enum values, missing required fields, and invalid value types

#### Scenario: Harness Suggests Mapper Values From Topology

- **WHEN** a user edits `*.mapper.tv.yaml` in the browser or VS Code harness
- **THEN** YAML assist SHALL suggest valid mapper keys and enum values
- **AND** it SHALL suggest topology-derived object IDs, labels, data keys, join
  targets, compact rule fields, state expressions, threshold fields, overlay
  modes, and starter PromQL where relevant
- **AND** suggestions SHALL respect YAML indentation and cursor context

### Requirement: Source Diagnostics Are Actionable

The Grafana panel SHALL diagnose source failures before telemetry mapping.

#### Scenario: Invalid Mounted Bundle YAML Is Reported As Source Failure

- **WHEN** topology, stylesheet, or TopoViewer mapper YAML cannot be parsed
- **THEN** the panel SHALL report which document failed
- **AND** it SHOULD include line and column details when available
- **AND** telemetry overlays SHALL NOT be applied to a stale or unrelated
  topology

#### Scenario: Invalid TopoViewer Document Is Reported

- **WHEN** YAML parses but cannot compose into a valid TopoViewer document
- **THEN** the panel SHALL report a TopoViewer validation diagnostic
- **AND** the diagnostic SHALL be separate from Prometheus/query diagnostics

#### Scenario: Invalid Mapper Is Reported Before Telemetry Mapping

- **WHEN** `*.mapper.tv.yaml` is missing required fields or references an
  unsupported mapper feature
- **THEN** the panel SHALL report a mapper diagnostic
- **AND** it SHALL NOT apply partial telemetry overlays unless the mapper error
  is explicitly non-blocking
- **AND** missing topology object references, unknown labels, and unknown data
  keys SHALL be reported separately from Grafana query/data-frame issues

### Requirement: Mapper Diagnostics Explain Object Binding

The Grafana panel SHALL expose topology-native mapper diagnostics and coverage.

#### Scenario: Topology Inventory Is Discoverable

- **WHEN** a valid topology is loaded
- **THEN** the panel SHALL be able to list nodes, links, paths, regions, layers,
  labels, and data keys available for mapping

#### Scenario: Stable Metric Labels Are Recommended

- **WHEN** mapping guidance is shown
- **THEN** the panel SHALL recommend `node_id`, `link_id`, `path_id`, and
  `region_id` for precise joins
- **AND** it SHALL explain that labels such as `site`, `pod`, `role`,
  `service`, and `tenant` are grouping/filtering dimensions

#### Scenario: Mapping Coverage Is Visible

- **WHEN** Grafana data frames are received
- **THEN** the panel SHALL report matched telemetry, unmatched telemetry,
  unmapped topology objects, duplicate mappings, ambiguous endpoint matches, and
  stale IDs

#### Scenario: Parallel Link Endpoint Matching Warns

- **WHEN** telemetry omits `link_id` and a topology contains multiple links with
  the same source and target
- **THEN** the panel SHALL warn that endpoint matching is ambiguous
- **AND** it SHALL recommend adding `link_id`

### Requirement: Starter Queries Are Generated

The Grafana panel SHALL help users create Prometheus queries from the mounted
TopoViewer mapper and selected topology.

#### Scenario: PromQL Starters Exist

- **WHEN** a valid topology and mapper are loaded
- **THEN** the panel or docs SHALL provide starter PromQL for metrics declared
  by the selected mapper
- **AND** the Phase 4 examples SHALL include at least link and node targets
- **AND** dedicated service-path and routing-adjacency starter catalogs MAY be
  added by follow-up operational playbook specs

#### Scenario: Starters Match Bundle Identity

- **WHEN** `*.mapper.tv.yaml` defines a source identity
- **THEN** generated PromQL SHOULD include that source identity
- **AND** production examples SHOULD prefer `source_id` or graph-specific labels
  over fixture-only labels

### Requirement: Runtime Overlay Foundation Extends Beyond Link-Only Compatibility

The Grafana panel SHALL support generic mapper-driven runtime overlays without
mutating source YAML.

#### Scenario: Generic Target Overlay

- **WHEN** telemetry samples are mapped through `*.mapper.tv.yaml`
- **THEN** the mapper SHALL be able to target nodes, links, paths, regions,
  layers, and graphs
- **AND** target-specific overlay adapters SHALL apply only supported runtime
  visual controls for that target kind
- **AND** unsupported controls SHALL produce mapper diagnostics instead of
  silently failing

#### Scenario: Conditional Runtime Styles Are Selector-Like

- **WHEN** a mapper rule resolves a metric sample to a TopoViewer object set
- **THEN** compact `rules:` MAY classify values into named states and apply
  `style.default` plus `style.<state>` runtime style patches
- **AND** state style string values SHALL support mapper templates for value,
  rounded value, state/category, metric name, target ID, labels, and fields
- **AND** canonical `mappings:` MAY apply conditional TopoViewer style patches
  based on metric value, computed severity, Grafana data-frame labels, or
  Grafana data-frame fields
- **AND** selector resolver mode SHALL support styling all matching objects of
  the selected target kind
- **AND** conditional styles SHALL be runtime-only overlays and SHALL NOT mutate
  topology YAML or stylesheet YAML
- **AND** the mapper contract SHALL NOT require fault-management or weathermap
  concepts for generic runtime styling

#### Scenario: Aggregate Target Overlay

- **WHEN** a mapper rule targets a `layer` or `graph`
- **THEN** the panel SHALL treat it as aggregate state
- **AND** the rule MAY propagate supported runtime overlays to child objects
- **AND** the panel SHALL NOT pretend the aggregate target is a single rendered
  object when no such rendered object exists

#### Scenario: Dedicated Operational Playbooks Are Deferred

- **WHEN** node health, service path SLO, or routing adjacency dashboards are
  planned
- **THEN** they SHALL reuse the generic mapper foundation from this phase
- **AND** polished dashboards, screenshots, and detailed workflow docs for those
  playbooks SHALL be handled by follow-up implementation specs rather than by
  hard-coded panel metric behavior

### Requirement: Phase 4 Production Gate Is Explicit

The Grafana panel SHALL NOT treat the mounted bundle mapper foundation as
production-ready until integrated validation passes after the final hardening
changes.

#### Scenario: Integrated Production Readiness Gate

- **WHEN** Phase 4 implementation tasks are complete
- **THEN** the live Phase 4 Grafana smoke SHALL be rerun after the latest
  mounted-bundle manifest and source-diagnostic changes
- **AND** full `npm run ci` SHALL pass with generated outputs in the intended
  committed or ignored state
- **AND** generated/build artifacts SHALL be reviewed before commits are made
- **AND** Phase 4 SHALL be archived only after this gate passes
- **AND** Phase 5 Containerlab implementation SHALL remain blocked until Phase
  4 is accepted and archived
