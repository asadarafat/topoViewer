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
import type { Dispatch, SetStateAction } from 'react';
import type { TopoDocument } from 'topoviewer';
import type { HarnessFixture, ValidationResult } from '../shared/types';
import type { WebviewDiagnostic } from '../shared/types';
import type { AttentionFocusKind } from '../shared/topologyMutations';
import type { HarnessMode } from './webviewAppSupport';
import type { MapperCoveragePreview } from './mapperCoveragePreview';
import { MapperRuleBuilderPanel, MapperYamlActions } from './MapperYamlTools';
import type { MapperRuleBuilderState, MapperTopologyPickers } from './mapperRuleBuilder';
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
                  ? <MapperYamlActions host={host} insertMapperPreset={insertMapperPreset} />
                  : <Button size="small" disabled={!selectedPrimary} onClick={styleSelectionInYaml}>Style in YAML</Button>}
                <Button size="small" onClick={showYamlSuggestions}>YAML assist</Button>
                <Button size="small" onClick={downloadYamlBundle}>Download bundle</Button>
                <Button size="small" variant="contained" disabled={!draftDirty} onClick={applyYamlDraft}>Apply</Button>
                <Button size="small" disabled={!draftDirty} onClick={revertYamlDraft}>Revert draft</Button>
              </Stack>
              {tab === 2 && (
                <MapperRuleBuilderPanel
                  insertMapperRuleFromBuilder={insertMapperRuleFromBuilder}
                  mapperCoveragePreview={mapperCoveragePreview}
                  mapperPickers={mapperPickers}
                  mapperRuleBuilder={mapperRuleBuilder}
                  updateMapperRuleBuilder={updateMapperRuleBuilder}
                  visibleDocument={visibleDocument}
                />
              )}
              {yamlAssistEmptyMessage && (
                <Alert severity="info" className="topoviewer-vscode-yaml-assist-empty">
                  {yamlAssistEmptyMessage}
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
