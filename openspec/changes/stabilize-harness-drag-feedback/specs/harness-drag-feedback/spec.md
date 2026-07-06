## ADDED Requirements

### Requirement: Smooth Harness Drag Feedback

The browser harness SHALL provide smooth visual feedback while a user drags a
draggable topology object.

#### Scenario: Node follows pointer without discontinuous jumps

- **WHEN** a user drags a node through a sequence of small pointer movements in
  the browser harness
- **THEN** the rendered node position SHALL progress consistently with pointer
  motion
- **AND** helper-line snapping SHALL NOT cause repeated zero-motion frames while
  the pointer continues moving
- **AND** helper-line snapping SHALL NOT cause node movement to exceed the
  pointer movement by more than the configured smoothness tolerance

#### Scenario: Helper lines remain visible during smooth drag

- **WHEN** a dragged node approaches an eligible alignment candidate
- **THEN** helper lines SHALL render during the active drag
- **AND** the helper lines SHALL clear after drag stop
- **AND** helper-line rendering SHALL NOT require rewriting the active node
  position on every pointer movement

#### Scenario: Final position remains intentional

- **WHEN** helper-line snapping is enabled and the user releases a dragged node
  near a valid alignment guide
- **THEN** the committed position reported through `onNodePositionChange` SHALL
  be the stable snapped position when the snap candidate is still valid
- **AND** the browser harness SHALL persist that final position into topology
  YAML through the existing mutation path

#### Scenario: Non-snapped drag remains continuous

- **WHEN** no alignment candidate is within the configured threshold
- **THEN** the dragged node SHALL follow React Flow's current drag position
- **AND** the final reported position SHALL match the current rendered node
  position rather than a stale event payload

### Requirement: Stable Snap Candidate Selection

TopoViewer SHALL avoid rapid snap target switching during an active drag.

#### Scenario: Live snap uses hysteresis when enabled

- **WHEN** live snap behavior is enabled for a host
- **THEN** a snap candidate SHALL remain active until the pointer exits a release
  threshold larger than the acquire threshold
- **AND** a competing candidate SHALL replace the active candidate only when it
  is materially closer or otherwise wins a deterministic tie-break

#### Scenario: Midpoint guides do not destabilize default harness dragging

- **WHEN** midpoint helper lines are enabled in the browser harness
- **THEN** midpoint guides MAY be displayed as visual guidance
- **AND** midpoint candidates SHALL NOT introduce live snap oscillation during
  normal pointer-following drag

### Requirement: Drag State Scheduling

TopoViewer SHALL schedule transient helper-line rendering state so it does not
add unnecessary high-frequency React churn during drag.

#### Scenario: Helper-line overlay state is animation-frame scheduled

- **WHEN** pointer movement emits multiple node position changes in one
  animation frame
- **THEN** helper-line visual state updates SHOULD be coalesced to the next
  animation frame
- **AND** stale scheduled updates SHALL be cancelled when the drag stops or the
  component unmounts

#### Scenario: Region and parented-node contracts are preserved

- **WHEN** a region or parented node is dragged with helper lines enabled
- **THEN** region member translation and parent-relative-to-absolute coordinate
  handling SHALL remain correct
- **AND** smooth drag changes SHALL NOT regress existing region drag behavior
