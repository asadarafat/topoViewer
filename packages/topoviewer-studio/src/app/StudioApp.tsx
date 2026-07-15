import { useCallback, useEffect, useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { StudioHost } from '../contracts/host';
import type { StudioLoadResult, StudioProjectSummary } from '../contracts/host';
import type { StudioProject, StudioRecoverySnapshot } from '../contracts/project';
import { StudioThemeProvider } from '../ui/StudioThemeProvider';
import { StudioButton, StudioCircularProgress } from '../ui/controls';
import { StudioWorkspace } from './StudioWorkspace';
import './studio.css';
import './studio-wireframe.css';

export interface StudioAppProps {
  forceEditorFailure?: boolean;
  host: StudioHost;
}

export function StudioApp(props: StudioAppProps) {
  return <StudioThemeProvider><StudioAppBody {...props} /></StudioThemeProvider>;
}

function StudioAppBody({ forceEditorFailure, host }: StudioAppProps) {
  const [project, setProject] = useState<StudioProject>();
  const [recovery, setRecovery] = useState<StudioRecoverySnapshot>();
  const [projects, setProjects] = useState<StudioProjectSummary[]>([]);
  const [error, setError] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  const applyLoad = useCallback((loaded: StudioLoadResult) => {
    setProject(loaded.recovery?.project || loaded.project);
    setRecovery(loaded.recovery);
    setActionError(undefined);
  }, []);

  const refreshProjects = useCallback(async () => {
    const listed = await host.listProjects();
    if (listed.ok) setProjects(listed.value);
    else setActionError(listed.error.message);
  }, [host]);

  const load = useCallback(async () => {
    const result = await host.loadProject();
    if (result.ok) {
      applyLoad(result.value);
      setError(undefined);
      await refreshProjects();
    } else if (project) setActionError(result.error.message);
    else setError(result.error.message);
  }, [applyLoad, host, project, refreshProjects]);

  const resetStorage = useCallback(async () => {
    if (!host.resetStorage) return;
    const reset = await host.resetStorage();
    if (!reset.ok) {
      if (project) setActionError(reset.error.message);
      else setError(reset.error.message);
      return;
    }
    setProject(undefined);
    setRecovery(undefined);
    setError(undefined);
    setActionError(undefined);
    const loaded = await host.loadProject();
    if (!loaded.ok) setError(loaded.error.message);
    else {
      applyLoad(loaded.value);
      await refreshProjects();
    }
  }, [applyLoad, host, project, refreshProjects]);

  useEffect(() => {
    let active = true;
    host.loadProject().then((result) => {
      if (!active) return;
      if (result.ok) {
        applyLoad(result.value);
        void refreshProjects();
      }
      else setError(result.error.message);
    });
    return () => {
      active = false;
    };
  }, [applyLoad, host, refreshProjects]);

  if (error) {
    return (
      <Stack className="studio-load-error" component="main" role="alert" spacing={1.5}>
        <Typography component="h1" variant="h6">Studio could not open the browser project.</Typography>
        <Typography color="text.secondary" variant="body2">{error}</Typography>
        <Stack direction="row" spacing={1}>
          <StudioButton onClick={() => void load()}>Retry</StudioButton>
          {host.resetStorage ? <StudioButton className="studio-danger-button" onClick={() => void resetStorage()}>Reset browser storage</StudioButton> : null}
        </Stack>
      </Stack>
    );
  }

  if (!project) {
    return (
      <Stack className="studio-loading" component="main" aria-busy="true" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography component="h1" variant="h6">TopoViewer Studio</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <StudioCircularProgress aria-label="Opening Studio" />
          <Typography variant="body2">Opening Studio...</Typography>
        </Stack>
      </Stack>
    );
  }

  return (
    <StudioWorkspace
      forceEditorFailure={forceEditorFailure}
      host={host}
      key={`${project.revision}:${project.documents.topology.contentHash}`}
      onReload={load}
      project={project}
      projectLifecycle={{
        activeProjectId: project.id,
        error: actionError,
        mode: host.kind === 'vscode' ? 'workspace' : 'browser',
        projects,
        ...(host.kind === 'browser' ? { create: async () => {
          const created = await host.createProject({});
          if (!created.ok) setActionError(created.error.message);
          else applyLoad(created.value);
          await refreshProjects();
        }, delete: async () => {
          const deleted = await host.deleteProject({ id: project.id });
          if (!deleted.ok) {
            setActionError(deleted.error.message);
            return;
          }
          await load();
        }, duplicate: async () => {
          const duplicated = await host.duplicateProject({ id: project.id });
          if (!duplicated.ok) setActionError(duplicated.error.message);
          else applyLoad(duplicated.value);
          await refreshProjects();
        } } : {}),
        exportArchive: async (currentProject) => {
          const assets = await host.readProjectAssets({ id: currentProject.id });
          if (!assets.ok) {
            setActionError(assets.error.message);
            return;
          }
          try {
            const { encodeStudioProjectArchive } = await import('../archive/projectArchive');
            const artifact = encodeStudioProjectArchive(currentProject, assets.value);
            const exported = await host.exportArtifact({
              artifact: {
                bytes: artifact,
                mediaType: 'application/zip',
                name: `${currentProject.name.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'topoviewer-project'}.tvstudio`
              },
              kind: 'bundle',
              suggestedName: `${currentProject.name.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'topoviewer-project'}.tvstudio`
            });
            if (!exported.ok) setActionError(exported.error.message);
          } catch (archiveError) {
            setActionError(archiveError instanceof Error ? archiveError.message : String(archiveError));
          }
        },
        ...(host.kind === 'browser' ? { open: async (id: string) => {
          const opened = await host.loadProject({ id });
          if (!opened.ok) setActionError(opened.error.message);
          else applyLoad(opened.value);
          await refreshProjects();
        }, openArchive: async () => {
          if (!host.chooseAssets) {
            setActionError('This host does not provide a local archive picker.');
            return;
          }
          const selected = await host.chooseAssets({
            accept: ['.tvstudio', 'application/zip'],
            maximumBytes: 25 * 1024 * 1024,
            multiple: false
          });
          if (!selected.ok) {
            if (selected.error.code !== 'cancelled') setActionError(selected.error.message);
            return;
          }
          try {
            const { decodeStudioProjectArchive } = await import('../archive/projectArchive');
            const archive = decodeStudioProjectArchive(selected.value.assets[0].bytes);
            const created = await host.createProject({ assets: archive.assets, project: archive.project });
            if (!created.ok) setActionError(created.error.message);
            else applyLoad(created.value);
            await refreshProjects();
          } catch (archiveError) {
            setActionError(archiveError instanceof Error ? archiveError.message : String(archiveError));
          }
        } } : {}),
        ...(host.capabilities.directoryProjects && host.openProjectFolder ? {
          openFolder: async () => {
            const opened = await host.openProjectFolder!();
            if (!opened.ok) {
              if (opened.error.code !== 'cancelled') setActionError(opened.error.message);
              return;
            }
            applyLoad(opened.value);
            await refreshProjects();
          }
        } : {}),
        ...(host.kind === 'browser' ? { rename: async (name: string) => {
          const renamed = await host.renameProject({ id: project.id, name });
          if (!renamed.ok) setActionError(renamed.error.message);
          else applyLoad(renamed.value);
          await refreshProjects();
        } } : {}),
        ...(host.resetStorage ? { resetStorage } : {})
      }}
      recovery={recovery}
    />
  );
}
