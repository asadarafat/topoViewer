import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AddIcon from '@mui/icons-material/AddOutlined';
import AddLinkIcon from '@mui/icons-material/AddLinkOutlined';
import CheckIcon from '@mui/icons-material/CheckOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreOutlined';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { CreateAuthoringPathOptions } from 'topoviewer/authoring';
import { StudioAccordion, StudioAccordionDetails, StudioAccordionSummary, StudioButtonBase, StudioFormControl, StudioFormLabel, StudioOption, StudioSearchField, StudioSelect } from '../../ui/controls';
import { StudioPanelHeader } from '../../ui/StudioPanel';
import type { StudioEdgeAuthoringTemplateId, StudioEdgeTemplateId, StudioPaletteTemplateId, StudioUserPreset } from './types';
import { UserPresetActions } from './UserPresetActions';
import { studioSpace } from '../../ui/muiSpacing';
import {
  StudioCalloutIcon,
  StudioControllerIcon,
  StudioDirectionalLinkIcon,
  StudioLinkIcon,
  StudioParallelLinkIcon,
  StudioParentChildIcon,
  StudioParentLinkPipeIcon,
  StudioPathIcon,
  StudioPresetIcon,
  StudioRegionIcon,
  StudioRouterIcon,
  StudioServiceIcon,
  StudioShapeIcon,
  StudioTextIcon
} from '../../ui/StudioSemanticIcons';
import { createPaletteDragPreview, PaletteDragPreview } from './paletteDragPreview';

type PaletteCategory = 'Nodes' | 'Edges' | 'Annotations' | 'Presets';

interface PaletteTemplate {
  category: PaletteCategory;
  edgeAuthoring?: boolean;
  footprint?: { height: number; width: number };
  icon?: ReactNode;
  id: StudioPaletteTemplateId;
  label: string;
  placement: boolean;
  presetId?: string;
  requiresTwoNodes?: boolean;
  summary: string;
}

const builtInTemplates: PaletteTemplate[] = [
  {
    category: 'Nodes',
    footprint: { height: 64, width: 64 },
    icon: <StudioRouterIcon data-material-icon="StudioRouterOutlined" />,
    id: 'router',
    label: 'Router',
    placement: true,
    summary: 'Square · SVG'
  },
  {
    category: 'Nodes',
    footprint: { height: 64, width: 190 },
    icon: <StudioControllerIcon data-material-icon="StudioControllerOutlined" />,
    id: 'controller',
    label: 'Controller',
    placement: true,
    summary: 'Card · SVG + metadata'
  },
  {
    category: 'Nodes',
    footprint: { height: 60, width: 176 },
    icon: <StudioServiceIcon data-material-icon="DnsOutlined" />,
    id: 'service',
    label: 'Service',
    placement: true,
    summary: 'Card · status preset'
  },
  {
    category: 'Nodes',
    footprint: { height: 150, width: 260 },
    icon: <StudioParentChildIcon data-material-icon="AccountTreeOutlined" />,
    id: 'parent-child',
    label: 'Parent with child',
    placement: true,
    summary: 'Nested node template'
  },
  {
    category: 'Edges',
    icon: <StudioLinkIcon data-material-icon="TrendingFlatOutlined" />,
    id: 'link',
    label: 'Link',
    placement: false,
    summary: 'Directed connection'
  },
  {
    category: 'Edges',
    icon: (
      <StudioParallelLinkIcon
        data-material-icon="StudioParallelLinkOutlined"
        data-studio-semantic-icon="parallel-link"
      />
    ),
    id: 'parallel-link',
    label: 'Parallel link',
    placement: false,
    summary: '3 links · click to expand'
  },
  {
    category: 'Edges',
    icon: (
      <StudioParentLinkPipeIcon
        data-material-icon="StudioParentLinkPipeOutlined"
        data-studio-semantic-icon="parent-link-pipe"
      />
    ),
    id: 'parent-link-pipe',
    label: 'Parent link pipe',
    placement: false,
    summary: 'Carrier with child lane'
  },
  {
    category: 'Edges',
    icon: (
      <StudioPathIcon
        data-material-icon="TimelineOutlined"
        data-studio-semantic-icon="path"
      />
    ),
    id: 'path',
    label: 'Path',
    placement: false,
    requiresTwoNodes: true,
    summary: 'Ordered traversal'
  },
  {
    category: 'Edges',
    icon: (
      <StudioDirectionalLinkIcon
        data-material-icon="RepeatOutlined"
        data-studio-semantic-icon="directional-link"
      />
    ),
    id: 'directional-link',
    label: 'Directional traffic',
    placement: false,
    summary: 'Bidirectional values'
  },
  {
    category: 'Annotations',
    footprint: { height: 180, width: 280 },
    icon: <StudioRegionIcon data-material-icon="SelectAllOutlined" data-studio-semantic-icon="region" />,
    id: 'region',
    label: 'Region',
    placement: true,
    summary: 'Logical grouping'
  },
  {
    category: 'Annotations',
    footprint: { height: 96, width: 180 },
    icon: <StudioShapeIcon data-material-icon="ShapeLineOutlined" data-studio-semantic-icon="shape" />,
    id: 'shape',
    label: 'Shape',
    placement: true,
    summary: 'Canvas geometry'
  },
  {
    category: 'Annotations',
    footprint: { height: 88, width: 160 },
    icon: <StudioCalloutIcon data-material-icon="ChatBubbleOutlineOutlined" />,
    id: 'callout',
    label: 'Callout',
    placement: true,
    summary: 'Anchored note'
  },
  {
    category: 'Annotations',
    footprint: { height: 64, width: 220 },
    icon: <StudioTextIcon data-material-icon="TextFieldsOutlined" />,
    id: 'text',
    label: 'Text',
    placement: true,
    summary: 'Free annotation'
  }
];

interface ObjectPaletteProps {
  activeEdgeTemplate?: StudioEdgeAuthoringTemplateId;
  disabled?: boolean;
  onCreate(templateId: StudioPaletteTemplateId): boolean;
  onEdgeTemplateChange(templateId?: StudioEdgeAuthoringTemplateId): void;
  onDeletePreset(id: string): boolean;
  onPathModeChange(mode: NonNullable<CreateAuthoringPathOptions['mode']>): void;
  onCollapse?(): void;
  onRenamePreset(id: string, name: string): boolean;
  pathMode: NonNullable<CreateAuthoringPathOptions['mode']>;
  presets: StudioUserPreset[];
  selectedNodeCount: number;
  state: 'default' | 'open' | 'closed';
}

const initialExpanded = new Set<PaletteCategory>(['Nodes', 'Edges', 'Annotations']);
const categoryOrder: PaletteCategory[] = ['Nodes', 'Edges', 'Annotations', 'Presets'];
const edgeTemplateIds = new Set<StudioPaletteTemplateId>(['link', 'parallel-link', 'parent-link-pipe', 'directional-link']);
const palettePreviewMetrics = {
  stageHeight: 22,
  stageWidth: 28,
  square: 22,
  tileHeight: 32,
  tileWidth: 32
} as const;

const palettePreviewSx = {
  color: 'text.primary',
  display: 'grid',
  height: palettePreviewMetrics.stageHeight,
  overflow: 'visible',
  placeItems: 'center',
  position: 'relative',
  width: palettePreviewMetrics.stageWidth,
  '& > svg': {
    height: palettePreviewMetrics.square,
    width: palettePreviewMetrics.square
  }
};

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

export function ObjectPalette({
  activeEdgeTemplate,
  disabled = false,
  onCollapse,
  onCreate,
  onDeletePreset,
  onEdgeTemplateChange,
  onPathModeChange,
  onRenamePreset,
  pathMode,
  presets,
  selectedNodeCount,
  state
}: ObjectPaletteProps) {
  const [expanded, setExpanded] = useState<Set<PaletteCategory>>(
    () => new Set([...initialExpanded, ...(presets.length > 0 ? (['Presets'] as PaletteCategory[]) : [])])
  );
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
          icon: linkPreset
            ? <StudioLinkIcon data-material-icon="TrendingFlatOutlined" />
            : <StudioPresetIcon data-material-icon="BookmarkBorderOutlined" />,
          id: `preset:${preset.id}`,
          label: preset.name,
          footprint: linkPreset ? undefined : presetFootprint(preset),
          placement: !linkPreset,
          presetId: preset.id,
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
      aria-label="Add"
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
      <StudioPanelHeader onCollapse={onCollapse} title="Add" />
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
                sx={{
                  minHeight: 40,
                  px: studioSpace.space8,
                  '&.Mui-expanded': { minHeight: 40 },
                  '& .MuiAccordionSummary-content': { my: studioSpace.space4 },
                  '& .MuiAccordionSummary-content.Mui-expanded': { my: studioSpace.space4 }
                }}
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
                sx={{ display: 'grid', gap: studioSpace.space4, px: studioSpace.space4, pb: studioSpace.space8, pt: 0 }}
              >
                {items.map((template) => {
                  const needsSelection = template.requiresTwoNodes && selectedNodeCount !== 2;
                  const edgeTemplateId = template.edgeAuthoring || isEdgeTemplateId(template.id) ? (template.id as StudioEdgeAuthoringTemplateId) : undefined;
                  const help = needsSelection
                    ? 'Select exactly two connected nodes first'
                    : disabled
                      ? 'Fix invalid topology source before authoring'
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
                        gridTemplateColumns: '72px minmax(0, 1fr) 32px',
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
                        disabled={disabled}
                        draggable={template.placement && !disabled}
                        onClick={() => {
                          if (edgeTemplateId) {
                            onEdgeTemplateChange(active ? undefined : edgeTemplateId);
                            return;
                          }
                          onEdgeTemplateChange(undefined);
                          onCreate(template.id);
                        }}
                        onDragStart={
                          template.placement && !disabled
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
                          template.placement && !disabled
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
                          gap: studioSpace.space8,
                          gridColumn: '1 / -1',
                          gridTemplateColumns: '32px minmax(0, 1fr) 20px',
                          minHeight: 44,
                          pl: studioSpace.space6,
                          position: 'relative',
                          pr: studioSpace.space6,
                          py: studioSpace.space4,
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
                          '& .studio-template-action': { color: 'text.secondary', justifySelf: 'center', opacity: 0.72 },
                          '&:hover .studio-template-action, &:focus-visible .studio-template-action, &[data-active="true"] .studio-template-action': { color: 'primary.main', opacity: 1 },
                        }}
                        title={help}
                      >
                        <Box
                          aria-hidden="true"
                          className="studio-template-preview-shell"
                          component="span"
                          sx={{
                            alignItems: 'center',
                            bgcolor: 'background.default',
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            display: 'flex',
                            height: palettePreviewMetrics.tileHeight,
                            justifyContent: 'center',
                            overflow: 'hidden',
                            width: palettePreviewMetrics.tileWidth
                          }}
                        >
                          <Box className="studio-template-preview" component="span" data-family={categorySlug(template.category)} data-visual="icon" sx={palettePreviewSx}>
                            {template.icon}
                          </Box>
                        </Box>
                        <Box
                          className="studio-template-copy"
                          component="span"
                          sx={{
                            display: 'grid',
                            gap: studioSpace.space2,
                            minWidth: 0,
                            '& > *': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }
                          }}
                        >
                          <Typography component="span" variant="subtitle2">
                            {template.label}
                          </Typography>
                          <Typography color="text.secondary" component="span" variant="caption">
                            {template.summary}
                          </Typography>
                        </Box>
                        {!preset ? (
                          edgeTemplateId ? (
                            active ? <CheckIcon aria-hidden="true" className="studio-template-action" fontSize="small" /> : <AddLinkIcon aria-hidden="true" className="studio-template-action" fontSize="small" />
                          ) : (
                            <AddIcon aria-hidden="true" className="studio-template-action" fontSize="small" />
                          )
                        ) : null}
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
                          <StudioSelect aria-label="Path route" disabled={disabled} onChange={(event) => onPathModeChange(event.target.value as NonNullable<CreateAuthoringPathOptions['mode']>)} value={pathMode}>
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
