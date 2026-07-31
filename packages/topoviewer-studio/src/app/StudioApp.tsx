import { useCallback, useEffect, useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { StudioHost } from '../contracts/host';
import type { StudioLoadResult, StudioProjectReference, StudioProjectSummary } from '../contracts/host';
import type { StudioProject, StudioRecoverySnapshot } from '../contracts/project';
import { StudioThemeProvider } from '../ui/StudioThemeProvider';
import { StudioButton, StudioCircularProgress } from '../ui/controls';
import type { StudioOptionalSurface } from './StudioOptionalSurfaceBoundary';
import { StudioWorkspace } from './StudioWorkspace';
import '../styles/studio.css';
import { studioLayoutSpacing, studioSpace } from '../ui/muiSpacing';

export interface StudioAppProps {
  forceEditorFailure?: boolean;
  forceOptionalSurfaceFailure?: StudioOptionalSurface;
  host: StudioHost;
}

export function StudioApp(props: StudioAppProps) {
  return (
    <StudioThemeProvider host={props.host}>
      <StudioAppBody {...props} />
    </StudioThemeProvider>
  );
}

function StudioAppBody({
  forceEditorFailure,
  forceOptionalSurfaceFailure,
  host
}: StudioAppProps) {
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

  const load = useCallback(
    async (reference?: StudioProjectReference) => {
      const result = await host.loadProject(reference);
      if (result.ok) {
        applyLoad(result.value);
        setError(undefined);
        await refreshProjects();
      } else if (project) setActionError(result.error.message);
      else setError(result.error.message);
    },
    [applyLoad, host, project, refreshProjects]
  );

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
      } else setError(result.error.message);
    });
    return () => {
      active = false;
    };
  }, [applyLoad, host, refreshProjects]);

  if (error) {
    return (
      <Stack
        component="main"
        role="alert"
        spacing={studioSpace.space12}
        sx={{
          m: 'auto',
          maxWidth: 560,
          minHeight: '100%',
          p: studioLayoutSpacing.pageInset,
          placeContent: 'center'
        }}
      >
        <Typography component="h1" variant="h6">
          Studio could not open the project.
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {error}
        </Typography>
        <Stack direction="row" spacing={studioSpace.space8}>
          <StudioButton onClick={() => void load()}>Retry</StudioButton>
          {host.resetStorage ? (
            <StudioButton color="error" onClick={() => void resetStorage()} variant="outlined">
              Reset project storage
            </StudioButton>
          ) : null}
        </Stack>
      </Stack>
    );
  }

  if (!project) {
    return (
      <Stack
        component="main"
        aria-busy="true"
        spacing={studioSpace.space8}
        sx={{
          alignItems: 'center',
          minHeight: '100%',
          p: studioLayoutSpacing.pageInset,
          placeContent: 'center'
        }}
      >
        <Typography component="h1" variant="h6">
          TopoViewer Studio
        </Typography>
        <Stack direction="row" spacing={studioSpace.space8} sx={{ alignItems: 'center' }}>
          <StudioCircularProgress aria-label="Opening Studio" />
          <Typography variant="body2">Opening Studio...</Typography>
        </Stack>
      </Stack>
    );
  }

  return (
    <StudioWorkspace
      forceEditorFailure={forceEditorFailure}
      forceOptionalSurfaceFailure={forceOptionalSurfaceFailure}
      host={host}
      key={`${project.revision}:${project.documents.topology.contentHash}`}
      onReload={() => load({ id: project.id, recovery: 'discard' })}
      project={project}
      projectLifecycle={{
        activeProjectId: project.id,
        error: actionError,
        hostLabel: host.displayName,
        projectCatalog: host.capabilities.projectCatalog,
        projects,
        ...(host.capabilities.projectCatalog
          ? {
              create: async () => {
                const created = await host.createProject({});
                if (!created.ok) setActionError(created.error.message);
                else applyLoad(created.value);
                await refreshProjects();
              },
              delete: async (id: string) => {
                const deleted = await host.deleteProject({ id });
                if (!deleted.ok) {
                  setActionError(deleted.error.message);
                  return;
                }
                if (id === project.id) await load();
                else await refreshProjects();
              },
              duplicate: async (id: string) => {
                const duplicated = await host.duplicateProject({
                  id
                });
                if (!duplicated.ok) setActionError(duplicated.error.message);
                else applyLoad(duplicated.value);
                await refreshProjects();
              }
            }
          : {}),
        exportArchive: async (id, currentProject) => {
          let archiveProject = currentProject;
          if (!archiveProject) {
            const loaded = await host.loadProject({ id });
            if (!loaded.ok) {
              setActionError(loaded.error.message);
              return;
            }
            archiveProject = loaded.value.project;
          }
          const assets = await host.readProjectAssets({
            id: archiveProject.id
          });
          if (!assets.ok) {
            setActionError(assets.error.message);
            return;
          }
          try {
            const { encodeStudioProjectArchive } = await import('../archive/projectArchive');
            const artifact = encodeStudioProjectArchive(archiveProject, assets.value);
            const exported = await host.exportArtifact({
              artifact: {
                bytes: artifact,
                mediaType: 'application/zip',
                name: `${
                  archiveProject.name
                    .replace(/[^a-z0-9._-]+/gi, '-')
                    .replace(/^-|-$/g, '')
                    .toLowerCase() || 'topoviewer-project'
                }.tvstudio`
              },
              kind: 'bundle',
              suggestedName: `${
                archiveProject.name
                  .replace(/[^a-z0-9._-]+/gi, '-')
                  .replace(/^-|-$/g, '')
                  .toLowerCase() || 'topoviewer-project'
              }.tvstudio`
            });
            if (!exported.ok) setActionError(exported.error.message);
          } catch (archiveError) {
            setActionError(archiveError instanceof Error ? archiveError.message : String(archiveError));
          }
        },
        ...(host.capabilities.projectCatalog
          ? {
              open: async (id: string) => {
                const opened = await host.loadProject({ id });
                if (!opened.ok) setActionError(opened.error.message);
                else applyLoad(opened.value);
                await refreshProjects();
              },
              openArchive: async (activate) => {
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
                  const importArchive = async () => {
                    const created = await host.createProject({
                      assets: archive.assets,
                      project: archive.project
                    });
                    if (!created.ok) setActionError(created.error.message);
                    else applyLoad(created.value);
                    await refreshProjects();
                  };
                  if (activate) await activate(importArchive);
                  else await importArchive();
                } catch (archiveError) {
                  setActionError(archiveError instanceof Error ? archiveError.message : String(archiveError));
                }
              }
            }
          : {}),
        ...(host.capabilities.directoryProjects && host.openProjectFolder
          ? {
              openFolder: async (activate) => {
                const opened = await host.openProjectFolder!();
                if (!opened.ok) {
                  if (opened.error.code !== 'cancelled') setActionError(opened.error.message);
                  return;
                }
                const openFolder = async () => {
                  applyLoad(opened.value);
                  await refreshProjects();
                };
                if (activate) await activate(openFolder);
                else await openFolder();
              }
            }
          : {}),
        ...(host.capabilities.projectCatalog
          ? {
              rename: async (id: string, name: string) => {
                const renamed = await host.renameProject({
                  id,
                  name
                });
                if (!renamed.ok) setActionError(renamed.error.message);
                else if (id === project.id) applyLoad(renamed.value);
                await refreshProjects();
              }
            }
          : {}),
        ...(host.resetStorage ? { resetStorage } : {})
      }}
      recovery={recovery}
    />
  );
}
