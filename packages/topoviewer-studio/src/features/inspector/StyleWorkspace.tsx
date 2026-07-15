import {
  lazy,
  Suspense,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import CodeIcon from '@mui/icons-material/Code';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import FormatAlignLeftOutlinedIcon from '@mui/icons-material/FormatAlignLeftOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { StudioStylesheetCandidateController, StudioStylesheetCandidateMode } from '../../session';
import { candidateStyleRule } from '../../session';
import type { StudioSessionSnapshot } from '../../contracts/project';
import type { StudioStyleEditRequest, StudioStyleUnsetRequest } from '../../contracts/inspector';
import { sourceRangeAtPath } from '../../session/yamlSource';
import {
  StudioButton,
  StudioCircularProgress,
  StudioDialog,
  StudioDialogActions,
  StudioDialogContent,
  StudioDialogTitle,
  StudioIconButton,
  StudioTab,
  StudioTabs
} from '../../ui/controls';
import type { MonacoYamlEditorHandle } from '../workspace/MonacoYamlEditor';
import { YamlEditorBoundary } from '../workspace/YamlEditorBoundary';
import { createStudioYamlAssist } from '../workspace/yamlAssist';
import { BasicStyleEditor } from './BasicStyleEditor';
import { StyleCandidateFooter } from './StyleCandidateFooter';

const MonacoYamlEditor = lazy(() => import('../workspace/MonacoYamlEditor'));

interface StyleWorkspaceProps {
  candidate: StudioStylesheetCandidateController;
  forceEditorFailure?: boolean;
  onApply(): boolean;
  onCandidateTextChange(text: string): void;
  onCandidateTextReplace(text: string): void;
  onCommit(request: StudioStyleEditRequest): boolean;
  onMigrateInline(fieldPaths: Array<Array<string | number>>): boolean;
  onOpenInlineSource(path: Array<string | number>): void;
  onOpenStylesheetSource(path?: Array<string | number>): void;
  onRevert(): boolean;
  onUnset(request: StudioStyleUnsetRequest): boolean;
  snapshot: StudioSessionSnapshot;
}

function selectedStyleTarget(snapshot: StudioSessionSnapshot) {
  if (snapshot.selection.length !== 1) return undefined;
  const selection = snapshot.selection[0];
  if (!['node', 'link', 'linkDirection', 'path', 'region', 'shape', 'callout', 'text'].includes(selection.kind)) {
    return undefined;
  }
  return { id: selection.id, kind: selection.kind as 'node' | 'link' | 'linkDirection' | 'path' | 'region' | 'shape' | 'callout' | 'text' };
}

function EditorFailureProbe(): never {
  throw new Error('Intentional Studio Style editor failure.');
}

export function StyleWorkspace({
  candidate,
  forceEditorFailure = false,
  onApply,
  onCandidateTextChange,
  onCandidateTextReplace,
  onCommit,
  onMigrateInline,
  onOpenInlineSource,
  onOpenStylesheetSource,
  onRevert,
  onUnset,
  snapshot
}: StyleWorkspaceProps) {
  const state = useSyncExternalStore(candidate.subscribe, candidate.getSnapshot, candidate.getSnapshot);
  const editorRef = useRef<MonacoYamlEditorHandle>(null);
  const [focusRange, setFocusRange] = useState<ReturnType<typeof sourceRangeAtPath>>();
  const [formatOpen, setFormatOpen] = useState(false);
  const errors = state.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  const assist = useMemo(
    () => createStudioYamlAssist(snapshot.project, state.latestValid.projection.document),
    [snapshot.project, state.latestValid.projection.document]
  );
  const selectedTarget = selectedStyleTarget(snapshot);
  const matchingRule = selectedTarget && state.status !== 'invalid-dirty'
    ? candidateStyleRule(state.candidateText, selectedTarget)
    : undefined;
  const matchingRuleRange = matchingRule && state.candidateSource
    ? sourceRangeAtPath(state.candidateSource, matchingRule.path)
    : undefined;

  function setMode(mode: StudioStylesheetCandidateMode) {
    candidate.setMode(mode);
  }

  function openYaml(path?: Array<string | number>) {
    if (path && state.candidateSource) setFocusRange(sourceRangeAtPath(state.candidateSource, path));
    setMode('yaml');
  }

  function formatCandidate() {
    if (!state.candidateSource || state.status === 'invalid-dirty') return;
    const formatted = String(state.candidateSource.document);
    onCandidateTextReplace(state.candidateSource.lineEnding === '\r\n'
      ? formatted.replace(/(?<!\r)\n/g, '\r\n')
      : formatted);
    setFormatOpen(false);
  }

  return (
    <Box aria-label="Style workspace" className="studio-style-workspace" component="aside" data-mode={state.mode}>
      <StudioTabs
        aria-label="Style authoring mode"
        className="studio-style-mode-tabs"
        onChange={(_event, value: StudioStylesheetCandidateMode) => setMode(value)}
        value={state.mode}
        variant="fullWidth"
      >
        <StudioTab label="Basic" value="basic" />
        <StudioTab label="YAML" value="yaml" />
      </StudioTabs>
      <Box className="studio-style-workspace-body">
        {state.mode === 'basic' ? (
          <BasicStyleEditor
            candidate={state}
            onCommit={onCommit}
            onMigrateInline={onMigrateInline}
            onOpenInlineSource={onOpenInlineSource}
            onOpenYaml={openYaml}
            onUnset={onUnset}
            snapshot={snapshot}
          />
        ) : (
          <Box className="studio-style-yaml" component="section">
            <Stack className="studio-style-yaml-toolbar" direction="row">
              <Typography color="text.secondary" sx={{ flex: 1 }} variant="caption">
                Candidate stylesheet.yaml
              </Typography>
              <StudioIconButton aria-label="Search Style YAML" onClick={() => editorRef.current?.find()} title="Search">
                <SearchOutlinedIcon fontSize="small" />
              </StudioIconButton>
              <StudioIconButton
                aria-label="Go to matching object rule"
                disabled={!matchingRuleRange}
                onClick={() => {
                  if (!matchingRuleRange) return;
                  setFocusRange({ ...matchingRuleRange });
                  requestAnimationFrame(() => editorRef.current?.reveal(matchingRuleRange));
                }}
                title="Go to matching rule"
              >
                <FindInPageOutlinedIcon fontSize="small" />
              </StudioIconButton>
              <StudioIconButton
                aria-label="Open stylesheet source drawer"
                onClick={() => onOpenStylesheetSource(matchingRule?.path)}
                title="Open source drawer"
              >
                <OpenInNewOutlinedIcon fontSize="small" />
              </StudioIconButton>
              <StudioIconButton
                aria-label="Format Style YAML"
                disabled={state.status === 'invalid-dirty' || state.status === 'validating'}
                onClick={() => setFormatOpen(true)}
                title="Format YAML"
              >
                <FormatAlignLeftOutlinedIcon fontSize="small" />
              </StudioIconButton>
            </Stack>
            <YamlEditorBoundary document="stylesheet" onChange={onCandidateTextChange} value={state.candidateText}>
              {forceEditorFailure ? <EditorFailureProbe /> : (
                <Suspense fallback={(
                  <Box className="studio-style-yaml-loading" role="status">
                    <StudioCircularProgress />
                    <Typography variant="body2">Loading YAML editor...</Typography>
                  </Box>
                )}>
                  <MonacoYamlEditor
                    assist={assist}
                    diagnostics={state.diagnostics}
                    document="stylesheet"
                    focusRange={focusRange}
                    modelPath={`inmemory://topoviewer-studio/${snapshot.project.id}/style-candidate.yaml`}
                    onChange={onCandidateTextChange}
                    ref={editorRef}
                    value={state.candidateText}
                  />
                </Suspense>
              )}
            </YamlEditorBoundary>
            {errors.length ? (
              <List aria-label="Style diagnostics" className="studio-style-yaml-diagnostics" dense disablePadding>
                {errors.map((diagnostic, index) => (
                  <ListItem key={`${diagnostic.code}-${diagnostic.line || 0}-${index}`}>
                    <Typography color="error" variant="caption">
                      {diagnostic.line ? `Line ${diagnostic.line}: ` : ''}{diagnostic.message}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            ) : null}
          </Box>
        )}
      </Box>
      <StyleCandidateFooter candidate={candidate} onApply={onApply} onRevert={onRevert} />
      <StudioDialog aria-labelledby="studio-format-style-title" onClose={() => setFormatOpen(false)} open={formatOpen}>
        <StudioDialogTitle id="studio-format-style-title">Format candidate stylesheet?</StudioDialogTitle>
        <StudioDialogContent>
          <Typography variant="body2">
            Formatting can normalize indentation, quoting, and flow-style YAML. The candidate remains unapplied until you select Apply.
          </Typography>
        </StudioDialogContent>
        <StudioDialogActions>
          <StudioButton onClick={() => setFormatOpen(false)}>Cancel</StudioButton>
          <StudioButton className="studio-primary-button" onClick={formatCandidate}>
            <CodeIcon fontSize="small" />Format
          </StudioButton>
        </StudioDialogActions>
      </StudioDialog>
    </Box>
  );
}
