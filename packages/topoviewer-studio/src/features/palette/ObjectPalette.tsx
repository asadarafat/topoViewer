import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import type { CreateAuthoringPathOptions } from 'topoviewer/authoring';
import { studioVisualNodeTemplateDataUri } from '../../templates/starterNodeTemplates';
import {
  StudioAccordion,
  StudioAccordionDetails,
  StudioAccordionSummary,
  StudioButtonBase,
  StudioFormControl,
  StudioFormLabel,
  StudioIconButton,
  StudioOption,
  StudioSearchField,
  StudioSelect
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
  footprint?: { height: number; width: number };
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
  { category: 'Nodes', footprint: { height: 64, width: 64 }, iconDataUri: studioVisualNodeTemplateDataUri('router'), id: 'router', label: 'Router', placement: true, summary: 'Square · SVG' },
  { category: 'Nodes', footprint: { height: 64, width: 190 }, iconDataUri: studioVisualNodeTemplateDataUri('controller'), id: 'controller', label: 'Controller', placement: true, preview: 'controller', summary: 'Card · SVG + metadata' },
  { category: 'Nodes', footprint: { height: 60, width: 176 }, id: 'service', label: 'Service', placement: true, preview: 'service', summary: 'Card · status preset' },
  { category: 'Nodes', footprint: { height: 150, width: 260 }, id: 'parent-child', label: 'Parent with children', placement: true, preview: 'parent-child', summary: 'Nested node template' },
  { category: 'Edges', id: 'link', label: 'Link', placement: false, preview: 'link', summary: 'Directed connection' },
  { category: 'Edges', id: 'parallel-link', label: 'Parallel link', placement: false, preview: 'parallel-link', summary: '3 links · click to expand' },
  { category: 'Edges', id: 'parent-link-pipe', label: 'Parent link pipe', placement: false, preview: 'parent-link-pipe', summary: 'Carrier with child lane' },
  { category: 'Edges', id: 'path', label: 'Path', placement: false, preview: 'path', requiresTwoNodes: true, summary: 'Ordered traversal' },
  { category: 'Edges', id: 'directional-link', label: 'Directional traffic', placement: false, preview: 'directional-link', summary: 'Bidirectional values' },
  { category: 'Annotations', footprint: { height: 180, width: 280 }, icon: <SelectAllIcon />, id: 'region', label: 'Region', placement: true, summary: 'Logical grouping' },
  { category: 'Annotations', footprint: { height: 96, width: 180 }, icon: <CropSquareIcon />, id: 'shape', label: 'Shape', placement: true, summary: 'Canvas geometry' },
  { category: 'Annotations', footprint: { height: 88, width: 160 }, icon: <ChatBubbleOutlineIcon />, id: 'callout', label: 'Callout', placement: true, summary: 'Anchored note' },
  { category: 'Annotations', footprint: { height: 64, width: 220 }, icon: <TextFieldsIcon />, id: 'text', label: 'Text', placement: true, summary: 'Free annotation' }
];

interface ObjectPaletteProps {
  activeEdgeTemplate?: StudioEdgeTemplateId;
  onCollapse(): void;
  onCreate(templateId: StudioPaletteTemplateId): boolean;
  onEdgeTemplateChange(templateId?: StudioEdgeTemplateId): void;
  onPathModeChange(mode: NonNullable<CreateAuthoringPathOptions['mode']>): void;
  pathMode: NonNullable<CreateAuthoringPathOptions['mode']>;
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

function presetFootprint(preset: StudioUserPreset): { height: number; width: number } {
  const value = preset.item.value as Record<string, unknown>;
  const style = value.style && typeof value.style === 'object' && !Array.isArray(value.style)
    ? value.style as Record<string, unknown>
    : {};
  const size = Array.isArray(value.size) ? value.size.map(Number) : [];
  const width = Number(style.width ?? size[0]);
  const height = Number(style.height ?? size[1]);
  return {
    height: Number.isFinite(height) && height > 0 ? height : 60,
    width: Number.isFinite(width) && width > 0 ? width : 82
  };
}

function PalettePreviewGraphic({ preview }: { preview: PalettePreview }) {
  if (preview === 'service') return <><Box className="studio-preview-service-icon" component="span">S</Box><Box className="studio-preview-card-lines" component="span" /></>;
  if (preview === 'parent-child') return <><Box className="studio-preview-parent" component="span" /><Box className="studio-preview-child studio-preview-child--left" component="span" /><Box className="studio-preview-child studio-preview-child--right" component="span" /></>;
  if (preview === 'controller') return <Box className="studio-preview-card-lines" component="span" />;
  return (
    <SvgIcon className="studio-preview-edge" viewBox="0 0 64 32">
      {preview === 'link' ? <><path d="M4 16H55" /><path className="studio-preview-edge-arrow" d="m55 12 6 4-6 4" /></> : null}
      {preview === 'parallel-link' ? <><path d="M4 9H60" /><path d="M4 16H60" /><path d="M4 23H60" /></> : null}
      {preview === 'parent-link-pipe' ? <><path className="studio-preview-edge-pipe" d="M4 16H60" /><path className="studio-preview-edge-lane" d="M4 16H60" /></> : null}
      {preview === 'path' ? <><path d="M4 22C22 22 25 9 42 11S55 8 60 6" /><circle cx="31" cy="14" r="3" /></> : null}
      {preview === 'directional-link' ? <><path className="studio-preview-edge-green" d="M4 10C22 8 42 8 60 10" /><path className="studio-preview-edge-orange" d="M60 22C42 24 22 24 4 22" /></> : null}
    </SvgIcon>
  );
}

export function ObjectPalette({
  activeEdgeTemplate,
  onCollapse,
  onCreate,
  onEdgeTemplateChange,
  onPathModeChange,
  pathMode,
  presets,
  selectedNodeCount,
  state
}: ObjectPaletteProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [query, setQuery] = useState('');
  const previousPresetCount = useRef(presets.length);
  const templates = useMemo(() => [
    ...builtInTemplates,
    ...presets.map((preset): PaletteTemplate => ({
      category: 'Presets', icon: <DeviceHubIcon />, id: `preset:${preset.id}`, label: preset.name,
      footprint: presetFootprint(preset), placement: true, summary: 'Saved object preset'
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
    <Paper className="studio-palette" aria-label="Objects" component="aside" data-state={state} elevation={0} square>
      <Box className="studio-panel-heading">
        <Typography component="h2" variant="subtitle2">Objects</Typography>
        <StudioIconButton aria-label="Collapse Objects panel" onClick={onCollapse} title="Collapse Objects panel">
          <ChevronLeftIcon fontSize="small" />
        </StudioIconButton>
      </Box>
      <Box className="studio-palette-search-wrap">
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
      </Box>
      <Box className="studio-palette-groups">
        {sections.map((category) => {
          const items = visibleTemplates.filter((template) => template.category === category);
          const categoryExpanded = normalizedQuery ? true : expanded.has(category);
          return (
            <StudioAccordion
              className={`studio-palette-group${categoryExpanded ? '' : ' studio-palette-group--collapsed'}`}
              expanded={categoryExpanded}
              key={category}
              onChange={() => toggleCategory(category)}
              square
            >
              <StudioAccordionSummary
                aria-controls={`studio-palette-${categorySlug(category)}-content`}
                aria-label={`${category} palette group`}
                expandIcon={<ExpandMoreIcon fontSize="small" />}
                id={`studio-palette-${categorySlug(category)}-heading`}
              >
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Typography component="span" variant="subtitle2">{category}</Typography>
                  <Typography color="text.secondary" component="span" variant="caption">{items.length}</Typography>
                </Stack>
              </StudioAccordionSummary>
              <StudioAccordionDetails className="studio-template-list" id={`studio-palette-${categorySlug(category)}-content`}>
                  {items.map((template) => {
                    const needsSelection = template.requiresTwoNodes && selectedNodeCount !== 2;
                    const edgeTemplateId = isEdgeTemplateId(template.id) ? template.id : undefined;
                    const help = needsSelection
                      ? 'Select exactly two connected nodes first'
                      : edgeTemplateId
                        ? activeEdgeTemplate === template.id ? 'Edge tool active' : 'Select a node, then drag from a connection point'
                        : template.placement ? 'Drag to canvas or click to add' : template.summary;
                    const active = edgeTemplateId ? activeEdgeTemplate === template.id : false;
                    return (
                      <Box className="studio-template-entry" key={template.id}>
                        <StudioButtonBase
                          aria-label={`${template.label}: ${help}`}
                          aria-pressed={edgeTemplateId ? active : undefined}
                          className="studio-template"
                          data-active={active || undefined}
                          data-family={categorySlug(template.category)}
                          data-testid={`palette-${template.id}`}
                          draggable={template.placement}
                          onClick={() => {
                            if (edgeTemplateId) {
                              onEdgeTemplateChange(active ? undefined : edgeTemplateId);
                              return;
                            }
                            onEdgeTemplateChange(undefined);
                            onCreate(template.id);
                          }}
                          onDragStart={template.placement ? (event) => {
                            onEdgeTemplateChange(undefined);
                            event.dataTransfer.effectAllowed = 'copy';
                            event.dataTransfer.setData('application/x-topoviewer-object', template.id);
                            event.dataTransfer.setData('application/x-topoviewer-object-footprint', JSON.stringify(template.footprint || { height: 60, width: 82 }));
                          } : undefined}
                          title={help}
                        >
                          <Box
                            className="studio-template-preview"
                            component="span"
                            aria-hidden="true"
                            data-preview={template.preview}
                            data-visual={template.iconDataUri ? 'svg' : template.preview ? 'preview' : 'icon'}
                          >
                            {template.iconDataUri ? <Box alt="" component="img" draggable={false} src={template.iconDataUri} /> : null}
                            {template.preview ? <PalettePreviewGraphic preview={template.preview} /> : template.icon}
                          </Box>
                          <Box className="studio-template-copy" component="span"><Typography component="strong" variant="subtitle2">{template.label}</Typography><Typography component="small" variant="caption">{template.summary}</Typography></Box>
                          <AddIcon aria-hidden="true" className="studio-template-add" fontSize="small" />
                        </StudioButtonBase>
                        {template.id === 'path' && selectedNodeCount === 2 ? (
                          <StudioFormControl className="studio-path-mode">
                            <StudioFormLabel>Route</StudioFormLabel>
                            <StudioSelect
                              aria-label="Path route"
                              onChange={(event) => onPathModeChange(event.target.value as NonNullable<CreateAuthoringPathOptions['mode']>)}
                              value={pathMode}
                            >
                              <StudioOption value="shortest">Shortest traversal</StudioOption>
                              <StudioOption value="explicit">Selected order</StudioOption>
                              <StudioOption value="loose">Loose endpoints</StudioOption>
                            </StudioSelect>
                          </StudioFormControl>
                        ) : null}
                      </Box>
                    );
                  })}
              </StudioAccordionDetails>
            </StudioAccordion>
          );
        })}
      </Box>
      {visibleTemplates.length === 0 ? <Typography className="studio-palette-empty" role="status" variant="body2">No matching objects or templates</Typography> : null}
    </Paper>
  );
}
