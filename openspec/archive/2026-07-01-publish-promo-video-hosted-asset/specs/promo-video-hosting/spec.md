## ADDED Requirements

### Requirement: Deprecated Hosted Promo Video

TopoViewer SHALL NOT require a hosted promo video URL for public README content.
The public README SHALL favor the checked-in collage asset. Generated video
files MAY exist as local review artifacts, but they SHALL NOT be required for
release readiness.

#### Scenario: README uses collage-first public media

- **WHEN** a user opens the GitHub README
- **THEN** the YAML-to-graph story is visibly represented by the checked-in
  collage
- **AND** no README, docs, or generated site content references `.artifacts/`
- **AND** no hosted video upload is required for the release gate.
