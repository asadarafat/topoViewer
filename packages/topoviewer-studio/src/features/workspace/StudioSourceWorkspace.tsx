import {
  lazy,
  memo,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import CodeIcon from '@mui/icons-material/Code';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import FormatAlignLeftOutlinedIcon from '@mui/icons-material/FormatAlignLeftOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type {
  StudioDocumentKind,
  StudioSessionSnapshot
} from '../../contracts/project';
import type {
  StudioSourceDraftController,
  StudioStylesheetCandidateController
} from '../../session';
import { parseStudioSource } from '../../session/yamlSource';
import {
  StudioButton,
  StudioCircularProgress,
  StudioDialog,
  StudioDialogActions,
  StudioDialogContent,
  StudioDialogTitle,
  StudioIconButton
} from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';
import {
  studioMuiCodeTypography,
  studioMuiIconSize
} from '../../ui/createStudioTheme';
import type {
  MonacoYamlEditorHandle,
  MonacoYamlNavigationRequest
} from './MonacoYamlEditor';
import { YamlEditorBoundary } from './YamlEditorBoundary';
import {
  createStudioSourceDocumentModel,
  studioStylesheetCandidateRangeForSelection
} from './sourceDocumentModel';
import { createStudioYamlAssist } from './yamlAssist';

const MonacoYamlEditor = lazy(() => import('./MonacoYamlEditor'));
const schemaNames: Record<StudioDocumentKind, string> = {
  mapper: 'topoviewer-mapper.schema.json',
  stylesheet: 'topoviewer-stylesheet.schema.json',
  topology: 'topoviewer-topology.schema.json'
};

interface StudioSourceWorkspaceProps {
  activeDocument: StudioDocumentKind;
  candidate: StudioStylesheetCandidateController;
  forceEditorFailure?: boolean;
  navigation?: MonacoYamlNavigationRequest;
  onApplySource(document: 'mapper' | 'topology', text: string): boolean;
  onApplyStyle(): boolean;
  onCreateMapper(): void;
  onDiscardInvalid(document: 'mapper' | 'topology'): void;
  onRevertStyle(): boolean;
  onSelectSourceOffset(document: StudioDocumentKind, offset: number): void;
  snapshot: StudioSessionSnapshot;
  sourceDrafts: StudioSourceDraftController;
}

function EditorFailureProbe(): never {
  throw new Error('Intentional Studio source editor failure.');
}

function StudioSourceWorkspaceComponent({
  activeDocument,
  candidate,
  forceEditorFailure = false,
  navigation,
  onApplySource,
  onApplyStyle,
  onCreateMapper,
  onDiscardInvalid,
  onRevertStyle,
  onSelectSourceOffset,
  snapshot,
  sourceDrafts
}: StudioSourceWorkspaceProps) {
  const candidateState = useSyncExternalStore(
    candidate.subscribe,
    candidate.getSnapshot,
    candidate.getSnapshot
  );
  const sourceDraftState = useSyncExternalStore(
    sourceDrafts.subscribe,
    sourceDrafts.getSnapshot,
    sourceDrafts.getSnapshot
  );
  const model = createStudioSourceDocumentModel(
    activeDocument,
    snapshot,
    candidateState,
    sourceDraftState
  );
  const [cursorOffset, setCursorOffset] = useState(0);
  const [formatOpen, setFormatOpen] = useState(false);
  const [requestedNavigation, setRequestedNavigation] = useState<
    MonacoYamlNavigationRequest | undefined
  >(navigation);
  const editorRef = useRef<MonacoYamlEditorHandle>(null);
  const navigationSequence = useRef(0);
  const assist = useMemo(
    () => createStudioYamlAssist(snapshot.project, snapshot.projection.document),
    [snapshot.project, snapshot.projection.document]
  );
  const value = model.text;
  const syntax = useMemo(
    () =>
      activeDocument !== 'stylesheet' &&
      sourceDraftState.drafts[activeDocument] !== undefined
        ? parseStudioSource(activeDocument, value)
        : undefined,
    [activeDocument, sourceDraftState.drafts, value]
  );
  const diagnostics =
    syntax && !syntax.ok
      ? syntax.diagnostics
      : model.diagnostics;
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  const matchingStyleRuleRange =
    activeDocument === 'stylesheet'
      ? studioStylesheetCandidateRangeForSelection(candidateState, snapshot.selection)
      : undefined;
  const dirty =
    activeDocument === 'stylesheet'
      ? candidateState.dirty
      : model.dirty;
  const cursorPosition = useMemo(() => {
    const beforeCursor = value.slice(0, Math.max(0, Math.min(cursorOffset, value.length)));
    const lines = beforeCursor.split('\n');
    return {
      column: (lines.at(-1)?.length || 0) + 1,
      line: lines.length
    };
  }, [cursorOffset, value]);

  useEffect(() => {
    if (navigation) setRequestedNavigation(navigation);
  }, [navigation]);

  useEffect(() => {
    if (activeDocument === 'stylesheet') return;
    const sessionText =
      snapshot.invalidDrafts[activeDocument]?.text ||
      snapshot.project.documents[activeDocument]?.text ||
      '';
    sourceDrafts.reconcile(activeDocument, sessionText);
  }, [
    activeDocument,
    snapshot.invalidDrafts,
    snapshot.project.documents,
    sourceDrafts
  ]);

  function update(value: string) {
    if (activeDocument === 'stylesheet') {
      candidate.replaceRawText(value);
      return;
    }
    const sessionText =
      snapshot.invalidDrafts[activeDocument]?.text ||
      snapshot.project.documents[activeDocument]?.text ||
      '';
    sourceDrafts.replace(activeDocument, value, sessionText);
  }

  function apply() {
    if (activeDocument === 'stylesheet') {
      onApplyStyle();
      return;
    }
    if (!model.exists) {
      onCreateMapper();
      return;
    }
    if (onApplySource(activeDocument, value)) {
      sourceDrafts.clear(activeDocument);
    }
  }

  function revert() {
    if (activeDocument === 'stylesheet') {
      onRevertStyle();
      return;
    }
    if (snapshot.invalidDrafts[activeDocument]) {
      onDiscardInvalid(activeDocument);
    }
    sourceDrafts.clear(activeDocument);
  }

  function formatSource() {
    const syntax = parseStudioSource(activeDocument, value);
    if (!syntax.ok) return;
    const formatted = String(syntax.source.document);
    const text =
      syntax.source.lineEnding === '\r\n'
        ? formatted.replace(/(?<!\r)\n/g, '\r\n')
        : formatted;
    if (activeDocument === 'stylesheet') {
      candidate.replaceStructuredText(text);
    } else {
      update(text);
    }
    setFormatOpen(false);
  }

  return (
    <Box
      aria-label={`${model.label} YAML workspace`}
      component="section"
      sx={{
        bgcolor: 'background.paper',
        display: 'grid',
        gridTemplateRows: model.exists
          ? '32px minmax(0, 1fr) 24px'
          : 'minmax(0, 1fr) 24px',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden'
      }}
    >
      {model.exists ? (
        <Box
          aria-label="YAML editor tools"
          role="toolbar"
          sx={{
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            gap: studioSpace.space2,
            justifyContent: 'flex-end',
            minWidth: 0,
            overflow: 'hidden',
            px: studioSpace.space6
          }}
        >
          <StudioIconButton
            aria-label={`Search ${model.label} YAML`}
            onClick={() => editorRef.current?.find()}
            sx={{ flexShrink: 0, height: 28, width: 28 }}
            title="Search"
          >
            <SearchOutlinedIcon sx={{ fontSize: studioMuiIconSize.compact }} />
          </StudioIconButton>
          <StudioIconButton
            aria-label="Show YAML context help"
            onClick={() => editorRef.current?.showContextHelp()}
            sx={{ flexShrink: 0, height: 28, width: 28 }}
            title="YAML context help · Ctrl+Space for completions"
          >
            <HelpOutlineIcon sx={{ fontSize: studioMuiIconSize.compact }} />
          </StudioIconButton>
          {activeDocument === 'stylesheet' ? (
            <StudioIconButton
              aria-label="Go to matching object rule"
              disabled={!matchingStyleRuleRange}
              onClick={() => {
                if (!matchingStyleRuleRange) return;
                setRequestedNavigation({
                  focus: true,
                  id: `matching-rule:${++navigationSequence.current}`,
                  range: matchingStyleRuleRange
                });
              }}
              sx={{ flexShrink: 0, height: 28, width: 28 }}
              title="Go to matching object rule"
            >
              <FindInPageOutlinedIcon sx={{ fontSize: studioMuiIconSize.compact }} />
            </StudioIconButton>
          ) : null}
          <StudioIconButton
            aria-label={`Format ${model.label} YAML`}
            disabled={
              Boolean(syntax && !syntax.ok) ||
              (activeDocument === 'stylesheet' &&
                (candidateState.status === 'validating' ||
                  candidateState.status === 'invalid-dirty'))
            }
            onClick={() => setFormatOpen(true)}
            sx={{ flexShrink: 0, height: 28, width: 28 }}
            title={`Format ${model.label} YAML`}
          >
            <FormatAlignLeftOutlinedIcon sx={{ fontSize: studioMuiIconSize.compact }} />
          </StudioIconButton>
        </Box>
      ) : null}

      {!model.exists ? (
        <Stack
          sx={{
            alignItems: 'flex-start',
            justifyContent: 'center',
            p: studioSpace.space24
          }}
          spacing={studioSpace.space10}
        >
          <Typography component="h3" variant="subtitle1">
            mapper.yaml is not part of this project
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Create the first telemetry rule visually, then refine the generated mapper source here.
          </Typography>
          <StudioButton onClick={onCreateMapper} variant="contained">
            Configure mapper
          </StudioButton>
        </Stack>
      ) : (
        <YamlEditorBoundary document={activeDocument} onChange={update} value={value}>
          {forceEditorFailure ? (
            <EditorFailureProbe />
          ) : (
            <Suspense
              fallback={
                <Stack
                  aria-busy="true"
                  direction="row"
                  spacing={studioSpace.space8}
                  sx={{ alignItems: 'center', justifyContent: 'center' }}
                >
                  <StudioCircularProgress />
                  <Typography variant="body2">Loading YAML editor...</Typography>
                </Stack>
              }
            >
              <MonacoYamlEditor
                assist={assist}
                diagnostics={diagnostics}
                document={activeDocument}
                modelPath={`inmemory://topoviewer-studio/${snapshot.project.id}/${model.path}`}
                navigation={requestedNavigation}
                onChange={update}
                onCursorOffset={(offset) => {
                  setCursorOffset(offset);
                  onSelectSourceOffset(activeDocument, offset);
                }}
                ref={editorRef}
                value={value}
              />
            </Suspense>
          )}
        </YamlEditorBoundary>
      )}

      <Box
        aria-label="YAML editor status"
        role="group"
        sx={{
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          alignItems: 'center',
          display: 'grid',
          gap: studioSpace.space8,
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          minWidth: 0,
          overflow: 'hidden',
          px: studioSpace.space8
        }}
      >
        <Box
          sx={{
            alignItems: 'center',
            color: errors.length ? 'error.main' : 'success.main',
            display: 'flex',
            gap: studioSpace.space4,
            minWidth: 0,
            overflow: 'hidden'
          }}
        >
          {errors.length ? (
            <ReportProblemOutlinedIcon sx={{ fontSize: studioMuiIconSize.compact }} />
          ) : (
            <CheckCircleOutlineIcon sx={{ fontSize: studioMuiIconSize.compact }} />
          )}
          <Typography
            color="text.secondary"
            noWrap
            sx={{ minWidth: 0 }}
            title={schemaNames[activeDocument]}
            variant="caption"
          >
            {errors.length
              ? `${errors.length} ${errors.length === 1 ? 'error' : 'errors'}`
              : 'Valid'}
          </Typography>
        </Box>
        <Box sx={{ alignItems: 'center', display: 'flex', flexShrink: 0, gap: studioSpace.space4 }}>
          {dirty ? (
            <>
            <StudioButton
              aria-label={model.revertLabel}
              disabled={!dirty}
              onClick={revert}
              sx={{ flexShrink: 0, minHeight: 20, minWidth: 0, px: studioSpace.space6 }}
            >
              Revert
            </StudioButton>
            <StudioButton
              aria-label={model.applyLabel}
              disabled={
                model.exists &&
                (!dirty ||
                  (activeDocument === 'stylesheet' &&
                    (candidateState.status === 'validating' ||
                      candidateState.status === 'invalid-dirty')))
              }
              onClick={apply}
              sx={{ flexShrink: 0, minHeight: 20, minWidth: 0, px: studioSpace.space6 }}
              variant="contained"
            >
              Apply
            </StudioButton>
            </>
          ) : null}
          <Typography
            color="text.secondary"
            noWrap
            sx={{ ...studioMuiCodeTypography, flexShrink: 0 }}
          >
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </Typography>
        </Box>
      </Box>
      <StudioDialog
        aria-labelledby="studio-format-source-title"
        onClose={() => setFormatOpen(false)}
        open={formatOpen}
      >
        <StudioDialogTitle id="studio-format-source-title">
          Format {model.label.toLocaleLowerCase()} YAML?
        </StudioDialogTitle>
        <StudioDialogContent>
          <Typography variant="body2">
            Formatting can normalize indentation, quoting, and flow-style YAML.
            The source remains unapplied until you select Apply.
          </Typography>
        </StudioDialogContent>
        <StudioDialogActions>
          <StudioButton onClick={() => setFormatOpen(false)}>Cancel</StudioButton>
          <StudioButton onClick={formatSource} variant="contained">
            <CodeIcon fontSize="small" />
            Format
          </StudioButton>
        </StudioDialogActions>
      </StudioDialog>
    </Box>
  );
}

function sameSelection(
  previous: StudioSessionSnapshot['selection'],
  next: StudioSessionSnapshot['selection']
) {
  return previous.length === next.length
    && previous.every((selection, index) => (
      selection.id === next[index]?.id && selection.kind === next[index]?.kind
    ));
}

function sameSourceWorkspaceProps(
  previous: StudioSourceWorkspaceProps,
  next: StudioSourceWorkspaceProps
) {
  return previous.activeDocument === next.activeDocument
    && previous.candidate === next.candidate
    && previous.forceEditorFailure === next.forceEditorFailure
    && previous.navigation?.id === next.navigation?.id
    && previous.onApplySource === next.onApplySource
    && previous.onApplyStyle === next.onApplyStyle
    && previous.onCreateMapper === next.onCreateMapper
    && previous.onDiscardInvalid === next.onDiscardInvalid
    && previous.onRevertStyle === next.onRevertStyle
    && previous.onSelectSourceOffset === next.onSelectSourceOffset
    && previous.snapshot.project === next.snapshot.project
    && previous.snapshot.projection === next.snapshot.projection
    && previous.snapshot.invalidDrafts === next.snapshot.invalidDrafts
    && previous.sourceDrafts === next.sourceDrafts
    && (
      next.activeDocument !== 'stylesheet'
      || sameSelection(previous.snapshot.selection, next.snapshot.selection)
    );
}

export const StudioSourceWorkspace = memo(
  StudioSourceWorkspaceComponent,
  sameSourceWorkspaceProps
);
StudioSourceWorkspace.displayName = 'StudioSourceWorkspace';
