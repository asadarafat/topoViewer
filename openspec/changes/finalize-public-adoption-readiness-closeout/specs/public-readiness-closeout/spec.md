## ADDED Requirements

### Requirement: Committed-Tree Readiness Closeout

TopoViewer SHALL archive `harden-public-adoption-readiness` only after the
reviewed patch set has passed full local and remote validation from a committed
tree.

#### Scenario: Maintainer closes hardening work

- **GIVEN** the public adoption hardening patch set has been reviewed
- **WHEN** the maintainer commits and runs closeout validation
- **THEN** `npm run ci` passes from the committed tree
- **AND** GitHub CI and Docs pass for the pushed branch
- **AND** the hardening OpenSpec is archived only after remaining promo-video
  hosting decisions are complete or explicitly accepted.
