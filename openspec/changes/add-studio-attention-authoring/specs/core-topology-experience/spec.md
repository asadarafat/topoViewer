## ADDED Requirements

### Requirement: Pure attention authoring contract

The core package SHALL expose a pure authoring contract that applies supported
attention actions to a valid topology document. It SHALL validate attention
invariants, SHALL NOT mutate its inputs, and SHALL preserve every attention
field not owned by the requested action.

#### Scenario: Change a common field without losing advanced policy

- **WHEN** a consumer changes focus IDs, a presentation mode, aggregate state,
  or link-grouping configuration on a policy containing advanced query or
  viewport clauses
- **THEN** only the field owned by that action changes
- **AND** unrelated labels, data, selector, dependency, change, aggregate, and
  viewport clauses remain semantically equal

#### Scenario: Focus known objects

- **WHEN** a consumer sets one or more IDs that exist in the core attention
  index
- **THEN** the returned policy contains those IDs in deterministic input order
  without duplicates
- **AND** the source document remains unchanged

#### Scenario: Reject an unknown focus object

- **WHEN** a consumer sets an ID that does not exist in the core attention
  index
- **THEN** the action fails with an owned validation error
- **AND** no partial policy is returned or applied

#### Scenario: Create an aggregate from a valid source

- **WHEN** a consumer creates an aggregate for an existing region or for a node
  that owns children
- **THEN** the returned group has a deterministic collision-safe ID and the
  correct source reference
- **AND** existing groups and aggregate viewport policy remain unchanged

#### Scenario: Reject an invalid aggregate source

- **WHEN** a consumer requests an aggregate for a missing region, a missing
  parent, or a parent with no children
- **THEN** the action fails without changing the source policy

#### Scenario: Validate parallel-link grouping

- **WHEN** a consumer changes link-grouping threshold or grouping keys
- **THEN** thresholds below two and empty or unsupported grouping keys are
  rejected
- **AND** valid grouping settings preserve selector, expansion, and viewport
  fields not owned by the action

#### Scenario: Remove attention

- **WHEN** a consumer requests removal of the complete attention policy
- **THEN** the contract returns no policy
- **AND** does not mutate graph, diagram, layout, style, or toggle data
