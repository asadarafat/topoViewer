import { useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import type { StudioPaletteTemplateId, StudioUserPreset } from './types';

interface PaletteTemplate {
  category: 'Topology' | 'Structure' | 'Annotations' | 'Assets' | 'Presets';
  glyph: string;
  id: StudioPaletteTemplateId;
  label: string;
}

const builtInTemplates: PaletteTemplate[] = [
  { category: 'Topology', glyph: 'N', id: 'node', label: 'Node' },
  { category: 'Topology', glyph: 'R', id: 'router', label: 'Router' },
  { category: 'Topology', glyph: 'S', id: 'service', label: 'Service' },
  { category: 'Topology', glyph: 'C', id: 'controller', label: 'Controller' },
  { category: 'Topology', glyph: 'E', id: 'external', label: 'External' },
  { category: 'Structure', glyph: 'P', id: 'path', label: 'Path' },
  { category: 'Structure', glyph: 'RG', id: 'region', label: 'Region' },
  { category: 'Annotations', glyph: 'SH', id: 'shape', label: 'Shape' },
  { category: 'Annotations', glyph: 'CO', id: 'callout', label: 'Callout' },
  { category: 'Assets', glyph: 'SVG', id: 'asset-router', label: 'Router icon' }
];

interface ObjectPaletteProps {
  onCreate(templateId: StudioPaletteTemplateId): void;
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
                <span className="studio-template-glyph" aria-hidden="true">{template.glyph}</span>
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
