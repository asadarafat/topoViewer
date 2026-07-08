import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Box from '@mui/material/Box';
import { type TopoDocument, type TopoViewerConnectionCreate, type TopoViewerNodePositionChange } from 'topoviewer';
import type { HarnessFixture, TopoViewerWebviewHost, ValidationResult, WebviewDiagnostic, WebviewState } from '../shared/types';
import {
  clearAttention, defaultLayerId, deleteTopoObjects, findObject, focusKindForSelection, insertTopoObject,
  insertTopoPreset, objectExists, objectIdsByKind, updateGraphNodePosition, updateAttentionFocus,
  updateAttentionInteraction, updateAttentionLinkGrouping, updateAttentionMatcher,
  updateAttentionRegionAggregation, updateTopoObject, upsertGraphLink, upsertGraphPath,
  type AttentionFocusKind, type InsertObjectType, type TopoObjectPreset, type TopoObjectSelection
} from '../shared/topologyMutations';
import {
  keyValueRowsForObject,
  recordFromRows,
  type KeyValueEditorRow
} from './webviewStyleMetadata';
import {
  ensureStyleRule,
  stylesheetSelectorForSelection,
  type PendingYamlFocus
} from './webviewYamlAuthoring';
import { AuthoringRail } from './AuthoringRail';
import { PreviewPanel, ResizeDivider, ShellHeader, webviewShellSx } from './WebviewChrome';
import { HarnessTabPanel, a11yProps, baseInsertObjectGroups, clamp, defaultSplitPercent, focusKindLabel, harnessModes, initialSavedPresets, initialSplitPercent, layerSelectionFromTopologyText, maxSplitPercent, mergeLayerSelection, minSplitPercent, modeIndex, modeLabel, pathSequenceFromObject, positionOf, presetFromObject, sameRoundedPosition, selectedNodeIds, selectedObjectIds, selectionSummary, sequenceFromControls, useHarnessPreferencePersistence, type DocumentTransaction, type HarnessMode } from './webviewAppSupport';
import { useBrowserHarnessActions } from './harnessActions';
import { copyTextToClipboard, downloadYamlBundle as downloadYamlBundleAction, exportPreviewImage, type ExportStatus } from './webviewExportActions';
import { useBrowserYamlIntelligence, useDraftValidation, useMonacoDiagnostics, usePendingYamlFocus, useYamlEditorMount, useYamlMonacoProviders } from './webviewEditorHooks';
import { createMapperCoveragePreview } from './mapperCoveragePreview';
import { mapperTopologyPickers } from './mapperRuleBuilder';
import { useMapperRuleAuthoring } from './webviewMapperAuthoring';
import { useObjectSelectionActions } from './webviewSelectionActions';
import { useRenderProfile } from './renderProfile';
import { layersForInsertObjectType, layersForPresetKind, type CanvasAuthoringPoint, type CanvasAuthoringRect } from './canvasAuthoring';
import { createCanvasConnectionAction, createCanvasPathAction, createCanvasRegionAction, placeCanvasNodeAction } from './webviewCanvasActions';
import './webview.css';
type WebviewAppProps = { host: TopoViewerWebviewHost; themeMode?: 'light' | 'dark'; onToggleThemeMode?: () => void };

export function WebviewApp({ host, themeMode, onToggleThemeMode }: WebviewAppProps) {
  useRenderProfile('WebviewApp', { host: host.kind });
  const [state, setState] = useState<WebviewState>();
  const [draftTopologyText, setDraftTopologyText] = useState('');
  const [draftStylesheetText, setDraftStylesheetText] = useState('');
  const [draftMapperText, setDraftMapperText] = useState('');
  const [fixtures, setFixtures] = useState<HarnessFixture[]>([]);
  const [validation, setValidation] = useState<ValidationResult>({ diagnostics: [], layers: [] });
  const [draftValidation, setDraftValidation] = useState<ValidationResult>({ diagnostics: [], layers: [] });
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<TopoObjectSelection[]>([]);
  const [savedPresets, setSavedPresets] = useState<TopoObjectPreset[]>(initialSavedPresets);
  const [tab, setTab] = useState(0);
  const [mode, setMode] = useState<HarnessMode>('build');
  const [splitPercent, setSplitPercent] = useState(initialSplitPercent);
  const [resizing, setResizing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>();
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [yamlAssistEmptyMessage, setYamlAssistEmptyMessage] = useState<string>();
  const [undoStack, setUndoStack] = useState<DocumentTransaction[]>([]);
  const [redoStack, setRedoStack] = useState<DocumentTransaction[]>([]);
  const [inspectorName, setInspectorName] = useState('');
  const [inspectorLayerId, setInspectorLayerId] = useState('');
  const [inspectorX, setInspectorX] = useState('');
  const [inspectorY, setInspectorY] = useState('');
  const [labelRows, setLabelRows] = useState<KeyValueEditorRow[]>([]);
  const [dataRows, setDataRows] = useState<KeyValueEditorRow[]>([]);
  const [presetName, setPresetName] = useState('');
  const [relationshipComposer, setRelationshipComposer] = useState<'link' | 'path'>();
  const [linkSourceId, setLinkSourceId] = useState('');
  const [linkTargetId, setLinkTargetId] = useState('');
  const [pathSourceId, setPathSourceId] = useState('');
  const [pathTargetId, setPathTargetId] = useState('');
  const [pathTransitIds, setPathTransitIds] = useState<string[]>([]);
  const [pathTransitCandidate, setPathTransitCandidate] = useState('');
  const [regionMemberIds, setRegionMemberIds] = useState<string[]>([]);
  const [attentionFocusKind, setAttentionFocusKind] = useState<AttentionFocusKind>('pathIds');
  const [attentionFocusId, setAttentionFocusId] = useState('');
  const [attentionMode, setAttentionMode] = useState('dim-context');
  const [attentionInteractive, setAttentionInteractive] = useState(false);
  const [attentionClickMode, setAttentionClickMode] = useState('dim-context');
  const [attentionLabelKey, setAttentionLabelKey] = useState('');
  const [attentionLabelValue, setAttentionLabelValue] = useState('');
  const [attentionDataKey, setAttentionDataKey] = useState('');
  const [attentionDataValue, setAttentionDataValue] = useState('');
  const [attentionRegionId, setAttentionRegionId] = useState('');
  const [attentionExpandOnClick, setAttentionExpandOnClick] = useState(true);
  const [linkGroupingThreshold, setLinkGroupingThreshold] = useState('2');
  const [editorReady, setEditorReady] = useState(false);
  const [pendingYamlFocus, setPendingYamlFocus] = useState<PendingYamlFocus>();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const diagnosticDecorationsRef = useRef<any>(null);
  const editorHelpDisposableRef = useRef<any>(null);
  const editorContextRef = useRef<{
    layers: ValidationResult['layers'];
    tab: number;
    visibleDocument?: TopoDocument;
  }>({ layers: [], tab: 0 });
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const draftDirty = !!state && (
    draftTopologyText !== state.topologyText
    || draftStylesheetText !== state.stylesheetText
    || draftMapperText !== (state.mapperText || '')
  );
  const parityMode = host.kind === 'browser'
    && typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('parity') === '1';

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [initialState, availableFixtures] = await Promise.all([
          host.loadInitialState(),
          host.listFixtures?.() || Promise.resolve([])
        ]);
        if (!mounted) return;
        commitLoadedState(initialState);
        setFixtures(availableFixtures);
      } catch (error) {
        if (mounted) {
          setValidation({
            diagnostics: [{
              severity: 'error',
              source: 'host',
              code: 'host-load-failed',
              message: error instanceof Error ? error.message : String(error)
            }],
            layers: []
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [host]);

  useEffect(() => {
    if (host.kind !== 'browser') return undefined;
    (window as unknown as { __topoviewerHarnessState?: WebviewState }).__topoviewerHarnessState = state;
    return () => {
      delete (window as unknown as { __topoviewerHarnessState?: WebviewState }).__topoviewerHarnessState;
    };
  }, [host.kind, state]);

  useEffect(() => {
    if (host.kind !== 'browser') return undefined;
    (window as unknown as {
      __topoviewerHarnessDraft?: {
        dirty: boolean;
        mapperText: string;
        stylesheetText: string;
        topologyText: string;
      };
    }).__topoviewerHarnessDraft = {
      dirty: draftDirty,
      mapperText: draftMapperText,
      stylesheetText: draftStylesheetText,
      topologyText: draftTopologyText
    };
    return () => {
      delete (window as unknown as { __topoviewerHarnessDraft?: unknown }).__topoviewerHarnessDraft;
    };
  }, [draftDirty, draftMapperText, draftStylesheetText, draftTopologyText, host.kind]);

  useEffect(() => {
    if (host.kind !== 'browser') return undefined;
    (window as unknown as { __topoviewerHarnessValidation?: ValidationResult }).__topoviewerHarnessValidation = validation;
    return () => {
      delete (window as unknown as { __topoviewerHarnessValidation?: ValidationResult }).__topoviewerHarnessValidation;
    };
  }, [host.kind, validation]);

  useEffect(() => {
    if (!state || !host.saveState) return;
    host.saveState(state);
  }, [host, state]);

  useEffect(() => {
    let mounted = true;
    async function validate() {
      if (!state) return;
      try {
        const result = await host.validate(state);
        if (!mounted) return;
        setValidation(result);
        setSelectedLayerIds((current) => mergeLayerSelection(current, result.layers));
      } catch (error) {
        if (!mounted) return;
        setValidation({
          diagnostics: [{
            severity: 'error',
            source: 'host',
            code: 'host-validation-failed',
            message: error instanceof Error ? error.message : String(error)
          }],
          layers: []
        });
      }
    }
    validate();
    return () => {
      mounted = false;
    };
  }, [host, state]);
  useDraftValidation({ draftDirty, draftMapperText, draftStylesheetText, draftTopologyText, host, setDraftValidation, state, validation });
  const visibleDocument = useMemo(() => validation.document as TopoDocument | undefined, [validation.document]);
  const graphNodes = visibleDocument?.graph?.nodes || [];
  const nodeNameById = useMemo(() => {
    const baseNames = graphNodes.map((node) => String(node.name || node.label || node.id));
    const nameCounts = new Map<string, number>();
    baseNames.forEach((name) => nameCounts.set(name, (nameCounts.get(name) || 0) + 1));
    return new Map(graphNodes.map((node, index) => {
      const baseName = baseNames[index] || String(node.id);
      return [node.id, nameCounts.get(baseName)! > 1 ? `${baseName} (${node.id})` : baseName];
    }));
  }, [graphNodes]);
  const activeValidation = draftDirty ? draftValidation : validation;
  const activeDiagnostics = activeValidation.diagnostics;
  const mapperCoveragePreview = useMemo(
    () => createMapperCoveragePreview(activeValidation.document as TopoDocument | undefined, draftMapperText),
    [activeValidation.document, draftMapperText]
  );
  const mapperPickers = useMemo(() => mapperTopologyPickers(visibleDocument), [visibleDocument]);
  const {
    insertMapperPreset,
    insertMapperRuleFromBuilder,
    mapperRuleBuilder,
    updateMapperRuleBuilder
  } = useMapperRuleAuthoring({
    draftMapperText,
    flash,
    mapperPickers,
    setDraftMapperText,
    setMode,
    setTab,
    state,
    visibleDocument
  });
  const { handleObjectClick, selectObject } = useObjectSelectionActions({
    applyAttentionFocus,
    mode,
    setAttentionFocusId,
    setAttentionFocusKind,
    setMode,
    setSelectedObjects,
    visibleDocument
  });
  const appliedHasErrors = validation.diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  const activeHasErrors = activeDiagnostics.some((diagnostic) => diagnostic.severity === 'error');
  const hasErrors = appliedHasErrors || activeHasErrors;
  const hasExportBlockers = hasErrors || exportStatus === 'exporting';
  const exportTooltip = exportStatus === 'exporting'
    ? 'Export already in progress'
    : hasErrors
      ? 'Fix diagnostics before exporting'
      : undefined;
  const diagnosticSeverity: 'success' | 'warning' | 'error' = activeHasErrors ? 'error' : activeDiagnostics.length > 0 ? 'warning' : 'success';
  const diagnosticSummary = activeDiagnostics.length === 0
    ? 'No diagnostics'
    : `${activeDiagnostics.length} diagnostic${activeDiagnostics.length === 1 ? '' : 's'}: ${activeDiagnostics[0]?.code}`;
  const messageSeverity: 'success' | 'warning' = message?.toLowerCase().includes('requires') || message?.toLowerCase().includes('must') ? 'warning' : 'success';
  const exportSummary = exportStatus === 'exporting'
    ? 'Exporting viewport image...'
    : exportStatus === 'complete'
      ? 'Export complete'
      : exportStatus === 'error'
        ? 'Export failed'
        : undefined;
  const statusSeverity = activeHasErrors
    ? diagnosticSeverity
    : exportStatus === 'error'
      ? 'warning'
      : message
        ? messageSeverity
        : diagnosticSeverity;
  const statusSummary = activeHasErrors
    ? diagnosticSummary
    : exportSummary || message || (draftDirty ? `YAML draft has unapplied changes. ${diagnosticSummary}` : diagnosticSummary);
  const shellClassName = `topoviewer-vscode-shell${themeMode ? ` topoviewer-vscode-shell--${themeMode}` : ''}${parityMode ? ' topoviewer-vscode-shell--parity topoviewer-parity-theme' : ''}`;
  const nextThemeMode = themeMode === 'dark' ? 'light' : 'dark';
  const editorTheme = themeMode === 'light' ? 'light' : 'vs-dark';
  const editorValue = tab === 0 ? draftTopologyText : tab === 1 ? draftStylesheetText : draftMapperText;
  const editorLabel = tab === 0 ? 'Topology YAML' : tab === 1 ? 'Stylesheet YAML' : 'Mapper YAML';
  const selectedPrimary = selectedObjects[0];
  const selectedPrimaryObject = useMemo(() => findObject(visibleDocument, selectedPrimary), [selectedPrimary, visibleDocument]);
  const selectedFixture = fixtures.find((fixture) => fixture.id === state?.fixtureId);
  const currentAttention = visibleDocument?.attention;
  const attentionSummary = currentAttention
    ? [
      currentAttention.query ? 'focus' : undefined,
      currentAttention.interactive ? 'interactive' : undefined,
      currentAttention.aggregate?.groups?.length ? 'aggregate' : undefined,
      currentAttention.links?.grouping ? 'links' : undefined
    ].filter(Boolean).join(' / ') || 'configured'
    : 'off';
  const availableFocusIds = objectIdsByKind(visibleDocument, attentionFocusKind);
  const selectedGraphNodeIds = selectedNodeIds(selectedObjects);
  const pathTransitOptions = graphNodes.filter((node) => node.id !== pathSourceId && node.id !== pathTargetId && !pathTransitIds.includes(node.id));
  const activeModeIndex = modeIndex(mode);
  const insertObjectGroups = useMemo(() => baseInsertObjectGroups.map((group) => (
    group.title !== 'Presets'
      ? group
      : {
        ...group,
        objects: [
          ...group.objects,
          ...savedPresets.map((preset) => ({
            kind: 'preset' as const,
            label: preset.name,
            preset
          }))
        ]
      }
  )), [savedPresets]);
  const previewSelectedObjectIds = useMemo(() => selectedObjectIds(selectedObjects), [selectedObjects]);

  useEffect(() => {
    editorContextRef.current = {
      layers: validation.layers,
      tab,
      visibleDocument
    };
  }, [tab, validation.layers, visibleDocument]);

  const updateEditorDiagnostics = useMonacoDiagnostics({ activeDiagnostics, diagnosticDecorationsRef, editorRef, editorValue, monacoRef, tab });
  usePendingYamlFocus({ editorReady, editorRef, editorValue, mode, pendingYamlFocus, setPendingYamlFocus, tab });
  useBrowserYamlIntelligence({ hostKind: host.kind, validationLayers: validation.layers, visibleDocument });
  useYamlMonacoProviders({ editorReady, monacoRef, tab, validationLayers: validation.layers, visibleDocument });
  const { handleEditorMount, showYamlSuggestions } = useYamlEditorMount({
    diagnosticDecorationsRef,
    editorContextRef,
    editorHelpDisposableRef,
    editorRef,
    flash,
    hostKind: host.kind,
    monacoRef,
    setEditorReady,
    setMode,
    setYamlAssistEmptyMessage,
    updateEditorDiagnostics
  });

  useHarnessPreferencePersistence(splitPercent, savedPresets);

  useEffect(() => {
    if (!visibleDocument) return;
    setSelectedObjects((current) => current.filter((selection) => objectExists(visibleDocument, selection)));
  }, [visibleDocument]);

  useEffect(() => {
    if (!selectedPrimaryObject || !selectedPrimary) {
      setInspectorName('');
      setInspectorLayerId(defaultLayerId(visibleDocument, selectedLayerIds));
      setInspectorX('');
      setInspectorY('');
      setPresetName('');
      setLabelRows([]);
      setDataRows([]);
      setRegionMemberIds([]);
      return;
    }
    setInspectorName(selectedPrimaryObject.name || '');
    setInspectorLayerId(selectedPrimaryObject.layers?.[0] || defaultLayerId(visibleDocument, selectedLayerIds));
    setPresetName(`${selectedPrimaryObject.name || selectedPrimaryObject.label || selectedPrimary.id} preset`);
    setLabelRows(keyValueRowsForObject(selectedPrimaryObject, 'labels'));
    setDataRows(keyValueRowsForObject(selectedPrimaryObject, 'data'));
    const position = positionOf(selectedPrimaryObject.position);
    setInspectorX(position?.x !== undefined ? String(position.x) : '');
    setInspectorY(position?.y !== undefined ? String(position.y) : '');
    if (selectedPrimary.kind === 'link') {
      setLinkSourceId(String(selectedPrimaryObject.source || ''));
      setLinkTargetId(String(selectedPrimaryObject.target || ''));
    }
    if (selectedPrimary.kind === 'path') {
      const sequence = pathSequenceFromObject(selectedPrimaryObject);
      setPathSourceId(sequence[0] || '');
      setPathTargetId(sequence[sequence.length - 1] || '');
      setPathTransitIds(sequence.slice(1, -1));
      setPathTransitCandidate('');
    }
    if (selectedPrimary.kind === 'region') {
      setRegionMemberIds(Array.isArray(selectedPrimaryObject.members)
        ? selectedPrimaryObject.members.map((member: unknown) => String(member))
        : []);
    }
  }, [selectedLayerIds, selectedPrimary, selectedPrimaryObject, visibleDocument]);

  useEffect(() => {
    const query = currentAttention?.query as Record<string, any> | undefined;
    if (!query) return;
    const explicitIds = Array.isArray(query.ids) ? query.ids.map(String) : [];
    const explicitKind = explicitIds.length && explicitIds.every((id) => (visibleDocument?.graph?.links || []).some((link) => link.id === id))
      ? 'linkIds'
      : explicitIds.length
        ? 'nodeIds'
        : undefined;
    const nextKind = explicitKind || (['pathIds', 'regionIds'] as AttentionFocusKind[]).find((kind) => Array.isArray(query[kind]));
    if (nextKind) {
      setAttentionFocusKind(nextKind);
      setAttentionFocusId(String((nextKind === 'nodeIds' || nextKind === 'linkIds' ? query.ids : query[nextKind])?.[0] || ''));
    }
    if (query.mode) setAttentionMode(String(query.mode));
    const labelEntry = Object.entries(query.labels || {})[0];
    const dataEntry = Object.entries(query.data || {})[0];
    setAttentionLabelKey(labelEntry ? String(labelEntry[0]) : '');
    setAttentionLabelValue(labelEntry ? String(labelEntry[1]) : '');
    setAttentionDataKey(dataEntry ? String(dataEntry[0]) : '');
    setAttentionDataValue(dataEntry ? String(dataEntry[1]) : '');
    if (currentAttention?.interactive !== undefined) setAttentionInteractive(!!currentAttention.interactive);
    if (currentAttention?.clickMode) setAttentionClickMode(String(currentAttention.clickMode));
    if (currentAttention?.links?.grouping?.threshold !== undefined) {
      setLinkGroupingThreshold(String(currentAttention.links.grouping.threshold));
    }
  }, [currentAttention, visibleDocument?.graph?.links]);

  const updateSplitFromClientX = useCallback((clientX: number) => {
    const bounds = workspaceRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const next = ((clientX - bounds.left) / bounds.width) * 100;
    setSplitPercent(clamp(next, minSplitPercent, maxSplitPercent));
  }, []);

  useEffect(() => {
    if (!resizing) return undefined;
    const onPointerMove = (event: PointerEvent) => updateSplitFromClientX(event.clientX);
    const onPointerUp = () => setResizing(false);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [resizing, updateSplitFromClientX]);

  function flash(nextMessage: string) {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(undefined), 1800);
  }

  function commitLoadedState(nextState: WebviewState | undefined) {
    setState(nextState);
    setDraftTopologyText(nextState?.topologyText || '');
    setDraftStylesheetText(nextState?.stylesheetText || '');
    setDraftMapperText(nextState?.mapperText || '');
    if (nextState) {
      setSelectedLayerIds(layerSelectionFromTopologyText(nextState.topologyText).map((layer) => layer.id));
    } else {
      setSelectedLayerIds([]);
      setDraftValidation({ diagnostics: [], layers: [] });
    }
  }

  function applyDocumentTransaction(
    label: string,
    update: (current: WebviewState) => Partial<Pick<WebviewState, 'mapperText' | 'stylesheetText' | 'topologyText'>>
  ) {
    if (draftDirty) {
      setMode('yaml');
      flash('Apply or revert the YAML draft first');
      return;
    }
    setState((current) => {
      if (!current) return current;
      try {
        const result = update(current);
        const nextTopologyText = result.topologyText ?? current.topologyText;
        const nextStylesheetText = result.stylesheetText ?? current.stylesheetText;
        const nextMapperText = result.mapperText ?? current.mapperText;
        setUndoStack((stack) => [...stack, {
          label,
          previousTopologyText: current.topologyText,
          previousStylesheetText: current.stylesheetText,
          previousMapperText: current.mapperText,
          nextTopologyText,
          nextStylesheetText,
          nextMapperText
        }]);
        setRedoStack([]);
        flash(label);
        setDraftTopologyText(nextTopologyText);
        setDraftStylesheetText(nextStylesheetText);
        setDraftMapperText(nextMapperText || '');
        return { ...current, topologyText: nextTopologyText, stylesheetText: nextStylesheetText, mapperText: nextMapperText };
      } catch (error) {
        flash(error instanceof Error ? error.message : String(error));
        return current;
      }
    });
  }

  function applyTopologyTransaction(label: string, update: (topologyText: string) => { text: string }) {
    applyDocumentTransaction(label, (current) => ({
      topologyText: update(current.topologyText).text
    }));
  }

  function undoTopology() {
    const transaction = undoStack[undoStack.length - 1];
    if (!transaction) return;
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack, transaction]);
    setState((current) => current ? {
      ...current,
      topologyText: transaction.previousTopologyText,
      stylesheetText: transaction.previousStylesheetText,
      mapperText: transaction.previousMapperText
    } : current);
    setDraftTopologyText(transaction.previousTopologyText);
    setDraftStylesheetText(transaction.previousStylesheetText);
    setDraftMapperText(transaction.previousMapperText || '');
    flash(`Undo ${transaction.label}`);
  }

  function redoTopology() {
    const transaction = redoStack[redoStack.length - 1];
    if (!transaction) return;
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack, transaction]);
    setState((current) => current ? {
      ...current,
      topologyText: transaction.nextTopologyText,
      stylesheetText: transaction.nextStylesheetText,
      mapperText: transaction.nextMapperText
    } : current);
    setDraftTopologyText(transaction.nextTopologyText);
    setDraftStylesheetText(transaction.nextStylesheetText);
    setDraftMapperText(transaction.nextMapperText || '');
    flash(`Redo ${transaction.label}`);
  }

  async function reloadFixture(id: string) {
    if (!host.loadFixture) return;
    setLoading(true);
    try {
      setSelectedObjects([]);
      setUndoStack([]);
      setRedoStack([]);
      commitLoadedState(await host.loadFixture(id));
    } finally {
      setLoading(false);
    }
  }

  async function refreshFixtures() {
    if (!host.listFixtures) return;
    setFixtures(await host.listFixtures());
  }

  async function createTopology() {
    if (!host.createTopology) return;
    setLoading(true);
    try {
      setSelectedObjects([]);
      setUndoStack([]);
      setRedoStack([]);
      const nextState = await host.createTopology();
      await refreshFixtures();
      commitLoadedState(nextState);
      flash('Created topology');
    } finally {
      setLoading(false);
    }
  }

  async function saveTopology() {
    if (!state || !host.saveState) return;
    await host.saveState(state);
    await refreshFixtures();
    flash('Saved topology');
  }

  async function revertTopology() {
    if (!state || !host.revertState) return;
    setLoading(true);
    try {
      setSelectedObjects([]);
      setUndoStack([]);
      setRedoStack([]);
      const nextState = await host.revertState(state);
      await refreshFixtures();
      commitLoadedState(nextState);
      flash(selectedFixture?.kind === 'saved' ? 'Removed saved topology' : 'Reverted template');
    } finally {
      setLoading(false);
    }
  }

  async function exportImage() {
    const target = previewRef.current?.querySelector('.topoviewer') as HTMLElement | null;
    await exportPreviewImage({
      flash,
      hasExportBlockers,
      host,
      setExportStatus,
      state,
      target,
      themeMode: themeMode || 'dark',
      visibleDocument
    });
  }

  async function downloadYamlBundle() {
    await downloadYamlBundleAction({
      draftMapperText,
      draftStylesheetText,
      draftTopologyText,
      flash,
      host,
      setDraftValidation,
      state,
      visibleDocument
    });
  }

  async function copyYamlToClipboard() {
    await copyTextToClipboard(editorLabel, editorValue, flash);
  }

  function openDiagnostic(diagnostic: WebviewDiagnostic) {
    setMode('yaml');
    setTab(diagnostic.document === 'mapper' ? 2 : diagnostic.document === 'stylesheet' ? 1 : 0);
    setPendingYamlFocus({
      column: diagnostic.column || 1,
      document: diagnostic.document || 'topology',
      lineNumber: diagnostic.line || 1
    });
  }

  async function applyYamlDraft() {
    if (!state) return;
    const draftState = {
      ...state,
      mapperText: draftMapperText,
      topologyText: draftTopologyText,
      stylesheetText: draftStylesheetText
    };
    const result = await host.validate(draftState);
    setDraftValidation(result);
    if (result.diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      flash('Fix YAML diagnostics before applying');
      return;
    }
    setUndoStack((stack) => [...stack, {
      label: 'Apply YAML draft',
      previousTopologyText: state.topologyText,
      previousStylesheetText: state.stylesheetText,
      previousMapperText: state.mapperText,
      nextTopologyText: draftTopologyText,
      nextStylesheetText: draftStylesheetText,
      nextMapperText: draftMapperText
    }]);
    setRedoStack([]);
    setState(draftState);
    setValidation(result);
    setSelectedLayerIds((current) => mergeLayerSelection(current, result.layers));
    flash('Applied YAML draft');
  }

  function revertYamlDraft() {
    if (!state) return;
    setDraftTopologyText(state.topologyText);
    setDraftStylesheetText(state.stylesheetText);
    setDraftMapperText(state.mapperText || '');
    setDraftValidation(validation);
    flash('Reverted YAML draft');
  }

  function styleSelectionInYaml() {
    if (!selectedPrimary || !state) {
      flash('Select an object to style');
      return;
    }
    const selector = stylesheetSelectorForSelection(selectedPrimary);
    const result = ensureStyleRule(state.stylesheetText || '', selector);
    setMode('yaml');
    setTab(1);
    setPendingYamlFocus(result.focus);
    if (!result.inserted) {
      flash(`Focused ${selector}`);
      return;
    }
    applyDocumentTransaction('Create style rule', () => ({
      stylesheetText: result.text
    }));
  }
  useBrowserHarnessActions(host, { selectObject });
  function openRelationshipComposer(kind: 'link' | 'path') {
    const selectedNodes = selectedGraphNodeIds;
    setRelationshipComposer(kind);
    if (kind === 'link') {
      if (selectedNodes.length >= 2) {
        setLinkSourceId(selectedNodes[0]);
        setLinkTargetId(selectedNodes[1]);
      } else {
        const graphNodeIds = graphNodes.map((node) => node.id).filter(Boolean);
        const source = selectedNodes[0] || (graphNodeIds.includes(linkSourceId) ? linkSourceId : '') || graphNodeIds[0] || '';
        setLinkSourceId(source);
        setLinkTargetId(graphNodeIds.includes(linkTargetId) && linkTargetId !== source ? linkTargetId : graphNodeIds.find((id) => id !== source) || '');
      }
      return;
    }
    if (selectedNodes.length >= 2) {
      setPathSourceId(selectedNodes[0]);
      setPathTargetId(selectedNodes[selectedNodes.length - 1]);
      setPathTransitIds(selectedNodes.slice(1, -1));
    } else {
      setPathSourceId((current) => current || graphNodes[0]?.id || '');
      setPathTargetId((current) => current || graphNodes.find((node) => node.id !== (selectedNodes[0] || pathSourceId || graphNodes[0]?.id))?.id || '');
      setPathTransitIds([]);
    }
    setPathTransitCandidate('');
  }

  function insertObject(type: InsertObjectType) {
    if (type === 'link' || type === 'path') {
      openRelationshipComposer(type);
      return;
    }
    setTab(0);
    applyTopologyTransaction(`Insert ${type}`, (topologyText) => insertTopoObject(topologyText, {
      type,
      selectedLayerIds: layersForInsertObjectType(type, selectedLayerIds),
      selectedObjects
    }));
  }

  function placeCanvasNode(position: CanvasAuthoringPoint) {
    setTab(0);
    placeCanvasNodeAction({ applyTopologyTransaction, position, selectedLayerIds, setSelectedObjects });
  }

  function createCanvasConnection(connection: TopoViewerConnectionCreate) {
    if (hasErrors) return;
    setTab(0);
    createCanvasConnectionAction({ applyTopologyTransaction, connection, selectedLayerIds, setSelectedObjects });
  }

  function createCanvasPath(sequence: string[]) {
    if (hasErrors) return;
    setTab(0);
    createCanvasPathAction({ applyTopologyTransaction, selectedLayerIds, sequence, setSelectedObjects });
  }

  function createCanvasRegion(members: string[], bounds?: CanvasAuthoringRect) {
    if (hasErrors) return;
    setTab(0);
    createCanvasRegionAction({ applyTopologyTransaction, bounds, members, selectedLayerIds, setSelectedObjects });
  }

  function createConnection() {
    setTab(0);
    applyTopologyTransaction('Create connection', (topologyText) => upsertGraphLink(topologyText, {
      selectedLayerIds: layersForInsertObjectType('link', selectedLayerIds),
      source: linkSourceId,
      target: linkTargetId
    }));
  }

  function createPath() {
    setTab(0);
    applyTopologyTransaction('Create path', (topologyText) => upsertGraphPath(topologyText, {
      selectedLayerIds: layersForInsertObjectType('path', selectedLayerIds),
      sequence: sequenceFromControls(pathSourceId, pathTransitIds, pathTargetId)
    }));
  }

  function applyRelationshipInspector() {
    if (!selectedPrimary) return;
    setTab(0);
    if (selectedPrimary.kind === 'link') {
      applyTopologyTransaction('Update link endpoints', (topologyText) => upsertGraphLink(topologyText, {
        id: selectedPrimary.id,
        name: inspectorName,
        selectedLayerIds,
        source: linkSourceId,
        target: linkTargetId
      }));
      return;
    }
    if (selectedPrimary.kind === 'path') {
      applyTopologyTransaction('Update path sequence', (topologyText) => upsertGraphPath(topologyText, {
        id: selectedPrimary.id,
        name: inspectorName,
        selectedLayerIds: layersForInsertObjectType('path', selectedLayerIds),
        sequence: sequenceFromControls(pathSourceId, pathTransitIds, pathTargetId)
      }));
    }
  }

  function addPathTransitNode() {
    if (!pathTransitCandidate || pathTransitIds.includes(pathTransitCandidate)) return;
    if (pathTransitCandidate === pathSourceId || pathTransitCandidate === pathTargetId) return;
    setPathTransitIds((current) => [...current, pathTransitCandidate]);
    setPathTransitCandidate('');
  }

  function movePathTransitNode(index: number, direction: -1 | 1) {
    setPathTransitIds((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function removePathTransitNode(id: string) {
    setPathTransitIds((current) => current.filter((candidate) => candidate !== id));
  }

  function insertPreset(preset: TopoObjectPreset) {
    setTab(0);
    applyTopologyTransaction(`Insert preset ${preset.name}`, (topologyText) => insertTopoPreset(topologyText, {
      preset,
      selectedLayerIds: layersForPresetKind(preset.kind, selectedLayerIds),
      selectedObjects
    }));
  }

  function handleNodePositionChange(change: TopoViewerNodePositionChange) {
    if (hasErrors) return;
    const selection: TopoObjectSelection = { kind: 'node', id: change.id };
    const node = findObject(visibleDocument, selection);
    if (!node || sameRoundedPosition(positionOf(node.position), change.position)) return;
    setTab(0);
    applyTopologyTransaction('Move node', (topologyText) => updateGraphNodePosition(topologyText, {
      nodeId: change.id,
      position: change.position
    }));
  }

  function saveSelectionAsPreset() {
    if (!selectedPrimary || !selectedPrimaryObject) return;
    const nextPreset = presetFromObject(selectedPrimary, selectedPrimaryObject, presetName.trim());
    setSavedPresets((current) => [...current, nextPreset]);
    flash(`Saved preset ${nextPreset.name}`);
  }

  function applyInspector() {
    if (!selectedPrimary) return;
    setTab(0);
    applyTopologyTransaction('Update properties', (topologyText) => updateTopoObject(topologyText, {
      selection: selectedPrimary,
      name: inspectorName,
      layerId: inspectorLayerId,
      members: selectedPrimary.kind === 'region' ? regionMemberIds : undefined,
      position: inspectorX && inspectorY ? { x: Number(inspectorX), y: Number(inspectorY) } : undefined
    }));
  }

  function updateKeyValueRow(kind: 'labels' | 'data', rowId: string, patch: Partial<KeyValueEditorRow>) {
    const updateRows = kind === 'labels' ? setLabelRows : setDataRows;
    updateRows((current) => current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  }

  function addKeyValueRow(kind: 'labels' | 'data') {
    const updateRows = kind === 'labels' ? setLabelRows : setDataRows;
    updateRows((current) => [...current, {
      id: `${kind}-new-${Date.now()}`,
      key: '',
      value: ''
    }]);
  }

  function removeKeyValueRow(kind: 'labels' | 'data', rowId: string) {
    const updateRows = kind === 'labels' ? setLabelRows : setDataRows;
    updateRows((current) => {
      const next = current.filter((row) => row.id !== rowId);
      return next.length ? next : [{ id: `${kind}-new-${Date.now()}`, key: '', value: '' }];
    });
  }

  function applyKeyValueRows(kind: 'labels' | 'data') {
    if (!selectedPrimary) return;
    const rows = kind === 'labels' ? labelRows : dataRows;
    const record = recordFromRows(rows);
    setTab(0);
    applyTopologyTransaction(`Update ${kind}`, (topologyText) => updateTopoObject(topologyText, {
      selection: selectedPrimary,
      ...(kind === 'labels'
        ? { labelsReplace: record }
        : { dataReplace: record })
      }));
  }

  function deleteSelection() {
    if (!selectedObjects.length) return;
    setTab(0);
    const deletion = [...selectedObjects];
    applyTopologyTransaction('Delete selection', (topologyText) => deleteTopoObjects(topologyText, deletion));
    setSelectedObjects([]);
  }

  function applyAttentionFocus(ids = attentionFocusId ? [attentionFocusId] : [], focusKind = attentionFocusKind) {
    if (!ids.length) return;
    setTab(0);
    applyTopologyTransaction('Update attention focus', (topologyText) => updateAttentionFocus(topologyText, {
      focusKind,
      ids,
      mode: attentionMode
    }));
  }

  function applyAttentionMatcher(kind: 'labels' | 'data') {
    const key = (kind === 'labels' ? attentionLabelKey : attentionDataKey).trim();
    const value = (kind === 'labels' ? attentionLabelValue : attentionDataValue).trim();
    if (!key) return;
    setTab(0);
    applyTopologyTransaction(`Update attention ${kind}`, (topologyText) => updateAttentionMatcher(topologyText, {
      matcherKind: kind,
      key,
      value,
      mode: attentionMode
    }));
  }

  function useSelectionForAttention() {
    const focusKind = selectedObjects.length ? focusKindForSelection(selectedObjects[0].kind) : undefined;
    if (!focusKind) {
      flash('Select nodes, links, paths, or regions first');
      return;
    }
    const ids = selectedObjects
      .filter((selection) => focusKindForSelection(selection.kind) === focusKind)
      .map((selection) => selection.id);
    setAttentionFocusKind(focusKind);
    setAttentionFocusId(ids[0] || '');
    applyAttentionFocus(ids, focusKind);
  }

  function applyInteraction() {
    setTab(0);
    applyTopologyTransaction('Update attention interaction', (topologyText) => updateAttentionInteraction(
      topologyText,
      attentionInteractive,
      attentionClickMode
    ));
  }

  function applyAggregation() {
    const regionId = attentionRegionId || (visibleDocument?.graph?.regions || [])[0]?.id;
    if (!regionId) return;
    setTab(0);
    applyTopologyTransaction('Update attention aggregation', (topologyText) => updateAttentionRegionAggregation(
      topologyText,
      [regionId],
      attentionExpandOnClick
    ));
  }

  function applyLinkGrouping() {
    setTab(0);
    applyTopologyTransaction('Update link grouping', (topologyText) => updateAttentionLinkGrouping(
      topologyText,
      Math.max(2, Number(linkGroupingThreshold || 2))
    ));
  }

  function resetAttention() {
    setTab(0);
    applyTopologyTransaction('Clear attention', (topologyText) => clearAttention(topologyText));
  }

  const authoringRailProps = {
    HarnessTabPanel, activeDiagnostics, activeModeIndex, addKeyValueRow, addPathTransitNode, a11yProps, applyAggregation,
    applyAttentionFocus, applyAttentionMatcher, applyInspector, applyInteraction, applyKeyValueRows, applyLinkGrouping,
    applyRelationshipInspector, attentionClickMode, attentionDataKey, attentionDataValue, attentionExpandOnClick,
    attentionFocusId, attentionFocusKind, attentionInteractive, attentionLabelKey, attentionLabelValue, attentionMode,
    attentionRegionId, attentionSummary, applyYamlDraft, availableFocusIds, copyYamlToClipboard, createConnection, createPath,
    createTopology, currentAttention, dataRows, deleteSelection, editorLabel, editorTheme, editorValue, fixtures,
    focusKindLabel, graphNodes, handleEditorMount, harnessModes, hasErrors, host, insertObject, insertObjectGroups, insertMapperPreset,
    insertMapperRuleFromBuilder, insertPreset, inspectorLayerId, inspectorName, inspectorX, inspectorY, labelRows, linkGroupingThreshold,
    linkSourceId, linkTargetId, mapperCoveragePreview, mode, modeIndex, modeLabel, movePathTransitNode, nodeNameById, openDiagnostic, pathSourceId,
    pathTargetId, pathTransitCandidate, pathTransitIds, pathTransitOptions, presetName, relationshipComposer, mapperPickers,
    mapperRuleBuilder,
    regionMemberIds, reloadFixture, removeKeyValueRow, removePathTransitNode, resetAttention, revertTopology, revertYamlDraft, saveSelectionAsPreset,
    saveTopology, selectedFixture, selectedLayerIds, selectedObjects, selectedPrimary, selectionSummary,
    setAttentionClickMode, setAttentionDataKey, setAttentionDataValue, setAttentionExpandOnClick, setAttentionFocusId,
    setAttentionFocusKind, setAttentionInteractive, setAttentionLabelKey, setAttentionLabelValue, setAttentionMode,
    setAttentionRegionId, setInspectorLayerId, setInspectorName, setInspectorX, setInspectorY, setLinkGroupingThreshold,
    setLinkSourceId, setLinkTargetId, setMode, setPathSourceId, setPathTargetId, setPathTransitCandidate, setRegionMemberIds,
    setDraftMapperText, setDraftStylesheetText, setDraftTopologyText, setPresetName, setRelationshipComposer, setSelectedLayerIds, setTab, showYamlSuggestions, state,
    statusSeverity, statusSummary, styleSelectionInYaml, tab, updateKeyValueRow, useSelectionForAttention,
    updateMapperRuleBuilder, validation, visibleDocument, draftDirty, downloadYamlBundle, yamlAssistEmptyMessage
  };

  return (
    <Box className={shellClassName} data-color-mode={themeMode} sx={webviewShellSx}>
      {parityMode ? null : (
        <ShellHeader host={host} nextThemeMode={nextThemeMode} onToggleThemeMode={onToggleThemeMode} themeMode={themeMode} />
      )}

      {parityMode ? (
          <PreviewPanel exportImage={exportImage} exportTooltip={exportTooltip} createCanvasConnection={createCanvasConnection} createCanvasPath={createCanvasPath} createCanvasRegion={createCanvasRegion} handleNodePositionChange={handleNodePositionChange} handleObjectClick={handleObjectClick} hasErrors={appliedHasErrors} hasExportBlockers={hasExportBlockers} loading={loading} parityMode placeCanvasNode={placeCanvasNode} previewRef={previewRef} redoStack={redoStack} redoTopology={redoTopology} selectedLayerIds={selectedLayerIds} selectedObjectIds={[]} setSelectedLayerIds={setSelectedLayerIds} setSelectedObjects={setSelectedObjects} undoStack={undoStack} undoTopology={undoTopology} visibleDocument={visibleDocument} />
      ) : (
        <Box
          ref={workspaceRef}
          className={`topoviewer-vscode-workspace${resizing ? ' topoviewer-vscode-workspace--resizing' : ''}`}
          style={{ '--topoviewer-vscode-rail-width': `${splitPercent}%` } as CSSProperties}
        >
          <AuthoringRail {...authoringRailProps} />

          <ResizeDivider clamp={clamp} defaultSplitPercent={defaultSplitPercent} maxSplitPercent={maxSplitPercent} minSplitPercent={minSplitPercent} setResizing={setResizing} setSplitPercent={setSplitPercent} splitPercent={splitPercent} updateSplitFromClientX={updateSplitFromClientX} />

          <PreviewPanel exportImage={exportImage} exportTooltip={exportTooltip} createCanvasConnection={createCanvasConnection} createCanvasPath={createCanvasPath} createCanvasRegion={createCanvasRegion} handleNodePositionChange={handleNodePositionChange} handleObjectClick={handleObjectClick} hasErrors={appliedHasErrors} hasExportBlockers={hasExportBlockers} loading={loading} placeCanvasNode={placeCanvasNode} previewRef={previewRef} redoStack={redoStack} redoTopology={redoTopology} selectedLayerIds={selectedLayerIds} selectedObjectIds={previewSelectedObjectIds} setSelectedLayerIds={setSelectedLayerIds} setSelectedObjects={setSelectedObjects} undoStack={undoStack} undoTopology={undoTopology} visibleDocument={visibleDocument} />
        </Box>
      )}
    </Box>
  );
}
