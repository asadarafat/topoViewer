import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { StudioSessionSnapshot } from '../../contracts/project';
import { parseStudioSource } from '../../session/yamlSource';
import { StudioButton, StudioCircularProgress, StudioIconButton } from '../../ui/controls';
import type { MonacoYamlEditorHandle, MonacoYamlNavigationRequest } from '../workspace/MonacoYamlEditor';
import { YamlEditorBoundary } from '../workspace/YamlEditorBoundary';
import { YamlContextHelpButton } from '../workspace/YamlContextHelpButton';
import { createStudioYamlAssist } from '../workspace/yamlAssist';
import { studioSpace } from '../../ui/muiSpacing';

const MonacoYamlEditor = lazy(() => import('../workspace/MonacoYamlEditor'));

type EmbeddedProjectDocument = 'mapper' | 'topology';

interface EmbeddedProjectYamlEditorProps {
  document: EmbeddedProjectDocument;
  forceEditorFailure?: boolean;
  initialDraft?: string;
  navigation?: MonacoYamlNavigationRequest;
  onApply(text: string): boolean;
  onCursorOffset(offset: number): void;
  onDiscardInvalid(): void;
  onDraftChange(text: string): void;
  snapshot: StudioSessionSnapshot;
}

function EditorFailureProbe(): never {
  throw new Error('Intentional Studio project editor failure.');
}

export function EmbeddedProjectYamlEditor({ document, forceEditorFailure = false, initialDraft, navigation, onApply, onCursorOffset, onDiscardInvalid, onDraftChange, snapshot }: EmbeddedProjectYamlEditorProps) {
  const canonical = snapshot.project.documents[document]?.text || '';
  const invalidDraft = snapshot.invalidDrafts[document];
  const source = invalidDraft?.text || canonical;
  const documentPath = snapshot.project.documents[document]?.path || `${document}.yaml`;
  const documentTitle = document === 'topology' ? 'Topology' : 'Mapper';
  const [draft, setDraft] = useState(initialDraft ?? source);
  const hasLocalDraft = useRef(initialDraft !== undefined && initialDraft !== source);
  const editorRef = useRef<MonacoYamlEditorHandle>(null);
  const assist = useMemo(() => createStudioYamlAssist(snapshot.project, snapshot.projection.document), [snapshot.project, snapshot.projection.document]);
  const syntax = useMemo(() => parseStudioSource(document, draft), [document, draft]);
  const diagnostics = syntax.ok ? (invalidDraft?.text === draft ? invalidDraft.diagnostics : snapshot.projection.diagnostics.filter((diagnostic) => diagnostic.document === document)) : syntax.diagnostics;
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  const dirty = draft !== canonical || Boolean(invalidDraft);

  useEffect(() => {
    if (!hasLocalDraft.current || invalidDraft) {
      setDraft(source);
      hasLocalDraft.current = false;
    }
  }, [invalidDraft, source]);

  function revert() {
    if (invalidDraft) onDiscardInvalid();
    hasLocalDraft.current = false;
    setDraft(canonical);
    onDraftChange(canonical);
  }

  function updateDraft(value: string) {
    hasLocalDraft.current = value !== source;
    setDraft(value);
    onDraftChange(value);
  }

  function applyDraft() {
    const applied = onApply(draft);
    if (applied) hasLocalDraft.current = false;
  }

  return (
    <Box
      aria-label={`${documentTitle} YAML workspace`}
      className="studio-embedded-project-yaml"
      component="section"
      sx={{
        display: 'grid',
        gap: studioSpace.space8,
        gridTemplateRows: 'auto minmax(0, 1fr) auto auto',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        p: studioSpace.space12
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', minWidth: 0 }}>
        <Typography color="text.secondary" sx={{ flex: 1 }} variant="caption">
          {dirty ? `${documentPath} modified` : documentPath}
        </Typography>
        <StudioIconButton aria-label={`Search ${document} YAML`} onClick={() => editorRef.current?.find()} title="Search">
          <SearchOutlinedIcon fontSize="small" />
        </StudioIconButton>
        <YamlContextHelpButton onClick={() => editorRef.current?.showContextHelp()} />
      </Stack>
      <YamlEditorBoundary document={document} onChange={updateDraft} value={draft}>
        {forceEditorFailure ? (
          <EditorFailureProbe />
        ) : (
          <Suspense
            fallback={
              <Stack
                aria-busy="true"
                direction="row"
                spacing={studioSpace.space8}
                sx={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 180
                }}
              >
                <StudioCircularProgress />
                <Typography variant="body2">Loading YAML editor...</Typography>
              </Stack>
            }
          >
            <MonacoYamlEditor
              assist={assist}
              diagnostics={diagnostics}
              document={document}
              modelPath={`inmemory://topoviewer-studio/${snapshot.project.id}/edit-${document}.yaml`}
              navigation={navigation}
              onChange={updateDraft}
              onCursorOffset={onCursorOffset}
              ref={editorRef}
              value={draft}
            />
          </Suspense>
        )}
      </YamlEditorBoundary>
      {errors.length ? (
        <List aria-label={`${documentTitle} diagnostics`} dense disablePadding sx={{ maxHeight: 120, overflow: 'auto' }}>
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
      <Stack direction="row" spacing={studioSpace.space8} sx={{ justifyContent: 'flex-end' }}>
        <StudioButton aria-label={invalidDraft ? 'Revert invalid draft' : undefined} disabled={!dirty} onClick={revert}>
          Revert
        </StudioButton>
        <StudioButton disabled={!dirty} onClick={applyDraft} variant="contained">
          Apply {document}
        </StudioButton>
      </Stack>
    </Box>
  );
}
