## ADDED Requirements

### Requirement: Hosted Promo Video

TopoViewer SHALL use a durable hosted promo video URL in public README content
only after the recording has been reviewed and uploaded to an approved public
host.

#### Scenario: README embeds public media

- **WHEN** a user opens the GitHub README
- **THEN** the YAML-to-graph walkthrough is playable or visibly represented
- **AND** no README, docs, or generated site content references `.artifacts/`
- **AND** the checked-in poster image remains available as a compatible fallback.
