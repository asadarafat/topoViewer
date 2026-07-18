import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
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
import { StudioAccordion, StudioAccordionDetails, StudioAccordionSummary, StudioButtonBase, StudioFormControl, StudioFormLabel, StudioOption, StudioSearchField, StudioSelect } from '../../ui/controls';
import { StudioPanelHeader } from '../../ui/StudioPanel';
import type { StudioEdgeAuthoringTemplateId, StudioEdgeTemplateId, StudioPaletteTemplateId, StudioUserPreset } from './types';
import { UserPresetActions } from './UserPresetActions';
import { studioSpace } from '../../ui/muiSpacing';
import { createPaletteDragPreview, PaletteDragPreview } from './paletteDragPreview';

type PaletteCategory = 'Nodes' | 'Edges' | 'Annotations' | 'Presets';

type PalettePreview = 'controller' | 'directional-link' | 'link' | 'parallel-link' | 'parent-link-pipe' | 'parent-child' | 'path' | 'service';

interface PaletteTemplate {
  category: PaletteCategory;
  edgeAuthoring?: boolean;
  footprint?: { height: number; width: number };
  icon?: ReactNode;
  iconDataUri?: string;
  id: StudioPaletteTemplateId;
  label: string;
  placement: boolean;
  presetId?: string;
  preview?: PalettePreview;
  requiresTwoNodes?: boolean;
  summary: string;
}

const builtInTemplates: PaletteTemplate[] = [
  {
    category: 'Nodes',
    footprint: { height: 64, width: 64 },
    iconDataUri: studioVisualNodeTemplateDataUri('router'),
    id: 'router',
    label: 'Router',
    placement: true,
    summary: 'Square · SVG'
  },
  {
    category: 'Nodes',
    footprint: { height: 64, width: 190 },
    iconDataUri: studioVisualNodeTemplateDataUri('controller'),
    id: 'controller',
    label: 'Controller',
    placement: true,
    preview: 'controller',
    summary: 'Card · SVG + metadata'
  },
  {
    category: 'Nodes',
    footprint: { height: 60, width: 176 },
    id: 'service',
    label: 'Service',
    placement: true,
    preview: 'service',
    summary: 'Card · status preset'
  },
  {
    category: 'Nodes',
    footprint: { height: 150, width: 260 },
    id: 'parent-child',
    label: 'Parent with children',
    placement: true,
    preview: 'parent-child',
    summary: 'Nested node template'
  },
  {
    category: 'Edges',
    id: 'link',
    label: 'Link',
    placement: false,
    preview: 'link',
    summary: 'Directed connection'
  },
  {
    category: 'Edges',
    id: 'parallel-link',
    label: 'Parallel link',
    placement: false,
    preview: 'parallel-link',
    summary: '3 links · click to expand'
  },
  {
    category: 'Edges',
    id: 'parent-link-pipe',
    label: 'Parent link pipe',
    placement: false,
    preview: 'parent-link-pipe',
    summary: 'Carrier with child lane'
  },
  {
    category: 'Edges',
    id: 'path',
    label: 'Path',
    placement: false,
    preview: 'path',
    requiresTwoNodes: true,
    summary: 'Ordered traversal'
  },
  {
    category: 'Edges',
    id: 'directional-link',
    label: 'Directional traffic',
    placement: false,
    preview: 'directional-link',
    summary: 'Bidirectional values'
  },
  {
    category: 'Annotations',
    footprint: { height: 180, width: 280 },
    icon: <SelectAllIcon />,
    id: 'region',
    label: 'Region',
    placement: true,
    summary: 'Logical grouping'
  },
  {
    category: 'Annotations',
    footprint: { height: 96, width: 180 },
    icon: <CropSquareIcon />,
    id: 'shape',
    label: 'Shape',
    placement: true,
    summary: 'Canvas geometry'
  },
  {
    category: 'Annotations',
    footprint: { height: 88, width: 160 },
    icon: <ChatBubbleOutlineIcon />,
    id: 'callout',
    label: 'Callout',
    placement: true,
    summary: 'Anchored note'
  },
  {
    category: 'Annotations',
    footprint: { height: 64, width: 220 },
    icon: <TextFieldsIcon />,
    id: 'text',
    label: 'Text',
    placement: true,
    summary: 'Free annotation'
  }
];

interface ObjectPaletteProps {
  activeEdgeTemplate?: StudioEdgeAuthoringTemplateId;
  onCollapse(): void;
  onCreate(templateId: StudioPaletteTemplateId): boolean;
  onEdgeTemplateChange(templateId?: StudioEdgeAuthoringTemplateId): void;
  onDeletePreset(id: string): boolean;
  onPathModeChange(mode: NonNullable<CreateAuthoringPathOptions['mode']>): void;
  onRenamePreset(id: string, name: string): boolean;
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

function presetFootprint(preset: StudioUserPreset): {
  height: number;
  width: number;
} {
  const value = preset.item.value as Record<string, unknown>;
  const style = value.style && typeof value.style === 'object' && !Array.isArray(value.style) ? (value.style as Record<string, unknown>) : {};
  const size = Array.isArray(value.size) ? value.size.map(Number) : [];
  const width = Number(style.width ?? size[0]);
  const height = Number(style.height ?? size[1]);
  return {
    height: Number.isFinite(height) && height > 0 ? height : 60,
    width: Number.isFinite(width) && width > 0 ? width : 82
  };
}

function PalettePreviewGraphic({ preview }: { preview: PalettePreview }) {
  if (preview === 'service')
    return (
      <>
        <Typography className="studio-preview-service-icon" component="span" variant="caption">
          S
        </Typography>
        <Box className="studio-preview-card-lines" component="span" />
      </>
    );
  if (preview === 'parent-child')
    return (
      <>
        <Box className="studio-preview-parent" component="span" />
        <Box className="studio-preview-child studio-preview-child--left" component="span" />
        <Box className="studio-preview-child studio-preview-child--right" component="span" />
      </>
    );
  if (preview === 'controller') return <Box className="studio-preview-card-lines" component="span" />;
  return (
    <SvgIcon className="studio-preview-edge" viewBox="0 0 64 32">
      {preview === 'link' ? (
        <>
          <path d="M4 16H55" />
          <path className="studio-preview-edge-arrow" d="m55 12 6 4-6 4" />
        </>
      ) : null}
      {preview === 'parallel-link' ? (
        <>
          <path d="M4 9H60" />
          <path d="M4 16H60" />
          <path d="M4 23H60" />
        </>
      ) : null}
      {preview === 'parent-link-pipe' ? (
        <>
          <path className="studio-preview-edge-pipe" d="M4 16H60" />
          <path className="studio-preview-edge-lane" d="M4 16H60" />
        </>
      ) : null}
      {preview === 'path' ? (
        <>
          <path d="M4 22C22 22 25 9 42 11S55 8 60 6" />
          <circle cx="31" cy="14" r="3" />
        </>
      ) : null}
      {preview === 'directional-link' ? (
        <>
          <path className="studio-preview-edge-green" d="M4 10C22 8 42 8 60 10" />
          <path className="studio-preview-edge-orange" d="M60 22C42 24 22 24 4 22" />
        </>
      ) : null}
    </SvgIcon>
  );
}

export function ObjectPalette({ activeEdgeTemplate, onCollapse, onCreate, onDeletePreset, onEdgeTemplateChange, onPathModeChange, onRenamePreset, pathMode, presets, selectedNodeCount, state }: ObjectPaletteProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [query, setQuery] = useState('');
  const dragPreviewCleanupRef = useRef<() => void>();
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const previousPresetCount = useRef(presets.length);
  const templates = useMemo(
    () => [
      ...builtInTemplates,
      ...presets.map((preset): PaletteTemplate => {
        const linkPreset = preset.item.selection.kind === 'link';
        return {
          category: 'Presets',
          edgeAuthoring: linkPreset,
          icon: <DeviceHubIcon />,
          id: `preset:${preset.id}`,
          label: preset.name,
          footprint: linkPreset ? undefined : presetFootprint(preset),
          placement: !linkPreset,
          presetId: preset.id,
          preview: linkPreset ? 'link' : undefined,
          summary: linkPreset ? 'Saved link appearance' : 'Saved object'
        };
      })
    ],
    [presets]
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleTemplates = useMemo(
    () => (normalizedQuery ? templates.filter((template) => `${template.label} ${template.category} ${template.summary}`.toLocaleLowerCase().includes(normalizedQuery)) : templates),
    [normalizedQuery, templates]
  );
  const sections = categoryOrder.filter((category) => visibleTemplates.some((template) => template.category === category));

  useEffect(() => {
    if (presets.length > previousPresetCount.current) {
      setExpanded((current) => new Set(current).add('Presets'));
    }
    previousPresetCount.current = presets.length;
  }, [presets.length]);

  useEffect(() => () => dragPreviewCleanupRef.current?.(), []);

  function toggleCategory(category: PaletteCategory) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <Paper
      className="studio-palette"
      aria-label="Objects"
      component="aside"
      data-state={state}
      elevation={0}
      square
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        width: '100%'
      }}
    >
      <StudioPanelHeader onCollapse={onCollapse} title="Objects" />
      <Box className="studio-palette-search-wrap" sx={{ px: studioSpace.space12, py: studioSpace.space10 }}>
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
      <Box
        className="studio-palette-groups"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          px: studioSpace.space8,
          pb: studioSpace.space16
        }}
      >
        {sections.map((category) => {
          const items = visibleTemplates.filter((template) => template.category === category);
          const categoryExpanded = normalizedQuery ? true : expanded.has(category);
          return (
            <StudioAccordion expanded={categoryExpanded} key={category} onChange={() => toggleCategory(category)} square>
              <StudioAccordionSummary
                aria-controls={`studio-palette-${categorySlug(category)}-content`}
                aria-label={`${category} palette group`}
                expandIcon={<ExpandMoreIcon fontSize="small" />}
                id={`studio-palette-${categorySlug(category)}-heading`}
              >
                <Stack
                  direction="row"
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%'
                  }}
                >
                  <Typography component="span" variant="subtitle2">
                    {category}
                  </Typography>
                  <Typography color="text.secondary" component="span" variant="caption">
                    {items.length}
                  </Typography>
                </Stack>
              </StudioAccordionSummary>
              <StudioAccordionDetails
                aria-labelledby={`studio-palette-${categorySlug(category)}-heading`}
                className="studio-template-list"
                id={`studio-palette-${categorySlug(category)}-content`}
                sx={{ display: 'grid', gap: studioSpace.space2, p: 0 }}
              >
                {items.map((template) => {
                  const needsSelection = template.requiresTwoNodes && selectedNodeCount !== 2;
                  const edgeTemplateId = template.edgeAuthoring || isEdgeTemplateId(template.id) ? (template.id as StudioEdgeAuthoringTemplateId) : undefined;
                  const help = needsSelection
                    ? 'Select exactly two connected nodes first'
                    : edgeTemplateId
                      ? activeEdgeTemplate === template.id
                        ? 'Edge tool active'
                        : 'Select a node, then drag from a connection point'
                      : template.placement
                        ? 'Drag to canvas or click to add'
                        : template.summary;
                  const active = edgeTemplateId ? activeEdgeTemplate === template.id : false;
                  const preset = template.presetId ? presets.find((candidate) => candidate.id === template.presetId) : undefined;
                  return (
                    <Box
                      className="studio-template-entry"
                      key={template.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '72px minmax(0, 1fr) 28px',
                        minWidth: 0,
                        position: 'relative'
                      }}
                    >
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
                        onDragStart={
                          template.placement
                            ? (event) => {
                                dragPreviewCleanupRef.current?.();
                                onEdgeTemplateChange(undefined);
                                event.dataTransfer.effectAllowed = 'copy';
                                event.dataTransfer.setData('application/x-topoviewer-object', template.id);
                                event.dataTransfer.setData(
                                  'application/x-topoviewer-object-footprint',
                                  JSON.stringify(
                                    template.footprint || {
                                      height: 60,
                                      width: 82
                                    }
                                  )
                                );
                                dragPreviewCleanupRef.current = createPaletteDragPreview({
                                  dataTransfer: event.dataTransfer,
                                  label: template.label,
                                  preview: dragPreviewRef.current,
                                  source: event.currentTarget
                                });
                              }
                            : undefined
                        }
                        onDragEnd={
                          template.placement
                            ? () => {
                                dragPreviewCleanupRef.current?.();
                                dragPreviewCleanupRef.current = undefined;
                              }
                            : undefined
                        }
                        sx={{
                          alignItems: 'center',
                          borderRadius: 1,
                          cursor: edgeTemplateId ? 'pointer' : 'grab',
                          display: 'grid',
                          gap: 0,
                          gridColumn: '1 / -1',
                          gridTemplateColumns: '72px minmax(0, 1fr) 28px',
                          minHeight: 48,
                          pl: studioSpace.space6,
                          position: 'relative',
                          pr: studioSpace.space4,
                          py: studioSpace.space2,
                          textAlign: 'left',
                          width: '100%',
                          '&:hover, &:focus-visible': {
                            bgcolor: 'action.hover'
                          },
                          '&[data-active="true"]': {
                            bgcolor: 'action.selected'
                          },
                          '&[data-active="true"]::before': {
                            bgcolor: 'primary.main',
                            borderRadius: 1,
                            bottom: 7,
                            content: '""',
                            left: 0,
                            position: 'absolute',
                            top: 7,
                            width: 2
                          },
                          '& .studio-template-add': { opacity: 0 },
                          '&:hover .studio-template-add, &:focus-visible .studio-template-add, &[data-active="true"] .studio-template-add': { color: 'primary.main', opacity: 1 }
                        }}
                        title={help}
                      >
                        <Box className="studio-template-preview" component="span" aria-hidden="true" data-preview={template.preview} data-visual={template.iconDataUri ? 'svg' : template.preview ? 'preview' : 'icon'}>
                          {template.iconDataUri ? <Box alt="" component="img" draggable={false} src={template.iconDataUri} /> : null}
                          {template.preview ? <PalettePreviewGraphic preview={template.preview} /> : template.icon}
                        </Box>
                        <Box
                          className="studio-template-copy"
                          component="span"
                          sx={{
                            display: 'grid',
                            minWidth: 0,
                            '& > *': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }
                          }}
                        >
                          <Typography component="strong" variant="subtitle2">
                            {template.label}
                          </Typography>
                          <Typography color="text.secondary" component="small" variant="caption">
                            {template.summary}
                          </Typography>
                        </Box>
                        {!preset ? <AddIcon aria-hidden="true" className="studio-template-add" fontSize="small" sx={{ justifySelf: 'center' }} /> : null}
                      </StudioButtonBase>
                      {preset ? <UserPresetActions onDelete={onDeletePreset} onRename={onRenamePreset} preset={preset} /> : null}
                      {template.id === 'path' && selectedNodeCount === 2 ? (
                        <StudioFormControl
                          className="studio-path-mode"
                          sx={{
                            alignItems: 'center',
                            display: 'grid',
                            gap: studioSpace.space8,
                            gridColumn: '2 / -1',
                            gridTemplateColumns: 'auto minmax(0, 1fr)',
                            px: studioSpace.space8,
                            pb: studioSpace.space8
                          }}
                        >
                          <StudioFormLabel>Route</StudioFormLabel>
                          <StudioSelect aria-label="Path route" onChange={(event) => onPathModeChange(event.target.value as NonNullable<CreateAuthoringPathOptions['mode']>)} value={pathMode}>
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
      {visibleTemplates.length === 0 ? (
        <Typography color="text.secondary" role="status" sx={{ m: studioSpace.space12 }} variant="body2">
          No matching objects or templates
        </Typography>
      ) : null}
      <PaletteDragPreview previewRef={dragPreviewRef} />
    </Paper>
  );
}
