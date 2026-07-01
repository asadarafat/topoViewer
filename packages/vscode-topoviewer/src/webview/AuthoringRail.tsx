import Editor from '@monaco-editor/react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState, type Dispatch, type SetStateAction } from 'react';
import type { TopoDocument } from 'topoviewer';
import type { HarnessFixture, ValidationResult } from '../shared/types';
import type { WebviewDiagnostic } from '../shared/types';
import type { AttentionFocusKind } from '../shared/topologyMutations';
import type { HarnessMode } from './webviewAppSupport';
import type { MapperCoveragePreview } from './mapperCoveragePreview';
import { mapperPresetOptions } from './mapperPresets';
import {
  mapperRuleResolverModes,
  mapperRuleTargetKinds,
  mapperRuleValueKinds,
  type MapperRuleBuilderState,
  type MapperRuleResolverMode,
  type MapperRuleTargetKind,
  type MapperTopologyPickers
} from './mapperRuleBuilder';
import type { KeyValueEditorRow } from './webviewStyleMetadata';

type AuthoringRailProps = Record<string, any> & {
  availableFocusIds: string[];
  dataRows: KeyValueEditorRow[];
  fixtures: HarnessFixture[];
  graphNodes: any[];
  harnessModes: HarnessMode[];
  insertObjectGroups: Array<{ description: string; objects: any[]; title: string }>;
  labelRows: KeyValueEditorRow[];
  pathTransitIds: string[];
  pathTransitOptions: any[];
  selectedLayerIds: string[];
  setSelectedLayerIds: Dispatch<SetStateAction<string[]>>;
  validation: ValidationResult;
  visibleDocument?: TopoDocument;
  activeDiagnostics: WebviewDiagnostic[];
  mapperCoveragePreview?: MapperCoveragePreview;
  mapperPickers?: MapperTopologyPickers;
  mapperRuleBuilder?: MapperRuleBuilderState;
  insertMapperPreset?: (presetId: string) => void;
  insertMapperRuleFromBuilder?: () => void;
  updateMapperRuleBuilder?: (patch: Partial<MapperRuleBuilderState>) => void;
  yamlAssistEmptyMessage?: string;
};

export function AuthoringRail(props: AuthoringRailProps) {
  const {
  HarnessTabPanel,
  activeDiagnostics,
  activeModeIndex,
  addKeyValueRow,
  addPathTransitNode,
  a11yProps,
  applyAggregation,
  applyAttentionFocus,
  applyAttentionMatcher,
  applyInspector,
  applyInteraction,
  applyKeyValueRows,
  applyLinkGrouping,
  applyRelationshipInspector,
  applyYamlDraft,
  attentionClickMode,
  attentionDataKey,
  attentionDataValue,
  attentionExpandOnClick,
  attentionFocusId,
  attentionFocusKind,
  attentionInteractive,
  attentionLabelKey,
  attentionLabelValue,
  attentionMode,
  attentionRegionId,
  attentionSummary,
  availableFocusIds,
  copyYamlToClipboard,
  createConnection,
  createPath,
  createTopology,
  currentAttention,
  dataRows,
  deleteSelection,
  draftDirty,
  downloadYamlBundle,
  editorLabel,
  editorTheme,
  editorValue,
  fixtures,
  focusKindLabel,
  graphNodes,
  handleEditorMount,
  harnessModes,
  hasErrors,
  host,
  insertObject,
  insertObjectGroups,
  insertMapperPreset,
  insertMapperRuleFromBuilder,
  insertPreset,
  inspectorLayerId,
  inspectorName,
  inspectorX,
  inspectorY,
  labelRows,
  linkGroupingThreshold,
  linkSourceId,
  linkTargetId,
  mapperCoveragePreview,
  mapperPickers,
  mapperRuleBuilder,
  mode,
  modeIndex,
  modeLabel,
  movePathTransitNode,
  nodeNameById,
  pathSourceId,
  pathTargetId,
  pathTransitCandidate,
  pathTransitIds,
  pathTransitOptions,
  presetName,
  openDiagnostic,
  relationshipComposer,
  reloadFixture,
  removeKeyValueRow,
  removePathTransitNode,
  resetAttention,
  revertTopology,
  revertYamlDraft,
  saveSelectionAsPreset,
  saveTopology,
  selectedFixture,
  selectedLayerIds,
  selectedObjects,
  selectedPrimary,
  selectionSummary,
  setAttentionClickMode,
  setAttentionDataKey,
  setAttentionDataValue,
  setAttentionExpandOnClick,
  setAttentionFocusId,
  setAttentionFocusKind,
  setAttentionInteractive,
  setAttentionLabelKey,
  setAttentionLabelValue,
  setAttentionMode,
  setAttentionRegionId,
  setInspectorLayerId,
  setInspectorName,
  setInspectorX,
  setInspectorY,
  setLinkGroupingThreshold,
  setLinkSourceId,
  setLinkTargetId,
  setMode,
  setPathSourceId,
  setPathTargetId,
  setPathTransitCandidate,
  setPresetName,
  setRelationshipComposer,
  setSelectedLayerIds,
  setTab,
  setDraftMapperText,
  setDraftStylesheetText,
  setDraftTopologyText,
  showYamlSuggestions,
  state,
  statusSeverity,
  statusSummary,
  styleSelectionInYaml,
  tab,
  updateKeyValueRow,
  updateMapperRuleBuilder,
  useSelectionForAttention,
  validation,
  visibleDocument,
  yamlAssistEmptyMessage
  } = props;
  const [mapperDocsAnchor, setMapperDocsAnchor] = useState<HTMLElement | null>(null);
  const [mapperPresetAnchor, setMapperPresetAnchor] = useState<HTMLElement | null>(null);
  const closeMapperDocs = () => setMapperDocsAnchor(null);
  const closeMapperPresets = () => setMapperPresetAnchor(null);
  const openMapperDocs = (target: string) => {
    closeMapperDocs();
    void host.openDocs(target);
  };
  const applyMapperPreset = (presetId: string) => {
    closeMapperPresets();
    insertMapperPreset?.(presetId);
  };
  const updateMapperBuilder = (patch: Partial<MapperRuleBuilderState>) => updateMapperRuleBuilder?.(patch);
  const mapperObjectIds = mapperRuleBuilder && mapperPickers
    ? mapperPickers.objectIdsByKind[mapperRuleBuilder.targetKind]
    : [];
  const mapperLabelValues = mapperRuleBuilder && mapperPickers
    ? mapperPickers.labelEntries
      .filter((entry) => !mapperRuleBuilder.labelKey || entry.key === mapperRuleBuilder.labelKey)
      .map((entry) => entry.value)
    : [];
  const mapperLabelValue = mapperRuleBuilder
    ? mapperLabelValues.includes(mapperRuleBuilder.labelValue) ? mapperRuleBuilder.labelValue : mapperLabelValues[0] || ''
    : '';

  return (
        <Box className="topoviewer-vscode-rail">
          <Paper className={`topoviewer-vscode-source topoviewer-vscode-source--${mode}`} elevation={0}>
            {host.kind === 'browser' && (
              <Stack className="topoviewer-vscode-template-control" spacing={1}>
                <FormControl size="small" className="topoviewer-vscode-fixture">
                  <InputLabel id="fixture-label" shrink>Template</InputLabel>
                  <Select
                    labelId="fixture-label"
                    label="Template"
                    notched
                    value={state?.fixtureId || ''}
                    onChange={(event) => reloadFixture(String(event.target.value))}
                  >
                    {fixtures.map((fixture) => (
                      <MenuItem key={fixture.id} value={fixture.id}>{fixture.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  <Button size="small" onClick={createTopology}>New topology</Button>
                  <Button size="small" onClick={saveTopology}>Save</Button>
                  <Button size="small" disabled={!state?.fixtureId} onClick={revertTopology}>
                    {selectedFixture?.kind === 'saved' ? 'Remove saved' : 'Revert template'}
                  </Button>
                </Stack>
              </Stack>
            )}

            <Box className="topoviewer-vscode-mode-tabs">
              <Tabs
                value={activeModeIndex}
                onChange={(_event, nextIndex: number) => setMode(harnessModes[nextIndex])}
                variant="fullWidth"
                aria-label="Authoring mode"
              >
                {harnessModes.map((candidate, index) => (
                  <Tab key={candidate} label={modeLabel(candidate)} {...a11yProps(index)} />
                ))}
              </Tabs>
            </Box>
            <Alert severity={statusSeverity} className="topoviewer-vscode-diagnostic-strip">
              <Box className="topoviewer-vscode-status-row">
                <Typography className="topoviewer-vscode-status-summary" variant="caption">{statusSummary}</Typography>
                {selectedObjects.length > 0 && (
                  <Typography className="topoviewer-vscode-selection-summary" variant="caption">{selectionSummary(selectedObjects)}</Typography>
                )}
              </Box>
            </Alert>
            {activeDiagnostics.length > 0 && (
              <Stack className="topoviewer-vscode-diagnostic-list" spacing={0.5}>
                {activeDiagnostics.slice(0, 4).map((diagnostic: WebviewDiagnostic, index: number) => (
                  <Button
                    key={`${diagnostic.code}-${diagnostic.document || 'document'}-${diagnostic.line || 1}-${index}`}
                    className="topoviewer-vscode-diagnostic-item"
                    color={diagnostic.severity === 'error' ? 'error' : 'warning'}
                    size="small"
                    onClick={() => openDiagnostic(diagnostic)}
                  >
                    <span>{diagnostic.document || 'topology'}:{diagnostic.line || 1}</span>
                    <span>{diagnostic.code}</span>
                  </Button>
                ))}
              </Stack>
            )}

            <HarnessTabPanel value={activeModeIndex} index={modeIndex('build')} className="topoviewer-vscode-mode-pane topoviewer-vscode-build-pane">
              <Stack className="topoviewer-vscode-mode-pane-scroll" spacing={2}>
                {insertObjectGroups.map((group) => (
                  <Stack key={group.title} spacing={1}>
                    <Box>
                      <Typography variant="subtitle2">{group.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{group.description}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      {group.objects.map((object) => (
                        <Tooltip
                          key={object.kind === 'insert' ? object.type : object.preset.id}
                          title={object.kind === 'insert' ? `Insert ${object.label}` : `Insert ${object.label} preset`}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            aria-label={`Insert ${object.label}`}
                            onClick={() => object.kind === 'insert' ? insertObject(object.type) : insertPreset(object.preset)}
                          >
                            + {object.label}
                          </Button>
                        </Tooltip>
                      ))}
                    </Stack>
                  </Stack>
                ))}
                {relationshipComposer && (
                  <Stack className="topoviewer-vscode-relationship-composer" spacing={1}>
                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="subtitle2">
                          {relationshipComposer === 'link' ? 'Connection endpoints' : 'Path sequence'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {relationshipComposer === 'link'
                            ? 'Choose source and target nodes.'
                            : 'Choose source, optional transit nodes, and target.'}
                        </Typography>
                      </Box>
                      <Button size="small" onClick={() => setRelationshipComposer(undefined)}>Close</Button>
                    </Stack>

                    {relationshipComposer === 'link' ? (
                      <Stack spacing={1}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="connection-source-label">Connection source</InputLabel>
                          <Select labelId="connection-source-label" label="Connection source" value={linkSourceId} onChange={(event) => setLinkSourceId(String(event.target.value))}>
                            {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <FormControl fullWidth size="small">
                          <InputLabel id="connection-target-label">Connection target</InputLabel>
                          <Select labelId="connection-target-label" label="Connection target" value={linkTargetId} onChange={(event) => setLinkTargetId(String(event.target.value))}>
                            {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={hasErrors || !linkSourceId || !linkTargetId || linkSourceId === linkTargetId}
                          onClick={createConnection}
                        >
                          Create connection
                        </Button>
                      </Stack>
                    ) : (
                      <Stack spacing={1}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="path-source-label">Path source</InputLabel>
                          <Select labelId="path-source-label" label="Path source" value={pathSourceId} onChange={(event) => setPathSourceId(String(event.target.value))}>
                            {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Stack direction="row" spacing={1}>
                          <FormControl fullWidth size="small">
                            <InputLabel id="path-transit-label">Add transit node</InputLabel>
                            <Select labelId="path-transit-label" label="Add transit node" value={pathTransitCandidate} onChange={(event) => setPathTransitCandidate(String(event.target.value))}>
                              {pathTransitOptions.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                            </Select>
                          </FormControl>
                          <Button size="small" disabled={!pathTransitCandidate} onClick={addPathTransitNode}>Add</Button>
                        </Stack>
                        {pathTransitIds.map((nodeId, index) => (
                          <Stack key={nodeId} className="topoviewer-vscode-transit-row" direction="row" spacing={0.5}>
                            <Typography variant="caption">{nodeNameById.get(nodeId) || nodeId}</Typography>
                            <Button size="small" disabled={index === 0} onClick={() => movePathTransitNode(index, -1)}>Up</Button>
                            <Button size="small" disabled={index === pathTransitIds.length - 1} onClick={() => movePathTransitNode(index, 1)}>Down</Button>
                            <Button size="small" onClick={() => removePathTransitNode(nodeId)}>Remove</Button>
                          </Stack>
                        ))}
                        <FormControl fullWidth size="small">
                          <InputLabel id="path-target-label">Path target</InputLabel>
                          <Select labelId="path-target-label" label="Path target" value={pathTargetId} onChange={(event) => setPathTargetId(String(event.target.value))}>
                            {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={hasErrors || !pathSourceId || !pathTargetId || pathSourceId === pathTargetId}
                          onClick={createPath}
                        >
                          Create path
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                )}
              </Stack>
            </HarnessTabPanel>

            <HarnessTabPanel value={activeModeIndex} index={modeIndex('inspect')} className="topoviewer-vscode-mode-pane topoviewer-vscode-inspector-pane">
              {!selectedPrimary ? (
                <Stack className="topoviewer-vscode-empty-state" spacing={1}>
                  <Typography variant="subtitle2">Select a canvas object</Typography>
                  <Typography variant="body2" color="text.secondary">Properties and style controls will appear here.</Typography>
                </Stack>
              ) : (
                <Stack className="topoviewer-vscode-mode-pane-scroll" spacing={1}>
                  <TextField
                    size="small"
                    label="Object name"
                    value={`${selectedPrimary.kind}:${selectedPrimary.id}`}
                    slotProps={{ input: { readOnly: true } }}
                  />
                  <TextField size="small" label="Display name" value={inspectorName} onChange={(event) => setInspectorName(event.target.value)} />
                  <FormControl size="small">
                    <InputLabel id="inspector-layer-label">Layer</InputLabel>
                    <Select labelId="inspector-layer-label" label="Layer" value={inspectorLayerId} onChange={(event) => setInspectorLayerId(String(event.target.value))}>
                      {validation.layers.map((layer) => <MenuItem key={layer.id} value={layer.id}>{layer.name || layer.id}</MenuItem>)}
                    </Select>
                  </FormControl>
                  {selectedPrimary.kind === 'link' && (
                    <Stack className="topoviewer-vscode-relationship-composer" spacing={1}>
                      <Typography variant="subtitle2">Link endpoints</Typography>
                      <FormControl fullWidth size="small">
                        <InputLabel id="link-source-label">Link source</InputLabel>
                        <Select labelId="link-source-label" label="Link source" value={linkSourceId} onChange={(event) => setLinkSourceId(String(event.target.value))}>
                          {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel id="link-target-label">Link target</InputLabel>
                        <Select labelId="link-target-label" label="Link target" value={linkTargetId} onChange={(event) => setLinkTargetId(String(event.target.value))}>
                          {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <Button
                        size="small"
                        disabled={hasErrors || !linkSourceId || !linkTargetId || linkSourceId === linkTargetId}
                        onClick={applyRelationshipInspector}
                      >
                        Apply relationship
                      </Button>
                    </Stack>
                  )}
                  {selectedPrimary.kind === 'path' && (
                    <Stack className="topoviewer-vscode-relationship-composer" spacing={1}>
                      <Typography variant="subtitle2">Path sequence</Typography>
                      <FormControl fullWidth size="small">
                        <InputLabel id="inspector-path-source-label">Path source</InputLabel>
                        <Select labelId="inspector-path-source-label" label="Path source" value={pathSourceId} onChange={(event) => setPathSourceId(String(event.target.value))}>
                          {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <Stack direction="row" spacing={1}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="inspector-path-transit-label">Add transit node</InputLabel>
                          <Select labelId="inspector-path-transit-label" label="Add transit node" value={pathTransitCandidate} onChange={(event) => setPathTransitCandidate(String(event.target.value))}>
                            {pathTransitOptions.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Button size="small" disabled={!pathTransitCandidate} onClick={addPathTransitNode}>Add</Button>
                      </Stack>
                      {pathTransitIds.map((nodeId, index) => (
                        <Stack key={nodeId} className="topoviewer-vscode-transit-row" direction="row" spacing={0.5}>
                          <Typography variant="caption">{nodeNameById.get(nodeId) || nodeId}</Typography>
                          <Button size="small" disabled={index === 0} onClick={() => movePathTransitNode(index, -1)}>Up</Button>
                          <Button size="small" disabled={index === pathTransitIds.length - 1} onClick={() => movePathTransitNode(index, 1)}>Down</Button>
                          <Button size="small" onClick={() => removePathTransitNode(nodeId)}>Remove</Button>
                        </Stack>
                      ))}
                      <FormControl fullWidth size="small">
                        <InputLabel id="inspector-path-target-label">Path target</InputLabel>
                        <Select labelId="inspector-path-target-label" label="Path target" value={pathTargetId} onChange={(event) => setPathTargetId(String(event.target.value))}>
                          {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <Button
                        size="small"
                        disabled={hasErrors || !pathSourceId || !pathTargetId || pathSourceId === pathTargetId}
                        onClick={applyRelationshipInspector}
                      >
                        Apply relationship
                      </Button>
                    </Stack>
                  )}
                  <Stack direction="row" spacing={1}>
                    <TextField size="small" label="X" value={inspectorX} onChange={(event) => setInspectorX(event.target.value)} />
                    <TextField size="small" label="Y" value={inspectorY} onChange={(event) => setInspectorY(event.target.value)} />
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Labels</Typography>
                    {labelRows.map((row, index) => (
                      <Stack key={row.id} className="topoviewer-vscode-key-value-row" direction="row" spacing={1} data-label-row-key={row.key}>
                        <TextField size="small" label="Label key" value={row.key} onChange={(event) => updateKeyValueRow('labels', row.id, { key: event.target.value })} />
                        <TextField size="small" label="Label value" value={row.value} onChange={(event) => updateKeyValueRow('labels', row.id, { value: event.target.value })} />
                        <Button size="small" disabled={labelRows.length === 1 && index === 0 && !row.key} onClick={() => removeKeyValueRow('labels', row.id)}>Remove</Button>
                      </Stack>
                    ))}
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => addKeyValueRow('labels')}>Add label row</Button>
                      <Button size="small" onClick={() => applyKeyValueRows('labels')}>Apply labels</Button>
                    </Stack>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Data</Typography>
                    {dataRows.map((row, index) => (
                      <Stack key={row.id} className="topoviewer-vscode-key-value-row" direction="row" spacing={1} data-data-row-key={row.key}>
                        <TextField size="small" label="Data key" value={row.key} onChange={(event) => updateKeyValueRow('data', row.id, { key: event.target.value })} />
                        <TextField size="small" label="Data value" value={row.value} onChange={(event) => updateKeyValueRow('data', row.id, { value: event.target.value })} />
                        <Button size="small" disabled={dataRows.length === 1 && index === 0 && !row.key} onClick={() => removeKeyValueRow('data', row.id)}>Remove</Button>
                      </Stack>
                    ))}
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => addKeyValueRow('data')}>Add data row</Button>
                      <Button size="small" onClick={() => applyKeyValueRows('data')}>Apply data</Button>
                    </Stack>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Preset</Typography>
                    <TextField fullWidth size="small" label="Preset name" value={presetName} onChange={(event) => setPresetName(event.target.value)} />
                    <Button size="small" onClick={saveSelectionAsPreset}>Save as preset</Button>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={styleSelectionInYaml}>Style in YAML</Button>
                    <Button size="small" variant="contained" onClick={applyInspector}>Apply properties</Button>
                    <Button size="small" color="error" onClick={deleteSelection}>Delete</Button>
                  </Stack>
                </Stack>
              )}
            </HarnessTabPanel>

            <HarnessTabPanel value={activeModeIndex} index={modeIndex('yaml')} className="topoviewer-vscode-mode-pane topoviewer-vscode-yaml-pane">
              <Tabs value={tab} onChange={(_event, next) => setTab(next)} variant="fullWidth" className="topoviewer-vscode-yaml-tabs">
                <Tab label="Topology YAML" />
                <Tab label="Stylesheet YAML" />
                <Tab label="Mapper YAML" />
              </Tabs>
              <Stack className="topoviewer-vscode-yaml-actions" direction="row" spacing={1}>
                {tab === 2
                  ? (
                    <>
                      <Button
                        aria-controls={mapperDocsAnchor ? 'topoviewer-vscode-mapper-docs-menu' : undefined}
                        aria-haspopup="menu"
                        size="small"
                        onClick={(event) => setMapperDocsAnchor(event.currentTarget)}
                      >
                        Mapper docs
                      </Button>
                      <Menu
                        anchorEl={mapperDocsAnchor}
                        id="topoviewer-vscode-mapper-docs-menu"
                        onClose={closeMapperDocs}
                        open={Boolean(mapperDocsAnchor)}
                      >
                        <MenuItem onClick={() => openMapperDocs('docs/zensical/topoviewer/grafana-mapper-recipes/')}>Mapper recipes</MenuItem>
                        <MenuItem onClick={() => openMapperDocs('docs/zensical/topoviewer/schemas/#grafana-mapper-yaml')}>Mapper schema</MenuItem>
                        <MenuItem onClick={() => openMapperDocs('docs/zensical/topoviewer/object-reference/')}>Object attributes</MenuItem>
                      </Menu>
                      <Button
                        aria-controls={mapperPresetAnchor ? 'topoviewer-vscode-mapper-presets-menu' : undefined}
                        aria-haspopup="menu"
                        size="small"
                        onClick={(event) => setMapperPresetAnchor(event.currentTarget)}
                      >
                        Presets
                      </Button>
                      <Menu
                        anchorEl={mapperPresetAnchor}
                        id="topoviewer-vscode-mapper-presets-menu"
                        onClose={closeMapperPresets}
                        open={Boolean(mapperPresetAnchor)}
                      >
                        {mapperPresetOptions.map((preset) => (
                          <MenuItem key={preset.id} onClick={() => applyMapperPreset(preset.id)}>
                            <Stack spacing={0.25}>
                              <Typography variant="body2">{preset.label}</Typography>
                              <Typography variant="caption" color="text.secondary">{preset.description}</Typography>
                            </Stack>
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  )
                  : <Button size="small" disabled={!selectedPrimary} onClick={styleSelectionInYaml}>Style in YAML</Button>}
                <Button size="small" onClick={showYamlSuggestions}>YAML assist</Button>
                <Button size="small" onClick={downloadYamlBundle}>Download bundle</Button>
                <Button size="small" variant="contained" disabled={!draftDirty} onClick={applyYamlDraft}>Apply</Button>
                <Button size="small" disabled={!draftDirty} onClick={revertYamlDraft}>Revert draft</Button>
              </Stack>
              {tab === 2 && mapperRuleBuilder && mapperPickers && (
                <Accordion className="topoviewer-vscode-mapper-builder" disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle2">Rule builder</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Build a mapper rule from current topology IDs, labels, data keys, and endpoints.
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Rule ID"
                          value={mapperRuleBuilder.id}
                          onChange={(event) => updateMapperBuilder({ id: event.target.value })}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Metric"
                          value={mapperRuleBuilder.metric}
                          onChange={(event) => updateMapperBuilder({ metric: event.target.value })}
                        />
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="mapper-builder-target-kind">Target</InputLabel>
                          <Select
                            labelId="mapper-builder-target-kind"
                            label="Target"
                            value={mapperRuleBuilder.targetKind}
                            onChange={(event) => updateMapperBuilder({
                              objectId: '',
                              targetKind: event.target.value as MapperRuleTargetKind
                            })}
                          >
                            {mapperRuleTargetKinds.map((kind) => <MenuItem key={kind} value={kind}>{kind}</MenuItem>)}
                          </Select>
                          <FormHelperText>TopoViewer object family to overlay.</FormHelperText>
                        </FormControl>
                        <FormControl fullWidth size="small">
                          <InputLabel id="mapper-builder-resolver">Match by</InputLabel>
                          <Select
                            labelId="mapper-builder-resolver"
                            label="Match by"
                            value={mapperRuleBuilder.resolverMode}
                            onChange={(event) => updateMapperBuilder({ resolverMode: event.target.value as MapperRuleResolverMode })}
                          >
                            {mapperRuleResolverModes.map((mode) => <MenuItem key={mode} value={mode}>{mode}</MenuItem>)}
                          </Select>
                          <FormHelperText>How telemetry rows bind to objects.</FormHelperText>
                        </FormControl>
                      </Stack>

                      {['id', 'label', 'data'].includes(mapperRuleBuilder.resolverMode) && (
                        <TextField
                          fullWidth
                          size="small"
                          label="Telemetry label"
                          helperText="Prometheus label that carries the object ID, label value, or data value."
                          value={mapperRuleBuilder.metricLabel}
                          onChange={(event) => updateMapperBuilder({ metricLabel: event.target.value })}
                        />
                      )}

                      {['id', 'staticObjectIds'].includes(mapperRuleBuilder.resolverMode) && (
                        <FormControl fullWidth size="small">
                          <InputLabel id="mapper-builder-object">Object</InputLabel>
                          <Select
                            labelId="mapper-builder-object"
                            label="Object"
                            value={mapperRuleBuilder.objectId || mapperObjectIds[0] || ''}
                            onChange={(event) => updateMapperBuilder({ objectId: String(event.target.value) })}
                          >
                            {mapperObjectIds.map((id) => <MenuItem key={id} value={id}>{id}</MenuItem>)}
                          </Select>
                          <FormHelperText>Topology-derived object ID picker.</FormHelperText>
                        </FormControl>
                      )}

                      {mapperRuleBuilder.resolverMode === 'label' && (
                        <Stack direction="row" spacing={1}>
                          <FormControl fullWidth size="small">
                            <InputLabel id="mapper-builder-label-key">Label key</InputLabel>
                            <Select
                              labelId="mapper-builder-label-key"
                              label="Label key"
                              value={mapperRuleBuilder.labelKey || mapperPickers.labelKeys[0] || ''}
                              onChange={(event) => {
                                const nextKey = String(event.target.value);
                                const nextValue = mapperPickers.labelEntries.find((entry) => entry.key === nextKey)?.value || '';
                                updateMapperBuilder({ labelKey: nextKey, labelValue: nextValue });
                              }}
                            >
                              {mapperPickers.labelKeys.map((key) => <MenuItem key={key} value={key}>{key}</MenuItem>)}
                            </Select>
                          </FormControl>
                          <FormControl fullWidth size="small">
                            <InputLabel id="mapper-builder-label-value">Label value</InputLabel>
                            <Select
                              labelId="mapper-builder-label-value"
                              label="Label value"
                              value={mapperLabelValue}
                              onChange={(event) => updateMapperBuilder({ labelValue: String(event.target.value) })}
                            >
                              {mapperLabelValues.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Stack>
                      )}

                      {mapperRuleBuilder.resolverMode === 'data' && (
                        <FormControl fullWidth size="small">
                          <InputLabel id="mapper-builder-data-key">Data key</InputLabel>
                          <Select
                            labelId="mapper-builder-data-key"
                            label="Data key"
                            value={mapperRuleBuilder.dataKey || mapperPickers.dataKeys[0] || ''}
                            onChange={(event) => updateMapperBuilder({ dataKey: String(event.target.value) })}
                          >
                            {mapperPickers.dataKeys.map((key) => <MenuItem key={key} value={key}>{key}</MenuItem>)}
                          </Select>
                          <FormHelperText>Topology-derived `data.*` key picker.</FormHelperText>
                        </FormControl>
                      )}

                      {mapperRuleBuilder.resolverMode === 'endpoint' && (
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Source label"
                              value={mapperRuleBuilder.sourceLabel}
                              onChange={(event) => updateMapperBuilder({ sourceLabel: event.target.value })}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              label="Target label"
                              value={mapperRuleBuilder.targetLabel}
                              onChange={(event) => updateMapperBuilder({ targetLabel: event.target.value })}
                            />
                          </Stack>
                          <FormControl fullWidth size="small">
                            <InputLabel id="mapper-builder-endpoint-preview">Topology endpoint pair</InputLabel>
                            <Select
                              labelId="mapper-builder-endpoint-preview"
                              label="Topology endpoint pair"
                              value={mapperPickers.endpointPairs[0]?.label || ''}
                              onChange={() => undefined}
                            >
                              {mapperPickers.endpointPairs.map((pair) => <MenuItem key={pair.label} value={pair.label}>{pair.label}</MenuItem>)}
                            </Select>
                            <FormHelperText>Reference picker only; endpoint matching uses telemetry source/target labels.</FormHelperText>
                          </FormControl>
                        </Stack>
                      )}

                      {mapperRuleBuilder.resolverMode === 'selector' && (
                        <TextField
                          fullWidth
                          size="small"
                          label="Selector"
                          helperText="Example: link[labels.type = &quot;fabric&quot;]"
                          value={mapperRuleBuilder.selector}
                          onChange={(event) => updateMapperBuilder({ selector: event.target.value })}
                        />
                      )}

                      <Stack direction="row" spacing={1}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="mapper-builder-value">Value as</InputLabel>
                          <Select
                            labelId="mapper-builder-value"
                            label="Value as"
                            value={mapperRuleBuilder.valueAs}
                            onChange={(event) => updateMapperBuilder({ valueAs: String(event.target.value) })}
                          >
                            {mapperRuleValueKinds.map((kind) => <MenuItem key={kind} value={kind}>{kind}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <TextField
                          fullWidth
                          size="small"
                          label="Label template"
                          value={mapperRuleBuilder.labelTemplate}
                          onChange={(event) => updateMapperBuilder({ labelTemplate: event.target.value })}
                        />
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Warning threshold"
                          value={mapperRuleBuilder.warningThreshold}
                          onChange={(event) => updateMapperBuilder({ warningThreshold: event.target.value })}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Error threshold"
                          value={mapperRuleBuilder.errorThreshold}
                          onChange={(event) => updateMapperBuilder({ errorThreshold: event.target.value })}
                        />
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Default color"
                          type="color"
                          value={mapperRuleBuilder.defaultColor}
                          onChange={(event) => updateMapperBuilder({ defaultColor: event.target.value })}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Default width"
                          value={mapperRuleBuilder.defaultWidth}
                          onChange={(event) => updateMapperBuilder({ defaultWidth: event.target.value })}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Badge template"
                          value={mapperRuleBuilder.badgeTemplate}
                          onChange={(event) => updateMapperBuilder({ badgeTemplate: event.target.value })}
                        />
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        <TextField
                          fullWidth
                          size="small"
                          label="State"
                          value={mapperRuleBuilder.stateName}
                          onChange={(event) => updateMapperBuilder({ stateName: event.target.value })}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="When value"
                          value={mapperRuleBuilder.stateExpression}
                          onChange={(event) => updateMapperBuilder({ stateExpression: event.target.value })}
                        />
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          fullWidth
                          size="small"
                          label="State color"
                          type="color"
                          value={mapperRuleBuilder.stateColor}
                          onChange={(event) => updateMapperBuilder({ stateColor: event.target.value })}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="State width"
                          value={mapperRuleBuilder.stateWidth}
                          onChange={(event) => updateMapperBuilder({ stateWidth: event.target.value })}
                        />
                      </Stack>

                      <FormControlLabel
                        control={(
                          <Checkbox
                            checked={mapperRuleBuilder.propagateToLayerMembers}
                            onChange={(event) => updateMapperBuilder({ propagateToLayerMembers: event.target.checked })}
                          />
                        )}
                        label="Propagate aggregate state to layer members"
                      />

                      <Button
                        size="small"
                        variant="contained"
                        disabled={!visibleDocument || !insertMapperRuleFromBuilder}
                        onClick={insertMapperRuleFromBuilder}
                      >
                        Insert mapper rule
                      </Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}
              {yamlAssistEmptyMessage && (
                <Alert severity="info" className="topoviewer-vscode-yaml-assist-empty">
                  {yamlAssistEmptyMessage}
                </Alert>
              )}
              {tab === 2 && mapperCoveragePreview && (
                <Alert severity={mapperCoveragePreview.severity} className="topoviewer-vscode-mapper-coverage">
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="subtitle2">Synthetic mapper coverage</Typography>
                      <Typography variant="body2">{mapperCoveragePreview.summary}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      <Chip size="small" label={`${mapperCoveragePreview.counts.matchedRules}/${mapperCoveragePreview.counts.totalRules} rules`} />
                      <Chip size="small" label={`${mapperCoveragePreview.counts.matchedObjects} objects`} />
                      <Chip size="small" label={`${mapperCoveragePreview.counts.unmatchedRules} unmatched`} />
                      <Chip size="small" label={`${mapperCoveragePreview.counts.ambiguousRules} ambiguous`} />
                      <Chip size="small" label={`${mapperCoveragePreview.counts.staleReferences} stale`} />
                      <Chip size="small" label={`${mapperCoveragePreview.counts.duplicateTargets} duplicate targets`} />
                    </Stack>
                    {mapperCoveragePreview.rows.length > 0 && (
                      <Stack spacing={0.5}>
                        {mapperCoveragePreview.rows.slice(0, 4).map((row) => (
                          <Box key={row.id}>
                            <Typography variant="caption">
                              {row.id}: {row.target} / {row.resolver} / {row.status}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="p">
                              {row.detail}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      This uses synthetic labels from the current topology. Grafana recomputes coverage from live data frames at runtime.
                    </Typography>
                  </Stack>
                </Alert>
              )}
              <Box className="topoviewer-vscode-editor">
                <Tooltip title={`Copy ${editorLabel}`}>
                  <IconButton
                    aria-label={`Copy ${editorLabel}`}
                    className="topoviewer-vscode-yaml-copy"
                    size="small"
                    onClick={copyYamlToClipboard}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Editor
                  height="100%"
                  language="yaml"
                  theme={editorTheme}
                  value={editorValue}
                  onMount={handleEditorMount}
                  onChange={(value) => {
                    if (tab === 0) {
                      setDraftTopologyText(value || '');
                      return;
                    }
                    if (tab === 1) {
                      setDraftStylesheetText(value || '');
                      return;
                    }
                    setDraftMapperText(value || '');
                  }}
                  options={{
                    automaticLayout: true,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    glyphMargin: true,
                    minimap: { enabled: false },
                    padding: { top: 40 },
                    renderLineHighlight: 'gutter',
                    scrollBeyondLastLine: false,
                    tabSize: 2,
                    wordBasedSuggestions: 'off',
                    wordWrap: 'off',
                    scrollbar: {
                      horizontal: 'auto',
                      vertical: 'auto',
                      useShadows: true
                    }
                  }}
                />
              </Box>
            </HarnessTabPanel>

            <HarnessTabPanel value={activeModeIndex} index={modeIndex('attention')} className="topoviewer-vscode-mode-pane topoviewer-vscode-attention-pane">
              <Stack className="topoviewer-vscode-mode-pane-scroll" spacing={1}>
                <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                  <Chip size="small" label={attentionSummary} />
                </Stack>

                <Accordion className="topoviewer-vscode-attention-section" defaultExpanded disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle2">Object focus</Typography>
                      <Typography variant="caption" color="text.secondary">Pick one object to keep prominent.</Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="attention-focus-kind">Focus</InputLabel>
                        <Select labelId="attention-focus-kind" label="Focus" value={attentionFocusKind} onChange={(event) => {
                          setAttentionFocusKind(event.target.value as AttentionFocusKind);
                          setAttentionFocusId('');
                        }}>
                        {(['nodeIds', 'linkIds', 'pathIds', 'regionIds'] as AttentionFocusKind[]).map((kind) => (
                          <MenuItem key={kind} value={kind}>{focusKindLabel(kind)}</MenuItem>
                        ))}
                        </Select>
                        <FormHelperText>Choose the object type. This decides which ID list is available.</FormHelperText>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel id="attention-focus-id">Object</InputLabel>
                        <Select labelId="attention-focus-id" label="Object" value={attentionFocusId} onChange={(event) => setAttentionFocusId(String(event.target.value))}>
                        {availableFocusIds.map((id) => <MenuItem key={id} value={id}>{id}</MenuItem>)}
                        </Select>
                        <FormHelperText>Pick the object ID to emphasize in the canvas.</FormHelperText>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel id="attention-mode">Mode</InputLabel>
                        <Select labelId="attention-mode" label="Mode" value={attentionMode} onChange={(event) => setAttentionMode(String(event.target.value))}>
                        <MenuItem value="dim-context">Dim</MenuItem>
                        <MenuItem value="hide-context">Hide</MenuItem>
                        </Select>
                        <FormHelperText>Dim keeps context visible. Hide removes non-matching objects.</FormHelperText>
                      </FormControl>
                      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                        <Button size="small" variant="contained" disabled={hasErrors || !attentionFocusId} onClick={() => applyAttentionFocus()}>Apply focus</Button>
                        <Button size="small" disabled={hasErrors || !selectedObjects.length} onClick={useSelectionForAttention}>Use selection</Button>
                        <Button size="small" disabled={hasErrors || !currentAttention} onClick={resetAttention}>Clear</Button>
                      </Stack>
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                <Accordion className="topoviewer-vscode-attention-section" disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle2">Match by metadata</Typography>
                      <Typography variant="caption" color="text.secondary">Focus every object with a matching label or data value.</Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Label key"
                        helperText="Topology label name, for example role."
                        value={attentionLabelKey}
                        onChange={(event) => setAttentionLabelKey(event.target.value)}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Value"
                        helperText="Label value to match, for example pe."
                        value={attentionLabelValue}
                        onChange={(event) => setAttentionLabelValue(event.target.value)}
                      />
                      <Button
                        size="small"
                        aria-label="Apply attention label focus"
                        disabled={hasErrors || !attentionLabelKey.trim()}
                        onClick={() => applyAttentionMatcher('labels')}
                      >
                        Focus matching labels
                      </Button>
                      <TextField
                        fullWidth
                        size="small"
                        label="Data key"
                        helperText="Operational data key, for example severity."
                        value={attentionDataKey}
                        onChange={(event) => setAttentionDataKey(event.target.value)}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Value"
                        helperText="Data value to match, for example major."
                        value={attentionDataValue}
                        onChange={(event) => setAttentionDataValue(event.target.value)}
                      />
                      <Button
                        size="small"
                        aria-label="Apply attention data focus"
                        disabled={hasErrors || !attentionDataKey.trim()}
                        onClick={() => applyAttentionMatcher('data')}
                      >
                        Focus matching data
                      </Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                <Accordion className="topoviewer-vscode-attention-section" disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle2">Click behavior</Typography>
                      <Typography variant="caption" color="text.secondary">Let canvas clicks change attention focus.</Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      <FormControlLabel
                        control={<Checkbox size="small" checked={attentionInteractive} onChange={(_event, checked) => setAttentionInteractive(checked)} />}
                        label="Interactive"
                      />
                      <FormHelperText>When enabled, object clicks update focus without editing YAML by hand.</FormHelperText>
                      <FormControl fullWidth size="small">
                        <InputLabel id="attention-click-mode">Click mode</InputLabel>
                        <Select labelId="attention-click-mode" label="Click mode" value={attentionClickMode} onChange={(event) => setAttentionClickMode(String(event.target.value))}>
                        <MenuItem value="dim-context">Dim</MenuItem>
                        <MenuItem value="hide-context">Hide</MenuItem>
                        </Select>
                        <FormHelperText>Controls what happens to non-clicked context after a canvas click.</FormHelperText>
                      </FormControl>
                      <Button size="small" disabled={hasErrors} onClick={applyInteraction}>Apply click behavior</Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                <Accordion className="topoviewer-vscode-attention-section" disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle2">Dense summaries</Typography>
                      <Typography variant="caption" color="text.secondary">Collapse busy regions or group parallel links.</Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="attention-region">Region</InputLabel>
                        <Select labelId="attention-region" label="Region" value={attentionRegionId} onChange={(event) => setAttentionRegionId(String(event.target.value))}>
                        {(visibleDocument?.graph?.regions || []).map((region) => <MenuItem key={region.id} value={region.id}>{region.name || region.id}</MenuItem>)}
                        </Select>
                        <FormHelperText>Choose a region whose members should collapse into a summary.</FormHelperText>
                      </FormControl>
                      <FormControlLabel
                        control={<Checkbox size="small" checked={attentionExpandOnClick} onChange={(_event, checked) => setAttentionExpandOnClick(checked)} />}
                        label="Expand on click"
                      />
                      <Button size="small" disabled={hasErrors} onClick={applyAggregation}>Aggregate region</Button>
                      <TextField
                        fullWidth
                        size="small"
                        label="Link threshold"
                        helperText="Minimum parallel links before grouping. Use 2 or higher."
                        value={linkGroupingThreshold}
                        onChange={(event) => setLinkGroupingThreshold(event.target.value)}
                      />
                      <Button size="small" disabled={hasErrors} onClick={applyLinkGrouping}>Group links</Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Stack>
            </HarnessTabPanel>

            <HarnessTabPanel value={activeModeIndex} index={modeIndex('layers')} className="topoviewer-vscode-mode-pane topoviewer-vscode-layers-pane">
              <Stack className="topoviewer-vscode-layer-list">
                {validation.layers.map((layer) => (
                  <FormControlLabel
                    key={layer.id}
                    control={(
                      <Checkbox
                        checked={selectedLayerIds.includes(layer.id)}
                        slotProps={{ input: { 'aria-label': layer.name || layer.id } }}
                        onChange={(_event, checked) => {
                          setSelectedLayerIds((current) => checked
                            ? [...new Set([...current, layer.id])]
                            : current.filter((id) => id !== layer.id));
                        }}
                      />
                    )}
                    label={(
                      <Box component="span" className="topoviewer-vscode-layer-label">
                        <span>{layer.name || layer.id}</span>
                        <Chip component="span" size="small" className="topoviewer-vscode-layer-count" label={layer.objectCount} />
                      </Box>
                    )}
                  />
                ))}
              </Stack>
            </HarnessTabPanel>

          </Paper>
        </Box>
  );
}
