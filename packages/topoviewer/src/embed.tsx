import { createRoot } from 'react-dom/client';
import { useMemo, useState } from 'react';
import yaml from 'js-yaml';
import { TopoViewer } from './components/TopoViewer';
import type { LayerDefinition, ToggleDefinition, TopoDocument, TopoViewerToggles } from './core/types';
import { validateTopoDocument } from './core/validation';

type EmbedElement = HTMLElement & {
  dataset: {
    topology?: string;
    stylesheet?: string;
    controls?: string;
    controlsOpen?: string;
    topoviewerMounted?: string;
  };
};

function composeSpec(topology: TopoDocument, stylesheet: TopoDocument): TopoDocument {
  return validateTopoDocument({
    ...(topology || {}),
    ...(stylesheet || {}),
    graph: topology?.graph || {},
    toggles: topology?.toggles || stylesheet?.toggles || []
  }, 'TopoViewer embed YAML');
}

async function loadYaml(url: string): Promise<TopoDocument> {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  }

  const text = await response.text();
  return (yaml.load(text) || {}) as TopoDocument;
}

function defaultToggles(document: TopoDocument): TopoViewerToggles {
  return Object.fromEntries((document.toggles || []).map((toggle) => [toggle.id, toggle.default !== false]));
}

function EmbeddedControls({
  layers,
  selectedLayerIds,
  toggles,
  toggleDefinitions,
  onLayerChange,
  onToggleChange,
  onSelectAllLayers,
  onClearLayers
}: {
  layers: LayerDefinition[];
  selectedLayerIds: string[];
  toggles: TopoViewerToggles;
  toggleDefinitions: ToggleDefinition[];
  onLayerChange: (layerId: string, enabled: boolean) => void;
  onToggleChange: (toggleId: string, enabled: boolean) => void;
  onSelectAllLayers: () => void;
  onClearLayers: () => void;
}) {
  return (
    <div className="topoviewer-embed-controls">
      <div className="topoviewer-embed-control-group">
        <span className="topoviewer-embed-control-label">Layers</span>
        {layers.map((layer) => (
          <label key={layer.id} className="topoviewer-embed-check">
            <input
              type="checkbox"
              checked={selectedLayerIds.includes(layer.id)}
              onChange={(event) => onLayerChange(layer.id, event.target.checked)}
            />
            <span>{layer.name || layer.id}</span>
          </label>
        ))}
        <button type="button" onClick={onSelectAllLayers}>All</button>
        <button type="button" onClick={onClearLayers}>None</button>
      </div>
      {toggleDefinitions.length ? (
        <div className="topoviewer-embed-control-group">
          <span className="topoviewer-embed-control-label">Display</span>
          {toggleDefinitions.map((toggle) => (
            <label key={toggle.id} className="topoviewer-embed-check">
              <input
                type="checkbox"
                checked={!!toggles[toggle.id]}
                onChange={(event) => onToggleChange(toggle.id, event.target.checked)}
              />
              <span>{toggle.name || toggle.id}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EmbeddedTopoViewer({
  documentSpec,
  controlsEnabled = true,
  controlsDefaultOpen = false
}: {
  documentSpec: TopoDocument;
  controlsEnabled?: boolean;
  controlsDefaultOpen?: boolean;
}) {
  const layers = useMemo(() => documentSpec.graph?.layers || [], [documentSpec]);
  const toggleDefinitions = useMemo(() => documentSpec.toggles || [], [documentSpec]);
  const [selectedLayerIds, setSelectedLayerIds] = useState(() => layers.map((layer) => layer.id));
  const [toggles, setToggles] = useState<TopoViewerToggles>(() => defaultToggles(documentSpec));
  const [controlsOpen, setControlsOpen] = useState(controlsDefaultOpen);

  const controls = controlsEnabled ? (
    <EmbeddedControls
      layers={layers}
      selectedLayerIds={selectedLayerIds}
      toggles={toggles}
      toggleDefinitions={toggleDefinitions}
      onLayerChange={(layerId, enabled) => {
        setSelectedLayerIds((current) => enabled
          ? [...new Set([...current, layerId])]
          : current.filter((item) => item !== layerId));
      }}
      onToggleChange={(toggleId, enabled) => setToggles((current) => ({ ...current, [toggleId]: enabled }))}
      onSelectAllLayers={() => setSelectedLayerIds(layers.map((layer) => layer.id))}
      onClearLayers={() => setSelectedLayerIds([])}
    />
  ) : null;

  return (
    <div className="topoviewer-embed-shell">
      <div className="topoviewer-embed-viewport">
        {controlsEnabled && controlsOpen ? (
          <div className="topoviewer-embed-controls-overlay">
            {controls}
          </div>
        ) : null}
        <TopoViewer
          document={documentSpec}
          selectedLayerIds={selectedLayerIds}
          toggles={toggles}
          layout={documentSpec.layout}
          controlPanelToggle={controlsEnabled ? {
            enabled: true,
            open: controlsOpen,
            onToggle: () => setControlsOpen((current) => !current)
          } : undefined}
        />
      </div>
    </div>
  );
}

function renderError(container: HTMLElement, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  container.innerHTML = '';
  const pre = document.createElement('pre');
  pre.className = 'topoviewer-error';
  pre.textContent = message;
  container.appendChild(pre);
}

async function mount(container: EmbedElement): Promise<void> {
  if (!container.dataset.topology) {
    throw new Error('TopoViewer embed is missing data-topology.');
  }

  const [topology, stylesheet] = await Promise.all([
    loadYaml(container.dataset.topology),
    container.dataset.stylesheet ? loadYaml(container.dataset.stylesheet) : Promise.resolve({})
  ]);

  const documentSpec = composeSpec(topology, stylesheet);
  const root = createRoot(container);
  root.render(
    <EmbeddedTopoViewer
      documentSpec={documentSpec}
      controlsEnabled={container.dataset.controls !== 'false'}
      controlsDefaultOpen={container.dataset.controlsOpen === 'true'}
    />
  );
}

export function mountAll(): void {
  document.querySelectorAll<EmbedElement>('.topoviewer-embed').forEach((container) => {
    if (container.dataset.topoviewerMounted === 'true') return;
    container.dataset.topoviewerMounted = 'true';
    mount(container).catch((error) => renderError(container, error));
  });
}

declare global {
  interface Window {
    TopoViewerEmbed?: {
      mountAll: typeof mountAll;
    };
  }
}

window.TopoViewerEmbed = { mountAll };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountAll, { once: true });
} else {
  mountAll();
}
