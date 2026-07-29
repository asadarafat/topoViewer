## MODIFIED Requirements

### Requirement: Single public authoring application

Studio SHALL be the only deployed TopoViewer authoring application after the
maintainer-approved cutover and SHALL use browser and desktop hosts for the same
authoring product.

#### Scenario: Open the primary authoring route

- **WHEN** a user follows the public browser authoring CTA
- **THEN** the browser opens `/studio/`
- **AND** Studio owns project creation, visual editing, code editing, mapper
  authoring, persistence, and export

#### Scenario: Open the desktop application

- **WHEN** a user launches a supported Desktop Studio artifact
- **THEN** it mounts the same Studio application against the desktop host
- **AND** portable source and authoring behavior do not fork from Browser Studio

#### Scenario: Follow a retired Harness link

- **WHEN** a user opens the historical `/harness/` URL
- **THEN** the site redirects to `/studio/`
- **AND** no Harness JavaScript application or duplicate authoring state loads

#### Scenario: Inspect repository ownership

- **WHEN** maintainers audit browser and desktop authoring entries
- **THEN** both mount the shared Studio application
- **AND** no legacy Harness tree, VS Code adapter, duplicate authoring state,
  fixture API, build lane, or public support claim remains

### Requirement: Coherent production application shell

TopoViewer Studio SHALL use one Studio-owned Material UI theme with native
light and dark color schemes while keeping rendered topology content
design-system neutral.

#### Scenario: Follow the operating system

- **WHEN** the appearance preference is System
- **THEN** Studio uses the operating-system light or dark preference
- **AND** responds to a later operating-system scheme change

#### Scenario: Override the operating system

- **WHEN** the user chooses Light or Dark
- **THEN** Studio applies that scheme independently of the operating system
- **AND** persists the choice through `StudioHost`
- **AND** browser and desktop hosts restore equivalent behavior

#### Scenario: Open Studio with a saved preference

- **WHEN** Studio starts with a stored appearance preference
- **THEN** application chrome does not render in the wrong scheme before
  applying that preference

#### Scenario: Render Studio controls

- **WHEN** Studio opens in either maintained host
- **THEN** normal controls and surfaces use the shared MUI component and theme
  layer
- **AND** feature modules do not own a competing palette or raw control family

#### Scenario: Preserve renderer independence

- **WHEN** an adopter imports the public TopoViewer renderer
- **THEN** Material UI is not required as a peer dependency
- **AND** exported diagram appearance does not inherit Studio Material chrome

### Requirement: Candidate state remains portable and host-neutral

Candidate style state SHALL be owned by Studio and SHALL behave equivalently in
browser and desktop hosts.

#### Scenario: Recover after interruption

- **WHEN** bounded recovery captures a project with a dirty or invalid style
  candidate
- **THEN** Studio can restore candidate text separately from the last valid
  applied project
- **AND** no host promotes invalid candidate text to authoritative source

#### Scenario: Export before applying

- **WHEN** an author exports while a candidate remains unapplied
- **THEN** Studio requires the same valid Apply semantics used by Save
- **AND** exported consumers receive one canonical stylesheet, not hidden draft
  state
