import { useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { studioVisualNodeTemplateDataUri } from '../../templates/starterNodeTemplates';
import type { StudioPaletteTemplateId, StudioUserPreset } from './types';

interface PaletteTemplate {
  category: 'Nodes' | 'Paths' | 'Regions' | 'Shapes' | 'Callouts' | 'Presets';
  glyph: string;
  id: StudioPaletteTemplateId;
  iconDataUri?: string;
  label: string;
}

const builtInTemplates: PaletteTemplate[] = [
  { category: 'Nodes', glyph: 'N', id: 'node', label: 'Basic node' },
  { category: 'Nodes', glyph: 'R', iconDataUri: studioVisualNodeTemplateDataUri('router'), id: 'router', label: 'Router' },
  { category: 'Nodes', glyph: 'SW', iconDataUri: studioVisualNodeTemplateDataUri('switch'), id: 'switch', label: 'Switch' },
  { category: 'Nodes', glyph: 'S', id: 'service', label: 'Service' },
  { category: 'Nodes', glyph: 'C', id: 'controller', label: 'Controller' },
  { category: 'Nodes', glyph: 'E', id: 'external', label: 'External' },
  { category: 'Paths', glyph: 'P', id: 'path', label: 'Basic path' },
  { category: 'Regions', glyph: 'RG', id: 'region', label: 'Basic region' },
  { category: 'Shapes', glyph: 'SH', id: 'shape', label: 'Basic shape' },
  { category: 'Callouts', glyph: 'CO', id: 'callout', label: 'Basic callout' }
];

interface ObjectPaletteProps {
  onCreate(templateId: StudioPaletteTemplateId): boolean;
  presets: StudioUserPreset[];
  state: 'default' | 'open' | 'closed';
}

export function ObjectPalette({ onCreate, presets, state }: ObjectPaletteProps) {
  const [query, setQuery] = useState('');
  const templates = useMemo(() => [
    ...builtInTemplates,
    ...presets.map((preset): PaletteTemplate => ({
      category: 'Presets', glyph: 'P', id: `preset:${preset.id}`, label: preset.name
    }))
  ], [presets]);
  const visibleTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return normalizedQuery
      ? templates.filter((template) => template.label.toLocaleLowerCase().includes(normalizedQuery))
      : templates;
  }, [query, templates]);
  const sections = [...new Set(visibleTemplates.map((template) => template.category))];

  return (
    <aside className="studio-palette" aria-label="Object palette" data-state={state}>
      <div className="studio-panel-heading"><h2>Objects</h2></div>
      <label className="studio-search">
        <SearchIcon fontSize="small" aria-hidden="true" />
        <span className="studio-visually-hidden">Search objects</span>
        <input
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search objects"
          type="search"
          value={query}
        />
      </label>
      {sections.map((category) => (
        <section className="studio-palette-section" key={category}>
          <h3>{category}</h3>
          <div className="studio-template-list">
            {visibleTemplates.filter((template) => template.category === category).map((template) => (
              <button
                aria-label={`Add ${template.label}`}
                className="studio-template"
                data-testid={`palette-${template.id}`}
                draggable
                key={template.id}
                onClick={() => onCreate(template.id)}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'copy';
                  event.dataTransfer.setData('application/x-topoviewer-object', template.id);
                }}
                title={`Add ${template.label}`}
                type="button"
              >
                <span className="studio-template-glyph" aria-hidden="true" data-visual={template.iconDataUri ? 'svg' : 'glyph'}>
                  {template.iconDataUri
                    ? <img alt="" draggable={false} src={template.iconDataUri} />
                    : template.glyph}
                </span>
                <span>{template.label}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      {visibleTemplates.length === 0 ? <p className="studio-palette-empty" role="status">No matching objects</p> : null}
    </aside>
  );
}
