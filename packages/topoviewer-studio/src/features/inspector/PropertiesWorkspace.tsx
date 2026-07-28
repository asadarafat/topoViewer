import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { authoringObjectSourcePath, findAuthoringObject, type AuthoringObjectSelection } from 'topoviewer/authoring';
import type { StudioSessionSnapshot } from '../../contracts/project';
import type { StudioIdentityRenamePreview } from '../../contracts/inspector';
import type { StudioStyleEditRequest, StudioStyleUnsetRequest } from '../../contracts/inspector';
import type { StudioSourceRange, StudioStylesheetCandidateController, StudioStylesheetCandidateMode } from '../../session';
import type { StudioViewportPreferences } from '../viewport/types';
import { StudioAccordion, StudioAccordionDetails, StudioAccordionSummary, StudioTab, StudioTabs, StudioToggleButton, StudioToggleButtonGroup } from '../../ui/controls';
import { StudioPanelHeader } from '../../ui/StudioPanel';
import { EmbeddedProjectYamlEditor } from './EmbeddedTopologyYamlEditor';
import { Inspector } from './Inspector';
import { StyleCandidateFooter } from './StyleCandidateFooter';
import { StyleWorkspace } from './StyleWorkspace';
import { studioSpace } from '../../ui/muiSpacing';

export type PropertiesCodeDocument = 'stylesheet' | 'topology';

function documentFileName(path: string) {
  return path.split(/[\\/]/).filter(Boolean).at(-1) || path;
}

function EditSection({ children, icon, id, title }: { children: ReactNode; icon: ReactNode; id: string; title: string }) {
  const contentId = `${id}-content`;
  const headingId = `${id}-heading`;

  return (
    <StudioAccordion className="studio-edit-section" defaultExpanded>
      <StudioAccordionSummary aria-controls={contentId} className="studio-edit-section-heading" expandIcon={<ExpandMoreIcon fontSize="small" />} id={headingId}>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: studioSpace.space8
          }}
        >
          {icon}
          <Typography component="h3" variant="subtitle2">
            {title}
          </Typography>
        </Box>
      </StudioAccordionSummary>
      <StudioAccordionDetails aria-labelledby={headingId} id={contentId} sx={{ p: 0 }}>
        {children}
      </StudioAccordionDetails>
    </StudioAccordion>
  );
}

interface PropertiesWorkspaceProps {
  candidate: StudioStylesheetCandidateController;
  forceEditorFailure?: boolean;
  onApplySource(document: 'topology', text: string): boolean;
  onApplyStyle(): boolean;
  onCandidateTextChange(text: string): void;
  onCandidateTextReplace(text: string): void;
  onCommitObject(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void;
  onCommitViewport(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void;
  onCommitStyle(request: StudioStyleEditRequest): boolean;
  onCopyId(id: string): void;
  onPreviewObjectIdRename(selection: AuthoringObjectSelection, nextId: string): StudioIdentityRenamePreview;
  onRenameObjectId(selection: AuthoringObjectSelection, nextId: string): boolean;
  onUnsetObject(path: Array<string | number>, scopePath: Array<string | number>): void;
  onDiscardInvalid(document: 'topology'): void;
  onCollapse(): void;
  onRevertStyle(): boolean;
  onSelectSourceOffset(document: 'topology', offset: number): Array<string | number> | undefined;
  onUnsetStyle(request: StudioStyleUnsetRequest): boolean;
  onViewportPreferencesChange(patch: Partial<StudioViewportPreferences>): void;
  onCodeDocumentChange(document: PropertiesCodeDocument): void;
  snapshot: StudioSessionSnapshot;
  sourceRange(document: 'topology', path: Array<string | number>): StudioSourceRange | undefined;
  viewportPreferences: StudioViewportPreferences;
  codeDocument: PropertiesCodeDocument;
}

export function PropertiesWorkspace({
  candidate,
  forceEditorFailure = false,
  onApplySource,
  onApplyStyle,
  onCandidateTextChange,
  onCandidateTextReplace,
  onCommitObject,
  onCommitViewport,
  onCommitStyle,
  onCopyId,
  onCollapse,
  onDiscardInvalid,
  onPreviewObjectIdRename,
  onRenameObjectId,
  onRevertStyle,
  onSelectSourceOffset,
  onUnsetStyle,
  onUnsetObject,
  onViewportPreferencesChange,
  onCodeDocumentChange,
  snapshot,
  sourceRange,
  viewportPreferences,
  codeDocument
}: PropertiesWorkspaceProps) {
  const candidateState = useSyncExternalStore(candidate.subscribe, candidate.getSnapshot, candidate.getSnapshot);
  const [topologyDraft, setTopologyDraft] = useState<string>();
  const selection = snapshot.selection[0];
  const selectedObject = useMemo(() => findAuthoringObject(snapshot.projection.document, selection as AuthoringObjectSelection | undefined), [selection, snapshot.projection.document]);
  const selectedPath = useMemo(() => (selection ? authoringObjectSourcePath(snapshot.projection.document, selection as AuthoringObjectSelection) : undefined), [selection, snapshot.projection.document]);
  const selectionKey = selection ? `${selection.kind}:${selection.id}` : '';
  const previousSelectionKey = useRef(selectionKey);
  const topologyNavigationSequence = useRef(0);
  const [topologyNavigation, setTopologyNavigation] = useState(() => ({
    id: topologyNavigationSequence.current,
    path: selectedPath || ['graph']
  }));
  const [topologyCursorPath, setTopologyCursorPath] = useState<Array<string | number>>();
  const activeTopologyPath = topologyCursorPath || topologyNavigation.path;
  const activeTopologyRange = sourceRange('topology', activeTopologyPath);
  const selectionKinds = [...new Set(snapshot.selection.map((item) => item.kind))];
  const selectionLabel =
    snapshot.selection.length > 1
      ? `${snapshot.selection.length} ${selectionKinds.length === 1 ? `${selectionKinds[0]}s` : 'objects'}`
      : String(
          (selectedObject?.labels && typeof selectedObject.labels === 'object' && !Array.isArray(selectedObject.labels)
            ? (selectedObject.labels as Record<string, unknown>).name
            : undefined)
          || selectedObject?.title
          || selectedObject?.text
          || selection?.id
          || 'Canvas'
        );
  const selectionId = snapshot.selection.length > 1 ? snapshot.selection.map((item) => item.id).join(', ') : selection?.id || 'Viewport and interaction settings';

  useEffect(() => {
    const selectionChanged = previousSelectionKey.current !== selectionKey;
    previousSelectionKey.current = selectionKey;
    if (!selectionChanged || candidateState.mode !== 'yaml' || codeDocument !== 'topology' || !selectedPath) return;
    requestTopologyNavigation(selectedPath);
  }, [candidateState.mode, codeDocument, selectedPath, selectionKey]);

  function setMode(mode: StudioStylesheetCandidateMode) {
    if (mode === 'yaml') requestTopologyNavigation(selectedPath || ['graph']);
    candidate.setMode(mode);
    if (mode === 'yaml' && !selection) onCodeDocumentChange('topology');
  }

  function requestTopologyNavigation(path: Array<string | number>) {
    setTopologyCursorPath(undefined);
    setTopologyNavigation({
      id: ++topologyNavigationSequence.current,
      path
    });
  }

  function selectCodeDocument(document: PropertiesCodeDocument) {
    if (document === 'topology' && codeDocument !== 'topology') {
      requestTopologyNavigation(selectedPath || ['graph']);
    }
    onCodeDocumentChange(document);
  }

  function rememberTopologyDraft(text: string) {
    const canonical = snapshot.project.documents.topology.text;
    setTopologyDraft(text === canonical ? undefined : text);
  }

  function applyTopologyDocument(text: string) {
    const applied = onApplySource('topology', text);
    if (applied) setTopologyDraft(undefined);
    return applied;
  }

  return (
    <Box
      aria-label="Properties workspace"
      className="studio-properties-workspace"
      component="aside"
      data-mode={candidateState.mode}
      sx={{
        bgcolor: 'background.paper',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gridTemplateRows: candidateState.mode === 'yaml' ? 'auto minmax(0, 1fr) auto' : 'auto auto minmax(0, 1fr) auto',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden'
      }}
    >
      <StudioPanelHeader
        actions={
          <StudioToggleButtonGroup
            aria-label="Properties representation"
            className="studio-edit-representation"
            onChange={(_event, value: StudioStylesheetCandidateMode | null) => {
              if (value) setMode(value);
            }}
            value={candidateState.mode}
          >
            <StudioToggleButton sx={{ px: studioSpace.space6 }} value="basic">
              Visual
            </StudioToggleButton>
            <StudioToggleButton sx={{ px: studioSpace.space6 }} value="yaml">
              Code
            </StudioToggleButton>
          </StudioToggleButtonGroup>
        }
        onCollapse={onCollapse}
        title="Properties"
      />

      {candidateState.mode === 'basic' ? (
        <Stack
          className="studio-edit-selection-summary"
          direction="row"
          spacing={studioSpace.space8}
          sx={{
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            minHeight: 48,
            minWidth: 0,
            px: studioSpace.space12,
            py: studioSpace.space6
          }}
        >
          <Avatar aria-hidden="true" sx={{ bgcolor: 'primary.main', height: 32, width: 32 }} variant="rounded">
            {(selection?.kind || 'canvas').slice(0, 1).toLocaleUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography component="div" noWrap title={selectionLabel} variant="subtitle2">
              {selectionLabel}
            </Typography>
            <Typography color="text.secondary" component="div" noWrap title={selectionId} variant="caption">
              {selectionId}
            </Typography>
          </Box>
          {selection ? <Chip label={selection.kind} size="small" variant="outlined" /> : null}
        </Stack>
      ) : null}

      {candidateState.mode === 'basic' ? (
        <Box className="studio-edit-visual" component="section" sx={{ minHeight: 0, minWidth: 0, overflowY: 'auto' }}>
          {selection ? (
            <>
              <EditSection icon={<TuneOutlinedIcon fontSize="small" />} id="studio-edit-topology" title="Topology">
                <Inspector
                  ariaLabel="Topology properties"
                  documentView="object"
                  embedded
                  onCommit={onCommitObject}
                  onCommitViewport={onCommitViewport}
                  onCopyId={onCopyId}
                  onPreviewIdRename={onPreviewObjectIdRename}
                  onRenameId={onRenameObjectId}
                  onUnset={onUnsetObject}
                  onViewportPreferencesChange={onViewportPreferencesChange}
                  snapshot={snapshot}
                  viewportPreferences={viewportPreferences}
                />
              </EditSection>
              <EditSection icon={<PaletteOutlinedIcon fontSize="small" />} id="studio-edit-appearance" title="Appearance">
                <StyleWorkspace
                  candidate={candidate}
                  forceEditorFailure={forceEditorFailure}
                  onApply={onApplyStyle}
                  onCandidateTextChange={onCandidateTextChange}
                  onCandidateTextReplace={onCandidateTextReplace}
                  onCommit={onCommitStyle}
                  onRevert={onRevertStyle}
                  onUnset={onUnsetStyle}
                  showFooter={false}
                  showModeTabs={false}
                  showSummary={false}
                  snapshot={snapshot}
                />
              </EditSection>
            </>
          ) : (
            <Inspector
              ariaLabel="Canvas properties"
              documentView="viewport"
              embedded
              onCommit={onCommitObject}
              onCommitViewport={onCommitViewport}
              onCopyId={onCopyId}
              onPreviewIdRename={onPreviewObjectIdRename}
              onRenameId={onRenameObjectId}
              onUnset={onUnsetObject}
              onViewportPreferencesChange={onViewportPreferencesChange}
              snapshot={snapshot}
              viewportPreferences={viewportPreferences}
            />
          )}
        </Box>
      ) : (
        <Box
          className="studio-edit-code"
          component="section"
          sx={{
            display: 'grid',
            gridTemplateRows: 'auto minmax(0, 1fr)',
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden'
          }}
        >
          <StudioTabs aria-label="Code documents" onChange={(_event, value: PropertiesCodeDocument) => selectCodeDocument(value)} value={codeDocument} variant="fullWidth">
            <StudioTab label={documentFileName(snapshot.project.documents.topology.path)} title={snapshot.project.documents.topology.path} value="topology" />
            <StudioTab label={documentFileName(snapshot.project.documents.stylesheet.path)} title={snapshot.project.documents.stylesheet.path} value="stylesheet" />
          </StudioTabs>
          {codeDocument === 'topology' ? (
            <EmbeddedProjectYamlEditor
              document="topology"
              forceEditorFailure={forceEditorFailure}
              initialDraft={topologyDraft}
              key="topology"
              navigation={
                activeTopologyRange
                  ? {
                      id: `topology:${topologyNavigation.id}`,
                      range: activeTopologyRange
                    }
                  : undefined
              }
              onApply={applyTopologyDocument}
              onCursorOffset={(offset) => setTopologyCursorPath(onSelectSourceOffset('topology', offset))}
              onDiscardInvalid={() => onDiscardInvalid('topology')}
              onDraftChange={rememberTopologyDraft}
              snapshot={snapshot}
            />
          ) : (
            <StyleWorkspace
              candidate={candidate}
              forceEditorFailure={forceEditorFailure}
              onApply={onApplyStyle}
              onCandidateTextChange={onCandidateTextChange}
              onCandidateTextReplace={onCandidateTextReplace}
              onCommit={onCommitStyle}
              onRevert={onRevertStyle}
              onUnset={onUnsetStyle}
              showFooter={false}
              showModeTabs={false}
              showSummary={false}
              snapshot={snapshot}
            />
          )}
        </Box>
      )}
      {candidateState.mode === 'basic' || codeDocument === 'stylesheet' ? <StyleCandidateFooter candidate={candidate} onApply={onApplyStyle} onRevert={onRevertStyle} /> : null}
    </Box>
  );
}
