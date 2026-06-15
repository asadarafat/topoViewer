import { useMemo, useState } from 'react';
import yaml from 'js-yaml';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CssBaseline,
  FormControlLabel,
  Paper,
  Stack,
  Tab,
  Tabs,
  ThemeProvider,
  Typography,
  createTheme
} from '@mui/material';
import Editor from '@monaco-editor/react';
import { TopoViewer } from './TopoViewer';
import { mvNetworkStylesheet, mvNetworkTopology } from '../examples/mvNetwork';
import type { TopoDocument, TopoViewerToggles } from '../core/types';
import { validateTopoDocument } from '../core/validation';
import './workbench.css';

function composeSpec(topologyText: string, stylesheetText: string): TopoDocument {
  const topology = yaml.load(topologyText) as TopoDocument;
  const stylesheet = yaml.load(stylesheetText) as TopoDocument;
  return validateTopoDocument({
    ...(topology || {}),
    ...(stylesheet || {}),
    graph: topology?.graph || {},
    toggles: topology?.toggles || []
  }, 'Workbench YAML');
}

const initialTopologyYaml = yaml.dump(mvNetworkTopology, { lineWidth: 120, noRefs: true });
const initialStylesheetYaml = yaml.dump(mvNetworkStylesheet, { lineWidth: 120, noRefs: true });

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
  const [topologyText, setTopologyText] = useState(initialTopologyYaml);
  const [stylesheetText, setStylesheetText] = useState(initialStylesheetYaml);
  const [selectedLayers, setSelectedLayers] = useState<string[]>(mvNetworkTopology.graph?.layers?.map((layer) => layer.id) || []);
  const [toggles, setToggles] = useState<TopoViewerToggles>(() => Object.fromEntries((mvNetworkTopology.toggles || []).map((toggle) => [toggle.id, toggle.default !== false])));
  const [layoutRun, setLayoutRun] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const spec = useMemo(() => {
    try {
      setError(null);
      return composeSpec(topologyText, stylesheetText);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : String(parseError));
      return composeSpec(initialTopologyYaml, initialStylesheetYaml);
    }
  }, [stylesheetText, topologyText]);

  const layerCatalog = spec.graph?.layers || [];

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

          <Box className="topoviewer-editor">
            <Tabs
              value={activeTab}
              onChange={(_event, value: 'topology' | 'stylesheet') => setActiveTab(value)}
              variant="fullWidth"
            >
              <Tab value="topology" label="Topology YAML" />
              <Tab value="stylesheet" label="Stylesheet YAML" />
            </Tabs>
            <Editor
              value={activeTab === 'topology' ? topologyText : stylesheetText}
              language="yaml"
              theme="vs-dark"
              onChange={(value) => {
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
          </Box>

          <Box component="footer" className="topoviewer-workbench-footer">
            {error ? (
              <Alert severity="error" variant="outlined">{error}</Alert>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Rendered {spec.graph?.nodes?.length || 0} nodes, {spec.graph?.links?.length || 0} links, {spec.graph?.paths?.length || 0} paths.
              </Typography>
            )}
          </Box>
        </Paper>

        <Paper component="main" className="topoviewer-workbench-main" elevation={8}>
          <TopoViewer
            key={layoutRun}
            document={spec}
            selectedLayerIds={selectedLayers}
            toggles={toggles}
            layout={{ mode: 'force', ...(spec.layout || {}) }}
          />
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
