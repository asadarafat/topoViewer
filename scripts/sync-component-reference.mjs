import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = ts.createSourceFile('types.ts', fs.readFileSync(path.join(root, 'packages/topoviewer/src/core/types.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
const descriptions = {
  document: 'Required composed runtime document. Portable sources keep topology and stylesheet separate; compose and validate them before rendering.',
  colorMode: 'Explicit light or dark renderer theme. Defaults to dark; documentation adapters follow their host theme.',
  theme: 'Partial semantic theme-token override. Keep status and focus colors consistent and accessible.',
  selectedLayerIds: 'Controlled visible layer IDs. Omission selects every declared layer; an empty array hides all layered objects.',
  selectedObjectIds: 'Controlled selection using stable source IDs. Update from onSelectionChange when the application owns selection.',
  previewObjectIds: 'Source IDs to highlight as a transient preview without committing selection.',
  initialViewport: 'Initial x/y translation and zoom. Used on mount; it is not a controlled viewport prop.',
  nodesDraggable: 'Set false for a read-only view. Dragging is enabled unless disabled and only after layout is ready; persist positions through callbacks.',
  nodesResizable: 'Enable visual resize handles for authoring. Persist accepted dimensions and source positions in the host.',
  nodesConnectable: 'Set true to expose connection creation. Disabled unless explicitly enabled; connections still need host validation and persistence.',
  nodesFocusable: 'Allow node keyboard traversal. Keep enabled for accessible read-only diagrams.',
  edgesFocusable: 'Allow edge keyboard traversal. Keep enabled when readers need to inspect relationships.',
  disableKeyboardA11y: 'Disable the underlying graph keyboard accessibility behavior. Keep false or omitted for normal reader-facing diagrams.',
  onlyRenderVisibleElements: 'Limit mounted graph elements to the visible viewport. Evaluate accessibility and interaction implications before enabling.',
  panOnDrag: 'Control pointer panning, or restrict it to specified mouse buttons. Coordinate this with host selection tools.',
  selectionOnDrag: 'Enable box selection while dragging on empty canvas. Use selectionMode to define enclosure behavior.',
  selectionMode: 'Box-selection policy: full enclosure or partial overlap. Omission uses full enclosure.',
  connectionHandleMode: 'Connection anchor mode: full-node, explicit handles, or shape handles. Defaults to full-node.',
  helperLines: 'Boolean or alignment/snapping configuration for draggable authoring views. This is runtime state, not YAML.',
  toggles: 'Runtime display-switch values. Override the document-defined initial view without rewriting source facts.',
  layout: 'Runtime layout override. Supply supported manual, force, CLOS, or tree configuration.',
  attention: 'Runtime focus query or precomputed presentation. Focus changes visibility/emphasis and does not mutate source topology.',
  extensions: 'Ordered compiler/render extensions. Each extension names its boundary and may supply supported custom node or edge types.',
  controlPanelToggle: 'Host settings-panel button configuration: enabled, open state, and onToggle callback. The host owns the panel content.',
  fitViewOnInit: 'Explicit initial-fit policy. Omission fits when no initialViewport is supplied.',
  fitViewRequestId: 'Change this value to request another fit after initialization. Reusing the same value does not request a new fit.',
  grid: 'Show the grid, hide it with false, or supply color, gap, and dot size. Omission shows the grid.',
  miniMap: 'Enable an interactive overview minimap. Omission leaves it hidden.',
  viewportControls: 'Hide controls with false, or configure position, zoom/fit actions, fit options, and custom children.',
  onObjectClick: 'Click payload includes source id, opaque runtimeId, element kind, data, and optional modifier keys. Use source id for domain joins.',
  onObjectDoubleClick: 'Double-click payload extends the object payload with client coordinates. The host decides whether to open an editor.',
  onObjectContextMenu: 'Object context-menu payload includes client coordinates. The host owns the menu and action policy.',
  onSelectionContextMenu: 'Context-menu payload includes the selected object list and client coordinates.',
  onSelectionChange: 'Receives { objects }, including stable identities and object semantics. Update controlled selection from those source IDs.',
  onPaneClick: 'Empty-canvas click includes client and graph coordinates, viewport, and optional modifiers. Useful for clearing selection or inserting an object.',
  onNodePositionChange: 'Committed single-object movement, including source id, runtimeId, position, data, and optional delta. Persist through a host transaction.',
  onNodesPositionChange: 'Batch of committed movements, for example dragging a multi-selection. Persist the batch atomically.',
  onNodePositionPreview: 'Transient movement preview. Avoid persisting each pointer event as a committed source change.',
  onNodeResizeChange: 'Accepted resize includes id, runtimeId, position, width/height size, and object data. Persist topology position and stylesheet dimensions separately.',
  onRegionAggregateToggle: 'Region-summary expansion request includes regionId, groupId, expanded, and data. The host controls the resulting aggregate state.',
  onLinkAggregateToggle: 'Parallel-link group request includes groupId, expanded, memberIds, and data. Keep the underlying source links intact.',
  onConnectionCreate: 'Connection request includes source/target source IDs, runtime IDs, and optional handle IDs. The host creates and validates the source link.',
  isConnectionValid: 'Return a boolean for a proposed connection. Reject unsupported endpoint/handle combinations before the host creates a link.',
  onViewportChange: 'Receives x, y, and zoom after viewport changes. Store under the topology identity to restore that view on a later mount.',
  onExport: 'Callback for the viewport export action. The host chooses format, destination, and error handling.',
  emptyFallback: 'React content or callback for empty and filtered-empty render states. Explain how the reader can return to a populated view.',
  errorFallback: 'React content or callback receiving structured diagnostics. Replace the default error UI while retaining actionable messages.',
  onDiagnostics: 'Receives structured renderer diagnostics. Log or display their code, severity, and message without exposing sensitive source data.',
  exportDisabled: 'Disable the export action while the host cannot export safely, such as during a pending operation.',
  exportTooltip: 'Host-supplied export-button explanation, including why export is disabled when relevant.',
  className: 'Class on the renderer wrapper. Scope host CSS so it does not alter graph geometry accidentally.',
  style: 'Wrapper CSS properties. Give the viewport a definite height and a usable width.'
};
const eventNames = new Set(['TopoViewerObjectClick', 'TopoViewerObjectContextMenu', 'TopoViewerObjectDoubleClick', 'TopoViewerSelectionChange', 'TopoViewerSelectionContextMenu', 'TopoViewerViewport', 'TopoViewerNodePositionChange', 'TopoViewerNodeResizeChange', 'TopoViewerRegionAggregateToggle', 'TopoViewerLinkAggregateToggle', 'TopoViewerConnectionCreate', 'TopoViewerPaneClick', 'TopoViewerHelperLinesOptions', 'TopoViewerViewportControlsOptions', 'TopoViewerGridOptions']);
const lines = ['<!-- Generated by scripts/sync-component-reference.mjs. Edit descriptions there. -->', '# Component props and events', '',
  'Import `TopoViewer` and its types from `topoviewer`, and its required CSS from `topoviewer/style.css`. The prop signatures below are generated from the public TypeScript declarations; behavior notes are reviewed alongside the runtime.', '',
  'Start with the [React quickstart](../examples/use-cases/react.md). This reference follows [development documentation](../start/documentation-versions.md); check the release notes when adopting a new option.', '',
  '## Props', ''];
for (const node of source.statements) {
  if (!ts.isInterfaceDeclaration(node) || node.name.text !== 'TopoViewerProps') continue;
  for (const member of node.members) {
    const key = member.name.getText(source);
    if (!descriptions[key]) throw new Error(`Missing reviewed component-prop description: ${key}`);
    lines.push(`### ${key}`, '', descriptions[key], '', '```ts', `${member.getText(source)}`, '```', '');
  }
}
lines.push('## Event payloads and option objects', '', 'The payload declarations distinguish stable source identity from renderer identity. Treat `runtimeId` as opaque. Callbacks report changes; the host owns persistence, validation, and undo.', '');
for (const node of source.statements) {
  if (ts.isInterfaceDeclaration(node) && eventNames.has(node.name.text)) lines.push(`### ${node.name.text}`, '', '```ts', node.getText(source).replace(/^export /, ''), '```', '');
}
const file = path.join(root, 'packages/topoviewer/content/pages/reference/component-props.md');
const content = `${lines.join('\n').trim()}\n`;
if (process.argv.includes('--check')) {
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) throw new Error('Component reference is stale. Run npm run sync:object-reference.');
} else if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) fs.writeFileSync(file, content);
