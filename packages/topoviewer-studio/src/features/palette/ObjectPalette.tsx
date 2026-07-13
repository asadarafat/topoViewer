import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { studioVisualNodeTemplateDataUri } from '../../templates/starterNodeTemplates';
import {
  StudioButtonBase,
  StudioIconButton,
  StudioSearchField
} from '../../ui/controls';
import type { StudioEdgeTemplateId, StudioPaletteTemplateId, StudioUserPreset } from './types';

type PaletteCategory = 'Nodes' | 'Edges' | 'Annotations' | 'Presets';

type PalettePreview =
  | 'controller'
  | 'directional-link'
  | 'link'
  | 'parallel-link'
  | 'parent-link-pipe'
  | 'parent-child'
  | 'path'
  | 'service';

interface PaletteTemplate {
  category: PaletteCategory;
  icon?: ReactNode;
  iconDataUri?: string;
  id: StudioPaletteTemplateId;
  label: string;
  placement: boolean;
  preview?: PalettePreview;
  requiresTwoNodes?: boolean;
  summary: string;
}

const builtInTemplates: PaletteTemplate[] = [
  { category: 'Nodes', iconDataUri: studioVisualNodeTemplateDataUri('router'), id: 'router', label: 'Router', placement: true, summary: 'Square · SVG' },
  { category: 'Nodes', iconDataUri: studioVisualNodeTemplateDataUri('controller'), id: 'controller', label: 'Controller', placement: true, preview: 'controller', summary: 'Card · SVG + metadata' },
  { category: 'Nodes', id: 'service', label: 'Service', placement: true, preview: 'service', summary: 'Card · status preset' },
  { category: 'Nodes', id: 'parent-child', label: 'Parent with children', placement: true, preview: 'parent-child', summary: 'Nested node template' },
  { category: 'Edges', id: 'link', label: 'Link', placement: false, preview: 'link', summary: 'Directed connection' },
  { category: 'Edges', id: 'parallel-link', label: 'Parallel link', placement: false, preview: 'parallel-link', summary: '3 links · click to expand' },
  { category: 'Edges', id: 'parent-link-pipe', label: 'Parent link pipe', placement: false, preview: 'parent-link-pipe', summary: 'Carrier with child lane' },
  { category: 'Edges', id: 'path', label: 'Path', placement: false, preview: 'path', requiresTwoNodes: true, summary: 'Ordered traversal' },
  { category: 'Edges', id: 'directional-link', label: 'Directional traffic', placement: false, preview: 'directional-link', summary: 'Bidirectional values' },
  { category: 'Annotations', icon: <SelectAllIcon />, id: 'region', label: 'Region', placement: true, summary: 'Logical grouping' },
  { category: 'Annotations', icon: <CropSquareIcon />, id: 'shape', label: 'Shape', placement: true, summary: 'Canvas geometry' },
  { category: 'Annotations', icon: <ChatBubbleOutlineIcon />, id: 'callout', label: 'Callout', placement: true, summary: 'Anchored note' },
  { category: 'Annotations', icon: <TextFieldsIcon />, id: 'text', label: 'Text', placement: true, summary: 'Free annotation' }
];

interface ObjectPaletteProps {
  activeEdgeTemplate?: StudioEdgeTemplateId;
  onCollapse(): void;
  onCreate(templateId: StudioPaletteTemplateId): boolean;
  onEdgeTemplateChange(templateId?: StudioEdgeTemplateId): void;
  presets: StudioUserPreset[];
  selectedNodeCount: number;
  state: 'default' | 'open' | 'closed';
}

const initialExpanded = new Set<PaletteCategory>(['Nodes', 'Edges']);
const categoryOrder: PaletteCategory[] = ['Nodes', 'Edges', 'Annotations', 'Presets'];
const edgeTemplateIds = new Set<StudioPaletteTemplateId>(['link', 'parallel-link', 'parent-link-pipe', 'directional-link']);

function isEdgeTemplateId(templateId: StudioPaletteTemplateId): templateId is StudioEdgeTemplateId {
  return edgeTemplateIds.has(templateId);
}

function categorySlug(category: PaletteCategory) {
  return category.toLocaleLowerCase().replaceAll(' ', '-');
}

function PalettePreviewGraphic({ preview }: { preview: PalettePreview }) {
  if (preview === 'service') return <><span className="studio-preview-service-icon">S</span><span className="studio-preview-card-lines" /></>;
  if (preview === 'parent-child') return <><span className="studio-preview-parent" /><span className="studio-preview-child studio-preview-child--left" /><span className="studio-preview-child studio-preview-child--right" /></>;
  if (preview === 'controller') return <span className="studio-preview-card-lines" />;
  return (
    <svg className="studio-preview-edge" viewBox="0 0 64 32">
      {preview === 'link' ? <><path d="M4 16H55" /><path className="studio-preview-edge-arrow" d="m55 12 6 4-6 4" /></> : null}
      {preview === 'parallel-link' ? <><path d="M4 9H60" /><path d="M4 16H60" /><path d="M4 23H60" /></> : null}
      {preview === 'parent-link-pipe' ? <><path className="studio-preview-edge-pipe" d="M4 16H60" /><path className="studio-preview-edge-lane" d="M4 16H60" /></> : null}
      {preview === 'path' ? <><path d="M4 22C22 22 25 9 42 11S55 8 60 6" /><circle cx="31" cy="14" r="3" /></> : null}
      {preview === 'directional-link' ? <><path className="studio-preview-edge-green" d="M4 10C22 8 42 8 60 10" /><path className="studio-preview-edge-orange" d="M60 22C42 24 22 24 4 22" /></> : null}
    </svg>
  );
}

export function ObjectPalette({
  activeEdgeTemplate,
  onCollapse,
  onCreate,
  onEdgeTemplateChange,
  presets,
  selectedNodeCount,
  state
}: ObjectPaletteProps) {
  const [activeTemplateId, setActiveTemplateId] = useState<StudioPaletteTemplateId | undefined>('router');
  const [expanded, setExpanded] = useState(initialExpanded);
  const [query, setQuery] = useState('');
  const previousPresetCount = useRef(presets.length);
  const templates = useMemo(() => [
    ...builtInTemplates,
    ...presets.map((preset): PaletteTemplate => ({
      category: 'Presets', icon: <DeviceHubIcon />, id: `preset:${preset.id}`, label: preset.name,
      placement: true, summary: 'Saved object preset'
    }))
  ], [presets]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleTemplates = useMemo(() => normalizedQuery
    ? templates.filter((template) => (
      `${template.label} ${template.category} ${template.summary}`.toLocaleLowerCase().includes(normalizedQuery)
    ))
    : templates, [normalizedQuery, templates]);
  const sections = categoryOrder.filter((category) => visibleTemplates.some((template) => template.category === category));

  useEffect(() => {
    if (presets.length > previousPresetCount.current) {
      setExpanded((current) => new Set(current).add('Presets'));
    }
    previousPresetCount.current = presets.length;
  }, [presets.length]);

  function toggleCategory(category: PaletteCategory) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <aside className="studio-palette" aria-label="Object palette" data-state={state}>
      <div className="studio-panel-heading">
        <h2>Object Palette</h2>
        <StudioIconButton aria-label="Collapse object palette" onClick={onCollapse} title="Collapse object palette">
          <ChevronLeftIcon fontSize="small" />
        </StudioIconButton>
      </div>
      <div className="studio-palette-search-wrap">
        <StudioSearchField
          aria-label="Search objects and templates"
          autoComplete="off"
          className="studio-search"
          clearLabel="Clear object search"
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery('')}
          placeholder="Search objects and templates"
          value={query}
        />
      </div>
      <div className="studio-palette-groups">
        {sections.map((category) => {
          const items = visibleTemplates.filter((template) => template.category === category);
          const categoryExpanded = normalizedQuery ? true : expanded.has(category);
          return (
            <section className={`studio-palette-group${categoryExpanded ? '' : ' studio-palette-group--collapsed'}`} key={category}>
              <StudioButtonBase
                aria-controls={`studio-palette-${categorySlug(category)}-content`}
                aria-expanded={categoryExpanded}
                aria-label={`${category} palette group`}
                className="studio-palette-group-heading"
                onClick={() => toggleCategory(category)}
              >
                <span className="studio-palette-group-title">
                  <ExpandMoreIcon aria-hidden="true" className="studio-palette-group-chevron" fontSize="small" />
                  {category}
                </span>
                <small>{items.length}</small>
              </StudioButtonBase>
              {categoryExpanded ? (
                <div className="studio-template-list" id={`studio-palette-${categorySlug(category)}-content`}>
                  {items.map((template) => {
                    const needsSelection = template.requiresTwoNodes && selectedNodeCount !== 2;
                    const edgeTemplateId = isEdgeTemplateId(template.id) ? template.id : undefined;
                    const help = needsSelection
                      ? 'Select exactly two connected nodes first'
                      : edgeTemplateId
                        ? activeEdgeTemplate === template.id ? 'Edge tool active' : 'Click to draw between node endpoints'
                        : template.placement ? 'Drag to canvas or click to add' : template.summary;
                    const active = edgeTemplateId ? activeEdgeTemplate === template.id : activeTemplateId === template.id;
                    return (
                      <StudioButtonBase
                        aria-label={`${template.label}: ${help}`}
                        aria-pressed={active}
                        className="studio-template"
                        data-active={active || undefined}
                        data-family={categorySlug(template.category)}
                        data-testid={`palette-${template.id}`}
                        draggable={template.placement}
                        key={template.id}
                        onClick={() => {
                          if (edgeTemplateId) {
                            setActiveTemplateId(undefined);
                            onEdgeTemplateChange(active ? undefined : edgeTemplateId);
                            return;
                          }
                          onEdgeTemplateChange(undefined);
                          setActiveTemplateId(template.id);
                          onCreate(template.id);
                        }}
                        onDragStart={template.placement ? (event) => {
                          onEdgeTemplateChange(undefined);
                          setActiveTemplateId(template.id);
                          event.dataTransfer.effectAllowed = 'copy';
                          event.dataTransfer.setData('application/x-topoviewer-object', template.id);
                        } : undefined}
                        title={help}
                      >
                        <span
                          className="studio-template-preview"
                          aria-hidden="true"
                          data-preview={template.preview}
                          data-visual={template.iconDataUri ? 'svg' : template.preview ? 'preview' : 'icon'}
                        >
                          {template.iconDataUri ? <img alt="" draggable={false} src={template.iconDataUri} /> : null}
                          {template.preview ? <PalettePreviewGraphic preview={template.preview} /> : template.icon}
                        </span>
                        <span className="studio-template-copy"><strong>{template.label}</strong><small>{template.summary}</small></span>
                        <AddIcon aria-hidden="true" className="studio-template-add" fontSize="small" />
                      </StudioButtonBase>
                    );
                  })}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
      {visibleTemplates.length === 0 ? <p className="studio-palette-empty" role="status">No matching objects or templates</p> : null}
    </aside>
  );
}
