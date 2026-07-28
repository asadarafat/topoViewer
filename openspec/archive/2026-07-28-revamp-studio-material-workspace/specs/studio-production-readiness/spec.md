## MODIFIED Requirements

### Requirement: Material UI-owned Studio styling

Studio SHALL use MUI as the single owner of normal application controls,
surfaces, color schemes, typography, spacing, and interaction states.

#### Scenario: Add or change Studio UI styling

- **WHEN** a maintainer changes Studio presentation
- **THEN** standard UI uses MUI components, props, and semantic tokens first
- **AND** both native MUI light and dark color schemes remain available
- **AND** component geometry uses `sx` or centralized Studio tokens
- **AND** authored CSS remains limited to third-party or generated DOM

#### Scenario: Validate theme ownership

- **WHEN** CI inspects Studio source
- **THEN** it requires one theme provider and both MUI color schemes
- **AND** rejects unapproved application color literals, raw interactive
  controls, direct storage access, duplicate stylesheet ownership, and MUI
  implementation-class selectors

### Requirement: Cross-host and cross-browser verification

Studio SHALL verify contextual authoring and normal light and dark appearance
in browser and VS Code hosts.

#### Scenario: Run the golden authoring journey

- **WHEN** the shared journey creates, selects, edits, maps, saves, reloads, and
  exports a project
- **THEN** Add, Properties, Canvas Properties, and Mapper transitions are
  deterministic
- **AND** the portable project remains equivalent across hosts

#### Scenario: Review visual regressions

- **WHEN** visual tests run
- **THEN** screenshots cover Add, object Properties, Canvas Properties, Mapper,
  dialogs, toolbar, Monaco, desktop, narrow, normal light, and normal dark
- **AND** overlap, truncation, blank output, low contrast, or stale
  four-workspace chrome blocks release

#### Scenario: Verify appearance persistence

- **WHEN** System, Light, and Dark choices are exercised
- **THEN** each host restores the chosen preference
- **AND** switching appearance leaves project source byte-for-byte unchanged

## ADDED Requirements

### Requirement: Rams-oriented product review

Studio SHALL evaluate the redesigned shell against explicit usefulness,
understandability, restraint, honesty, durability, thoroughness, and efficiency
criteria.

#### Scenario: Review the completed redesign

- **WHEN** maintainers perform the final UI review
- **THEN** the canvas remains visually dominant
- **AND** routine creation, selection, canvas configuration, and mapper
  targeting have one obvious path
- **AND** visible statuses match real application state
- **AND** no redundant destination, control family, palette, or persistent
  shell remains
