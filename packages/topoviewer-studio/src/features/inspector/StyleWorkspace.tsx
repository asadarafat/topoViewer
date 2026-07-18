import { lazy, Suspense, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import CodeIcon from '@mui/icons-material/Code';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import FormatAlignLeftOutlinedIcon from '@mui/icons-material/FormatAlignLeftOutlined';
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
import { StudioButton, StudioCircularProgress, StudioDialog, StudioDialogActions, StudioDialogContent, StudioDialogTitle, StudioIconButton, StudioTab, StudioTabs } from '../../ui/controls';
import type { MonacoYamlEditorHandle, MonacoYamlNavigationRequest } from '../workspace/MonacoYamlEditor';
import { YamlEditorBoundary } from '../workspace/YamlEditorBoundary';
import { createStudioYamlAssist } from '../workspace/yamlAssist';
import { BasicStyleEditor } from './BasicStyleEditor';
import { StyleCandidateFooter } from './StyleCandidateFooter';
import { studioSpace } from '../../ui/muiSpacing';

const MonacoYamlEditor = lazy(() => import('../workspace/MonacoYamlEditor'));

interface StyleWorkspaceProps {
  candidate: StudioStylesheetCandidateController;
  forceEditorFailure?: boolean;
  onApply(): boolean;
  onCandidateTextChange(text: string): void;
  onCandidateTextReplace(text: string): void;
  onCommit(request: StudioStyleEditRequest): boolean;
  onRevert(): boolean;
  onUnset(request: StudioStyleUnsetRequest): boolean;
  showFooter?: boolean;
  showModeTabs?: boolean;
  showSummary?: boolean;
  snapshot: StudioSessionSnapshot;
}

function selectedStyleTarget(snapshot: StudioSessionSnapshot) {
  if (snapshot.selection.length !== 1) return undefined;
  const selection = snapshot.selection[0];
  if (!['node', 'link', 'linkDirection', 'path', 'region', 'shape', 'callout', 'text'].includes(selection.kind)) {
    return undefined;
  }
  return {
    id: selection.id,
    kind: selection.kind as 'node' | 'link' | 'linkDirection' | 'path' | 'region' | 'shape' | 'callout' | 'text'
  };
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
  onRevert,
  onUnset,
  showFooter = true,
  showModeTabs = true,
  showSummary = true,
  snapshot
}: StyleWorkspaceProps) {
  const state = useSyncExternalStore(candidate.subscribe, candidate.getSnapshot, candidate.getSnapshot);
  const editorRef = useRef<MonacoYamlEditorHandle>(null);
  const [navigation, setNavigation] = useState<MonacoYamlNavigationRequest>();
  const navigationSequence = useRef(0);
  const [formatOpen, setFormatOpen] = useState(false);
  const errors = state.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  const assist = useMemo(() => createStudioYamlAssist(snapshot.project, state.latestValid.projection.document), [snapshot.project, state.latestValid.projection.document]);
  const selectedTarget = selectedStyleTarget(snapshot);
  const matchingRule = selectedTarget && state.status !== 'invalid-dirty' ? candidateStyleRule(state.candidateText, selectedTarget) : undefined;
  const matchingRuleRange = matchingRule && state.candidateSource ? sourceRangeAtPath(state.candidateSource, matchingRule.path) : undefined;

  function setMode(mode: StudioStylesheetCandidateMode) {
    candidate.setMode(mode);
  }

  function formatCandidate() {
    if (!state.candidateSource || state.status === 'invalid-dirty') return;
    const formatted = String(state.candidateSource.document);
    onCandidateTextReplace(state.candidateSource.lineEnding === '\r\n' ? formatted.replace(/(?<!\r)\n/g, '\r\n') : formatted);
    setFormatOpen(false);
  }

  return (
    <Box
      aria-label="Style workspace"
      className="studio-style-workspace"
      component={showModeTabs ? 'aside' : 'section'}
      data-mode={state.mode}
      sx={
        !showModeTabs && state.mode === 'basic'
          ? { display: 'block', minWidth: 0, overflow: 'visible' }
          : {
              display: 'grid',
              gridTemplateRows: showModeTabs ? 'auto minmax(0, 1fr) auto' : 'minmax(0, 1fr)',
              height: '100%',
              minHeight: 0,
              minWidth: 0,
              overflow: 'hidden'
            }
      }
    >
      {showModeTabs ? (
        <StudioTabs aria-label="Style authoring mode" className="studio-style-mode-tabs" onChange={(_event, value: StudioStylesheetCandidateMode) => setMode(value)} value={state.mode} variant="fullWidth">
          <StudioTab label="Visual" value="basic" />
          <StudioTab label="Code" value="yaml" />
        </StudioTabs>
      ) : null}
      <Box
        className="studio-style-workspace-body"
        sx={{
          height: !showModeTabs && state.mode === 'basic' ? 'auto' : '100%',
          minHeight: 0,
          minWidth: 0,
          overflow: !showModeTabs && state.mode === 'basic' ? 'visible' : 'hidden'
        }}
      >
        {state.mode === 'basic' ? (
          <BasicStyleEditor candidate={state} onCommit={onCommit} onUnset={onUnset} showSummary={showSummary} snapshot={snapshot} />
        ) : (
          <Box
            className="studio-style-yaml"
            component="section"
            sx={{
              display: 'grid',
              gap: studioSpace.space8,
              gridTemplateRows: 'auto minmax(0, 1fr) auto',
              height: '100%',
              minHeight: 0,
              p: studioSpace.space12
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', minWidth: 0 }}>
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
                  setNavigation({
                    focus: true,
                    id: `matching-rule:${++navigationSequence.current}`,
                    range: matchingRuleRange
                  });
                }}
                title="Go to matching rule"
              >
                <FindInPageOutlinedIcon fontSize="small" />
              </StudioIconButton>
              <StudioIconButton aria-label="Format Style YAML" disabled={state.status === 'invalid-dirty' || state.status === 'validating'} onClick={() => setFormatOpen(true)} title="Format YAML">
                <FormatAlignLeftOutlinedIcon fontSize="small" />
              </StudioIconButton>
            </Stack>
            <YamlEditorBoundary document="stylesheet" onChange={onCandidateTextChange} value={state.candidateText}>
              {forceEditorFailure ? (
                <EditorFailureProbe />
              ) : (
                <Suspense
                  fallback={
                    <Box
                      role="status"
                      sx={{
                        alignItems: 'center',
                        display: 'flex',
                        gap: studioSpace.space8,
                        justifyContent: 'center',
                        minHeight: 180
                      }}
                    >
                      <StudioCircularProgress />
                      <Typography variant="body2">Loading YAML editor...</Typography>
                    </Box>
                  }
                >
                  <MonacoYamlEditor
                    assist={assist}
                    diagnostics={state.diagnostics}
                    document="stylesheet"
                    modelPath={`inmemory://topoviewer-studio/${snapshot.project.id}/style-candidate.yaml`}
                    navigation={navigation}
                    onChange={onCandidateTextChange}
                    ref={editorRef}
                    value={state.candidateText}
                  />
                </Suspense>
              )}
            </YamlEditorBoundary>
            {errors.length ? (
              <List aria-label="Style diagnostics" dense disablePadding sx={{ maxHeight: 120, overflow: 'auto' }}>
                {errors.map((diagnostic, index) => (
                  <ListItem key={`${diagnostic.code}-${diagnostic.line || 0}-${index}`}>
                    <Typography color="error" variant="caption">
                      {diagnostic.line ? `Line ${diagnostic.line}: ` : ''}
                      {diagnostic.message}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            ) : null}
          </Box>
        )}
      </Box>
      {showFooter ? <StyleCandidateFooter candidate={candidate} onApply={onApply} onRevert={onRevert} /> : null}
      <StudioDialog aria-labelledby="studio-format-style-title" onClose={() => setFormatOpen(false)} open={formatOpen}>
        <StudioDialogTitle id="studio-format-style-title">Format candidate stylesheet?</StudioDialogTitle>
        <StudioDialogContent>
          <Typography variant="body2">Formatting can normalize indentation, quoting, and flow-style YAML. The candidate remains unapplied until you select Apply.</Typography>
        </StudioDialogContent>
        <StudioDialogActions>
          <StudioButton onClick={() => setFormatOpen(false)}>Cancel</StudioButton>
          <StudioButton onClick={formatCandidate} variant="contained">
            <CodeIcon fontSize="small" />
            Format
          </StudioButton>
        </StudioDialogActions>
      </StudioDialog>
    </Box>
  );
}
