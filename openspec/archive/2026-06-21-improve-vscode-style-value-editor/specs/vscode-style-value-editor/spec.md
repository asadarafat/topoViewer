# VS Code Style Value Editor

## Requirements

### Requirement: Type-Aware Style Value Controls

The Inspect panel SHALL render the style value control according to the selected
style key datatype.

#### Scenario: Enum Style

- Given a user selects a style key with known enum values
- When the row renders the style value editor
- Then the editor is a combobox/select with the known values

#### Scenario: Color Style

- Given a user selects a color style key
- When the row renders the style value editor
- Then the editor is a color picker

#### Scenario: CSS Color Expression

- Given a color style value uses a CSS variable or `rgba(...)`
- When the row renders the style value editor
- Then the editor shows the exact text value instead of a fallback color

#### Scenario: Integer Or Number Style

- Given a user selects an integer or number style key
- When the row renders the style value editor
- Then the editor is a numeric input

### Requirement: Typed YAML Output

The Inspect panel SHALL write style values using the intended YAML type when
applying style rows.

#### Scenario: Numeric Output

- Given a numeric style row with value `96`
- When the user applies styles
- Then the resulting topology YAML contains `width: 96`, not `"96"`

#### Scenario: Color Output

- Given a color style row with value `#42a5f5`
- When the user applies styles
- Then the resulting topology YAML contains the color string

### Requirement: Persistent Rows

The Inspect panel SHALL keep style rows visible and editable after adding and
applying them.

#### Scenario: Multiple Rows

- Given a user adds shape, border color, and width style rows
- When the user applies styles
- Then the rows remain represented by the selected object's style block

### Requirement: Effective Style Sync

The Inspect panel SHALL populate style rows from the same effective style that
the canvas renders.

#### Scenario: Stylesheet-Applied Style

- Given a selected object matches stylesheet rules
- When the object is selected in the canvas
- Then Inspect shows the stylesheet-applied style values in typed style rows
- And applying edited style rows writes the resulting values to topology YAML
