# Studio Spec-Driven Authoring Delta

## MODIFIED Requirements

### Requirement: Complete color authoring controls

Every canonical color-valued style field SHALL expose a visual color picker and
an exact textual CSS-value editor from the same schema-driven field metadata.

#### Scenario: Edit a hex color

- **WHEN** an author changes a color through the visual well
- **THEN** Studio commits the selected `#RRGGBB` value
- **AND** the text field and preview update without an Apply step

#### Scenario: Preserve a complex CSS color

- **WHEN** a field contains RGB(A), a named color, or a CSS variable
- **THEN** the visual color control remains available
- **AND** Studio preserves the exact textual value until the author explicitly
  changes it
- **AND** validation reports invalid text without silently replacing it

#### Scenario: Cover all color metadata

- **WHEN** canonical style metadata adds a new field with `dataType: color`
- **THEN** Studio renders the shared color field automatically
- **AND** no feature-local color-control change is required
