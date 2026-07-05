import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import yaml from 'js-yaml';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import { TopoViewer } from './TopoViewer';
import type { TopoDocument, TopoViewerToggles } from '../core/types';
import {
  buildAttentionIndex,
  deriveAggregateGraph,
  resolveFocusQuery,
  type AggregateGroupDefinition,
  type AttentionGraphIndex,
  type FocusDependencyDirection,
  type FocusPresentationMode,
  type FocusQuery
} from '../core/attention';
import { validateTopoDocument } from '../core/validation';
import { composeTopoViewerDocument } from '../core/compose';
import './workbench.css';

const Editor = lazy(() => import('@monaco-editor/react'));

type FocusKind = 'id' | 'changes';
type AggregateMode = 'none' | 'region' | 'parent' | 'role';
type LabelDensity = 'auto' | 'minimal' | 'dense';

const initialTopologyYamlUrl = new URL('../../content/examples/integration/complete-network-demo/topology.yaml', import.meta.url);
const initialStylesheetYamlUrl = new URL('../../content/examples/integration/complete-network-demo/stylesheet.yaml', import.meta.url);
const emptyWorkbenchDocument: TopoDocument = { graph: { id: 'workbench-loading' }, toggles: [] };

async function fetchText(url: URL): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url.pathname}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function composeSpec(topologyText: string, stylesheetText: string): TopoDocument {
  if (!topologyText.trim() && !stylesheetText.trim()) {
    return validateTopoDocument(emptyWorkbenchDocument, 'Workbench YAML');
  }
  const topology = yaml.load(topologyText) as TopoDocument;
  const stylesheet = yaml.load(stylesheetText) as TopoDocument;
  return composeTopoViewerDocument(topology, stylesheet, { validationContext: 'Workbench YAML' });
}

function splitIds(value: string): string[] {
  return value.split(/[\s,]+/).map((entry) => entry.trim()).filter(Boolean);
}

function parseRevision(value: string): string | number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : trimmed;
}

function aggregateGroupDefinitions(mode: AggregateMode, spec: TopoDocument, index: AttentionGraphIndex): AggregateGroupDefinition[] {
  const graph = spec.graph || {};
  if (mode === 'region') {
    return (graph.regions || []).map((region) => ({
      id: `region:${region.id}`,
      by: 'region',
      regionId: region.id,
      label: region.name || region.label || region.id
    }));
  }
  if (mode === 'parent') {
    return (graph.nodes || []).flatMap((node) => (
      index.getChildren(node.id).length
        ? [{
            id: `parent:${node.id}`,
            by: 'parent' as const,
            parentId: node.id,
            label: node.name || node.label || node.id
          }]
        : []
    ));
  }
  if (mode === 'role') {
    const roleValues = new Set((graph.nodes || []).map((node) => node.labels?.role).filter(Boolean).map(String));
    return Array.from(roleValues).flatMap((role) => (
      index.getByLabel('role', role).length > 1
        ? [{
            id: `role:${role}`,
            by: 'label' as const,
            key: 'role',
            value: role,
            label: role
          }]
        : []
    ));
  }
  return [];
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a1017',
      paper: '#111820'
    },
    primary: {
      main: '#3da1ff'
    },
    secondary: {
      main: '#68d391'
    },
    text: {
      primary: '#e7edf4',
      secondary: '#9aa8b8'
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      fontWeight: 700,
      textTransform: 'none'
    }
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: 'small',
        variant: 'outlined'
      }
    },
    MuiCheckbox: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'filled'
      }
    }
  }
});

export function TopoViewerWorkbench() {
  const [activeTab, setActiveTab] = useState<'topology' | 'stylesheet'>('topology');
  const [topologyText, setTopologyText] = useState('');
  const [stylesheetText, setStylesheetText] = useState('');
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [toggles, setToggles] = useState<TopoViewerToggles>({});
  const [focusKind, setFocusKind] = useState<FocusKind>('id');
  const [attentionSeed, setAttentionSeed] = useState('');
  const [attentionChangedSince, setAttentionChangedSince] = useState('2026-06-01T00:00:00Z');
  const [attentionRevision, setAttentionRevision] = useState('41');
  const [attentionMode, setAttentionMode] = useState<FocusPresentationMode>('dim-context');
  const [attentionDirection, setAttentionDirection] = useState<FocusDependencyDirection>('both');
  const [attentionDepth, setAttentionDepth] = useState(2);
  const [aggregateMode, setAggregateMode] = useState<AggregateMode>('none');
  const [expandedGroupText, setExpandedGroupText] = useState('');
  const [labelDensity, setLabelDensity] = useState<LabelDensity>('auto');
  const [activeFocusIndex, setActiveFocusIndex] = useState(0);
  const [layoutRun, setLayoutRun] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchText(initialTopologyYamlUrl),
      fetchText(initialStylesheetYamlUrl)
    ]).then(([nextTopologyText, nextStylesheetText]) => {
      if (cancelled) return;
      const nextTopologyYaml = nextTopologyText.trimEnd();
      const nextTopologyDocument = yaml.load(nextTopologyYaml) as TopoDocument;
      setTopologyText(nextTopologyYaml);
      setStylesheetText(nextStylesheetText.trimEnd());
      setSelectedLayers(nextTopologyDocument.graph?.layers?.map((layer) => layer.id) || []);
      setToggles(Object.fromEntries((nextTopologyDocument.toggles || []).map((toggle) => [toggle.id, toggle.default !== false])));
    }).catch((loadError) => {
      if (!cancelled) {
        setError(loadError instanceof Error ? loadError.message : String(loadError));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const spec = useMemo(() => {
    try {
      setError(null);
      return composeSpec(topologyText, stylesheetText);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : String(parseError));
      return validateTopoDocument(emptyWorkbenchDocument, 'Workbench YAML');
    }
  }, [stylesheetText, topologyText]);

  const sourceAttentionIndex = useMemo(() => buildAttentionIndex(spec), [spec]);
  const aggregateGroups = useMemo(() => aggregateGroupDefinitions(aggregateMode, spec, sourceAttentionIndex), [aggregateMode, sourceAttentionIndex, spec]);
  const viewerDocument = useMemo(() => {
    if (aggregateMode === 'none' || !aggregateGroups.length) return spec;
    return deriveAggregateGraph(spec, sourceAttentionIndex, {
      groups: aggregateGroups,
      expandedGroupIds: splitIds(expandedGroupText)
    }).document;
  }, [aggregateGroups, aggregateMode, expandedGroupText, sourceAttentionIndex, spec]);
  const viewerAttentionIndex = useMemo(() => buildAttentionIndex(viewerDocument), [viewerDocument]);
  const layerCatalog = viewerDocument.graph?.layers || [];
  const attentionQuery = useMemo<FocusQuery | undefined>(() => {
    if (focusKind === 'changes') {
      return {
        changes: {
          since: attentionChangedSince.trim() || undefined,
          revision: parseRevision(attentionRevision)
        },
        mode: attentionMode
      };
    }

    const id = attentionSeed.trim();
    if (!id) return undefined;
    const graph = viewerDocument.graph || {};
    const isNode = (graph.nodes || []).some((node) => node.id === id);
    const isLink = (graph.links || []).some((link) => link.id === id);
    const isPath = (graph.paths || []).some((path) => path.id === id);
    const isRegion = (graph.regions || []).some((region) => region.id === id);
    if (!isNode && !isLink && !isPath && !isRegion) return undefined;
    return {
      ids: [id],
      pathIds: isPath ? [id] : undefined,
      regionIds: isRegion ? [id] : undefined,
      dependency: isNode ? {
        from: [id],
        direction: attentionDirection,
        depth: attentionDepth
      } : undefined,
      mode: attentionMode
    };
  }, [attentionChangedSince, attentionDepth, attentionDirection, attentionMode, attentionRevision, attentionSeed, focusKind, viewerDocument]);
  const attentionResultIds = useMemo(() => {
    if (!attentionQuery) return [];
    try {
      return Array.from(resolveFocusQuery(viewerAttentionIndex, attentionQuery).focusedIds);
    } catch {
      return [];
    }
  }, [attentionQuery, viewerAttentionIndex]);
  const attentionSeedKnown = focusKind !== 'id' || !attentionSeed.trim() || !!attentionQuery;
  const activeFocusId = attentionResultIds[activeFocusIndex] || '';

  useEffect(() => {
    setActiveFocusIndex(0);
  }, [attentionQuery]);

  useEffect(() => {
    setActiveFocusIndex((current) => Math.min(current, Math.max(0, attentionResultIds.length - 1)));
  }, [attentionResultIds.length]);

  const moveFocusResult = (delta: number) => {
    setActiveFocusIndex((current) => {
      if (!attentionResultIds.length) return 0;
      return (current + delta + attentionResultIds.length) % attentionResultIds.length;
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="topoviewer-workbench">
        <Paper component="aside" className="topoviewer-workbench-left" elevation={8}>
          <Box component="header" className="topoviewer-workbench-header">
            <Typography component="h1" variant="h5">TopoViewer</Typography>
            <Typography variant="body2" color="text.secondary">
              Declarative graph facts plus selector styling, rendered through React Flow with force-directed layout assistance.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} className="topoviewer-controls" useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button onClick={() => setLayoutRun((value) => value + 1)}>Run force layout</Button>
            <Button onClick={() => setSelectedLayers(layerCatalog.map((layer) => layer.id))}>All layers</Button>
            <Button onClick={() => setSelectedLayers([])}>No layers</Button>
          </Stack>

          <Stack className="topoviewer-panel-section" spacing={0.75}>
            <Typography variant="overline" color="text.secondary">Layers</Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {layerCatalog.map((layer) => (
                <FormControlLabel
                  key={layer.id}
                  className="topoviewer-check"
                  control={
                    <Checkbox
                      checked={selectedLayers.includes(layer.id)}
                      onChange={(event) => {
                        setSelectedLayers((current) => event.target.checked
                          ? [...new Set([...current, layer.id])]
                          : current.filter((item) => item !== layer.id));
                      }}
                    />
                  }
                  label={layer.name || layer.id}
                />
              ))}
            </Stack>
          </Stack>

          <Stack className="topoviewer-panel-section" spacing={0.75}>
            <Typography variant="overline" color="text.secondary">Display</Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {(spec.toggles || []).map((toggle) => (
                <FormControlLabel
                  key={toggle.id}
                  className="topoviewer-check"
                  control={
                    <Checkbox
                      checked={!!toggles[toggle.id]}
                      onChange={(event) => setToggles((current) => ({ ...current, [toggle.id]: event.target.checked }))}
                    />
                  }
                  label={toggle.name || toggle.id}
                />
              ))}
            </Stack>
          </Stack>

          <Stack className="topoviewer-panel-section" spacing={0.75}>
            <Typography variant="overline" color="text.secondary">Attention</Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <TextField
                select
                label="Focus"
                size="small"
                value={focusKind}
                onChange={(event) => setFocusKind(event.target.value as FocusKind)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="id">ID</MenuItem>
                <MenuItem value="changes">Changed</MenuItem>
              </TextField>
              <TextField
                label="Focus ID"
                size="small"
                value={attentionSeed}
                disabled={focusKind !== 'id'}
                error={!attentionSeedKnown}
                helperText={attentionSeedKnown ? ' ' : 'Unknown ID'}
                onChange={(event) => setAttentionSeed(event.target.value)}
                sx={{ minWidth: 150 }}
              />
              <TextField
                label="Changed Since"
                size="small"
                value={attentionChangedSince}
                disabled={focusKind !== 'changes'}
                onChange={(event) => setAttentionChangedSince(event.target.value)}
                sx={{ minWidth: 202 }}
              />
              <TextField
                label="Base Revision"
                size="small"
                value={attentionRevision}
                disabled={focusKind !== 'changes'}
                onChange={(event) => setAttentionRevision(event.target.value)}
                sx={{ width: 128 }}
              />
              <TextField
                select
                label="Mode"
                size="small"
                value={attentionMode}
                onChange={(event) => setAttentionMode(event.target.value as FocusPresentationMode)}
                sx={{ minWidth: 132 }}
              >
                <MenuItem value="dim-context">Dim</MenuItem>
                <MenuItem value="hide-context">Hide</MenuItem>
                <MenuItem value="highlight">Highlight</MenuItem>
              </TextField>
              <TextField
                select
                label="Direction"
                size="small"
                value={attentionDirection}
                disabled={focusKind !== 'id'}
                onChange={(event) => setAttentionDirection(event.target.value as FocusDependencyDirection)}
                sx={{ minWidth: 132 }}
              >
                <MenuItem value="both">Both</MenuItem>
                <MenuItem value="downstream">Downstream</MenuItem>
                <MenuItem value="upstream">Upstream</MenuItem>
              </TextField>
              <TextField
                label="Depth"
                size="small"
                type="number"
                value={attentionDepth}
                disabled={focusKind !== 'id'}
                onChange={(event) => setAttentionDepth(Math.max(0, Number(event.target.value) || 0))}
                slotProps={{ htmlInput: { min: 0, max: 6 } }}
                sx={{ width: 88 }}
              />
              <TextField
                select
                label="Aggregate"
                size="small"
                value={aggregateMode}
                onChange={(event) => setAggregateMode(event.target.value as AggregateMode)}
                sx={{ minWidth: 132 }}
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="region">Region</MenuItem>
                <MenuItem value="parent">Parent</MenuItem>
                <MenuItem value="role">Role</MenuItem>
              </TextField>
              <TextField
                label="Expanded Groups"
                size="small"
                value={expandedGroupText}
                disabled={aggregateMode === 'none'}
                onChange={(event) => setExpandedGroupText(event.target.value)}
                sx={{ minWidth: 178 }}
              />
              <TextField
                select
                label="Labels"
                size="small"
                value={labelDensity}
                onChange={(event) => setLabelDensity(event.target.value as LabelDensity)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="auto">Auto</MenuItem>
                <MenuItem value="minimal">Minimal</MenuItem>
                <MenuItem value="dense">Dense</MenuItem>
              </TextField>
              <Tooltip title="Previous focused result">
                <span>
                  <IconButton
                    aria-label="Previous focus result"
                    disabled={!attentionResultIds.length}
                    onClick={() => moveFocusResult(-1)}
                    size="small"
                  >
                    <SkipPreviousIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Next focused result">
                <span>
                  <IconButton
                    aria-label="Next focus result"
                    disabled={!attentionResultIds.length}
                    onClick={() => moveFocusResult(1)}
                    size="small"
                  >
                    <SkipNextIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Button onClick={() => {
                setAttentionSeed('');
                setFocusKind('id');
              }}>Clear</Button>
            </Stack>
            <Typography role="status" aria-live="polite" variant="caption" color="text.secondary">
              Focus result {attentionResultIds.length ? activeFocusIndex + 1 : 0}/{attentionResultIds.length}{activeFocusId ? `: ${activeFocusId}` : ''}
            </Typography>
          </Stack>

          <Box className="topoviewer-editor">
            <Tabs
              value={activeTab}
              onChange={(_event, value: 'topology' | 'stylesheet') => setActiveTab(value)}
              variant="fullWidth"
            >
              <Tab value="topology" label="Topology YAML" />
              <Tab value="stylesheet" label="Stylesheet YAML" />
            </Tabs>
            <Suspense fallback={<Box className="topoviewer-editor-loading">Loading YAML editor...</Box>}>
              <Editor
                value={activeTab === 'topology' ? topologyText : stylesheetText}
                language="yaml"
                theme="vs-dark"
                onChange={(value?: string) => {
                  if (activeTab === 'topology') setTopologyText(value || '');
                  else setStylesheetText(value || '');
                }}
                options={{
                  automaticLayout: true,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: 12,
                  minimap: { enabled: false },
                  padding: { top: 14, bottom: 14 },
                  renderLineHighlight: 'gutter',
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  wordWrap: 'off'
                }}
              />
            </Suspense>
          </Box>

          <Box component="footer" className="topoviewer-workbench-footer">
            {error ? (
              <Alert severity="error" variant="outlined">{error}</Alert>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Rendered {viewerDocument.graph?.nodes?.length || 0} nodes, {viewerDocument.graph?.links?.length || 0} links, {viewerDocument.graph?.paths?.length || 0} paths.
              </Typography>
            )}
          </Box>
        </Paper>

        <Paper component="main" className="topoviewer-workbench-main" elevation={8}>
          <TopoViewer
            key={layoutRun}
            document={viewerDocument}
            selectedLayerIds={selectedLayers}
            toggles={toggles}
            layout={{ mode: 'force', ...(viewerDocument.layout || {}) }}
            attention={attentionQuery ? { query: attentionQuery } : undefined}
            helperLines={{ enabled: true, snap: true, showMidpoints: true }}
            className={`topoviewer-label-density-${labelDensity}`}
          />
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
