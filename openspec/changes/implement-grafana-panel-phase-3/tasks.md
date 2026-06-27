## 1. Phase 2 Handoff

- [x] 1.1 Stop local Phase 2 lab before implementation
- [x] 1.2 Confirm Phase 2 implementation remains committed
- [x] 1.3 Keep public Grafana status exploratory

## 2. TopoViewer Runtime Hooks

- [x] 2.1 Add `initialViewport` prop
- [x] 2.2 Add `nodesDraggable` prop
- [x] 2.3 Restore viewport without overriding it with `fitView`
- [x] 2.4 Preserve default renderer behavior for existing users

## 3. Panel Interaction State

- [x] 3.1 Add interaction option type
- [x] 3.2 Add normalized interaction defaults
- [x] 3.3 Add session/browser persistence helpers
- [x] 3.4 Add topology identity keying
- [x] 3.5 Add position override extension
- [x] 3.6 Add unit tests for persistence and position override behavior

## 4. Panel UX

- [x] 4.1 Capture object selection and focus
- [x] 4.2 Clear selection on pane click
- [x] 4.3 Capture viewport on pan/zoom
- [x] 4.4 Capture node position overrides on drag
- [x] 4.5 Add reset local positions action
- [x] 4.6 Keep telemetry overlays separate from persisted interaction state

## 5. Grafana Options

- [x] 5.1 Add `interaction.enabled`
- [x] 5.2 Add `interaction.allowNodeDrag`
- [x] 5.3 Add viewport persistence selector
- [x] 5.4 Add selection persistence selector
- [x] 5.5 Add node position persistence selector
- [x] 5.6 Add reset-on-topology-change option

## 6. Documentation

- [x] 6.1 Document Phase 3 interaction state in panel README
- [x] 6.2 Document runtime-state boundary in integration roadmap
- [x] 6.3 Keep canonical YAML immutability explicit

## 7. Validation

- [x] 7.1 Run Grafana panel unit tests
- [x] 7.2 Run Grafana panel typecheck
- [x] 7.3 Run `npm run ci:quality`
- [x] 7.4 Run `npm run grafana:panel:build`
- [ ] 7.5 Run local Grafana smoke if Docker validation is requested

## 8. Phase Handoff

- [ ] 8.1 Archive after validation and review
- [ ] 8.2 Create Phase 4 implementation OpenSpec only after Phase 3 is accepted
