# VS Code Harness Authoring UX Requirements

## Requirement: Real Viewport Export

The harness SHALL make the canvas export button produce a real artifact.

#### Scenario: Browser harness PNG export

- Given the browser harness has a valid rendered topology
- When the user activates `Export viewport`
- Then a PNG file SHALL be downloaded
- And the file SHALL be non-empty
- And the status strip SHALL report the exported file name

#### Scenario: VS Code webview export

- Given the VS Code preview has a valid rendered topology
- When the user activates `Export viewport`
- Then the webview SHALL generate an export artifact
- And it SHALL send the artifact or an artifact URI to the extension host
- And the extension host SHALL let the user save or reveal the file

#### Scenario: Invalid document export

- Given the current YAML draft or applied document has blocking errors
- When the export control is rendered
- Then the export control SHALL be disabled
- And its tooltip SHALL explain that diagnostics must be fixed first

## Requirement: YAML Assist Intent

The harness SHALL expose a clear YAML authoring assistance action.

#### Scenario: Assist button at a valid mapping location

- Given the YAML editor cursor is inside a valid mapping
- When the user activates YAML assist
- Then the completion/help popup SHALL show only keys valid for that mapping
- And each item SHALL include short documentation

#### Scenario: Assist button at a valid value location

- Given the YAML editor cursor is after a known key
- When the user activates YAML assist
- Then the popup SHALL show values valid for that key
- And enum values SHALL list all accepted values
- And color values SHALL include project palette choices and valid color format
  guidance

#### Scenario: Assist button at an invalid indentation location

- Given the cursor is at an indentation level that cannot produce valid
  TopoViewer YAML
- When the user activates YAML assist
- Then the popup SHALL explain the indentation problem
- And it SHALL offer a correction snippet at the closest valid parent

## Requirement: YAML Context Engine

The harness SHALL compute YAML suggestions from parsed document context and
TopoViewer schemas, not from line heuristics alone.

#### Scenario: Label map context

- Given the cursor is under a `labels:` mapping for a graph object
- When suggestions are requested
- Then object-level keys such as `id`, `name`, `layers`, and `position` SHALL
  NOT be suggested
- And label key examples MAY be suggested from existing labels in the document

#### Scenario: Position list context

- Given the cursor is inside a `position:` list
- When suggestions are requested
- Then object-level keys and object snippets SHALL NOT be suggested
- And numeric coordinate guidance SHALL be provided

#### Scenario: Stylesheet style context

- Given the cursor is under a stylesheet rule `style:` mapping
- When suggestions are requested
- Then suggested keys SHALL come from style metadata for the matched selector
  kind
- And suggested values SHALL match the selected key's data type

#### Scenario: Selector context

- Given the cursor is after `selector:`
- When suggestions are requested
- Then selector suggestions SHALL include object kinds, known IDs, labels, and
  data-derived selectors from the applied topology document

## Requirement: Keyboard Contract

The harness SHALL keep normal text entry reliable while supporting explicit
authoring help.

#### Scenario: Space key

- Given the YAML editor has focus
- When the user presses Space
- Then a space SHALL be inserted
- And completion SHALL NOT be triggered only because Space was pressed

#### Scenario: Literal question mark in text

- Given the cursor is inside a YAML string, comment, or scalar value
- When the user presses `?`
- Then a literal `?` SHALL be inserted
- And the completion popup SHALL NOT steal focus

#### Scenario: Question mark help at structural location

- Given the cursor is at a YAML key or list-entry location
- When the user presses `?`
- Then contextual help SHALL open
- And the editor content SHALL remain unchanged

#### Scenario: Completion acceptance

- Given the completion popup is visible
- When the user presses Tab or Enter
- Then the selected completion SHALL be applied
- And the inserted snippet SHALL respect the current indentation

## Requirement: Candidate Apply Workflow

The harness SHALL separate YAML drafts from the applied preview document.

#### Scenario: Draft does not immediately change preview

- Given the YAML editor is open
- When the user edits topology or stylesheet YAML
- Then the draft SHALL be marked dirty
- And the canvas SHALL continue rendering the last applied valid document

#### Scenario: Apply valid draft

- Given the YAML draft is valid
- When the user activates Apply
- Then validation SHALL pass
- And the canvas SHALL update to the new document
- And the applied state SHALL be persisted by the browser harness host

#### Scenario: Apply invalid draft

- Given the YAML draft is invalid
- When the user activates Apply
- Then the canvas SHALL remain on the previous valid applied document
- And diagnostics SHALL identify the invalid document and line

#### Scenario: Revert draft

- Given the YAML draft has unapplied changes
- When the user activates Revert draft
- Then the editor SHALL restore the last applied YAML text
- And diagnostics for the abandoned draft SHALL clear

## Requirement: Durable Diagnostics

The harness SHALL make diagnostics actionable and durable.

#### Scenario: Diagnostics list

- Given validation returns one or more diagnostics
- When the authoring rail is visible
- Then the status strip SHALL show a summary
- And a diagnostics list SHALL show document, line, severity, code, and message

#### Scenario: Click diagnostic

- Given a diagnostic has a document and line
- When the user clicks that diagnostic
- Then the harness SHALL switch to the matching YAML tab
- And Monaco SHALL reveal and highlight that line

#### Scenario: Transient messages

- Given a command succeeds
- When the status strip reports the command result
- Then existing blocking diagnostics SHALL remain visible
- And transient success text SHALL NOT hide actionable error state
