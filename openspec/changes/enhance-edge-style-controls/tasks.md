## 1. Tests First

- [ ] 1.1 Add compiler unit tests for direction-specific arrow color and size inheritance
- [ ] 1.2 Add compiler unit tests for supported arrow shape values and `none`
- [ ] 1.3 Add lint or validation tests for unsupported arrow shapes and non-canonical style keys
- [ ] 1.4 Add compiler unit tests for source/target label style inheritance and overrides
- [ ] 1.5 Add renderer tests for label border, font style, and pointer-event behavior
- [ ] 1.6 Add unit tests for endpoint spacing path adjustment and short-edge clamping
- [ ] 1.7 Add route generation tests for segment controls
- [ ] 1.8 Add route generation tests for taxi controls
- [ ] 1.9 Add unit tests for gradient stop parsing and invalid stop diagnostics
- [ ] 1.10 Add Playwright tests for the new edge examples

## 2. Style Contract

- [ ] 2.1 Define supported arrow shapes in a shared constant
- [ ] 2.2 Define supported taxi directions in a shared constant
- [ ] 2.3 Compile `sourceArrowColor`, `targetArrowColor`, `sourceArrowSize`, and `targetArrowSize`
- [ ] 2.4 Keep `arrowColor` as a fallback for existing styles
- [ ] 2.5 Compile global and endpoint-specific label style keys
- [ ] 2.6 Compile `sourceDistanceFromNode` and `targetDistanceFromNode`
- [ ] 2.7 Compile `segmentDistances`, `segmentWeights`, `taxiDirection`, `taxiTurn`, and `taxiTurnMinDistance`
- [ ] 2.8 Compile `lineFill`, `lineGradientStopColors`, and `lineGradientStopPositions`
- [ ] 2.9 Compile `interactive` and `labelInteractive`
- [ ] 2.10 Export public types only where TypeScript callers need discoverability

## 3. Renderer

- [ ] 3.1 Render custom SVG markers for supported arrow shapes
- [ ] 3.2 Keep invisible React Flow `BaseEdge` hit testing compatible with custom visible markers
- [ ] 3.3 Apply endpoint spacing before path generation, labels, markers, outlines, and gradients
- [ ] 3.4 Render independent center/source/target label styles
- [ ] 3.5 Implement label pointer-event control for `labelInteractive`
- [ ] 3.6 Implement edge interaction control for `interactive`
- [ ] 3.7 Implement segment route generation when explicit segment controls are present
- [ ] 3.8 Implement taxi route generation when explicit taxi controls are present
- [ ] 3.9 Render linear gradients on the visible edge paint layer
- [ ] 3.10 Preserve existing pipe, lane, line outline, animation, and attention behavior

## 4. Schemas And Lint

- [ ] 4.1 Update combined and stylesheet schemas with the new edge style keys
- [ ] 4.2 Add semantic lint for unsupported arrow shapes
- [ ] 4.3 Add semantic lint for invalid endpoint spacing values
- [ ] 4.4 Add semantic lint for invalid route control values and mismatched arrays
- [ ] 4.5 Add semantic lint for invalid gradient stops
- [ ] 4.6 Ensure diagnostics identify the offending stylesheet rule or object style path

## 5. Examples And Docs

- [ ] 5.1 Add `edges/arrow-label-controls` with live viewport, topology YAML, stylesheet YAML, and expected assertions
- [ ] 5.2 Add `edges/endpoint-spacing-routing` with live viewport, topology YAML, stylesheet YAML, and expected assertions
- [ ] 5.3 Add `edges/gradient-and-interaction` with live viewport, topology YAML, stylesheet YAML, and expected assertions
- [ ] 5.4 Update edge reference docs to list supported keys and non-goals
- [ ] 5.5 Update stylesheet docs so edge keys are discoverable in canonical `camelCase`
- [ ] 5.6 Sync MkDocs and Zensical docs after implementation

## 6. Validation

- [ ] 6.1 Run `npm run validate:schemas`
- [ ] 6.2 Run focused compiler/style unit tests
- [ ] 6.3 Run focused Playwright tests for edge examples
- [ ] 6.4 Run `npm run docs:build:parallel`
- [ ] 6.5 Run `npm run ci`
- [ ] 6.6 Verify local MkDocs and Zensical preview with `npm run docs:preview`
