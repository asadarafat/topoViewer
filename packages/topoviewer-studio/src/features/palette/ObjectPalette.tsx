import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AddIcon from '@mui/icons-material/Add';
import AddLinkIcon from '@mui/icons-material/AddLink';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import CheckIcon from '@mui/icons-material/Check';
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
import { alpha, useTheme, type Theme } from '@mui/material/styles';
import type { CreateAuthoringPathOptions } from 'topoviewer/authoring';
import { studioVisualNodeTemplateDataUri, type StudioVisualNodeTemplateId } from '../../templates/starterNodeTemplates';
import { StudioAccordion, StudioAccordionDetails, StudioAccordionSummary, StudioButtonBase, StudioFormControl, StudioFormLabel, StudioOption, StudioSearchField, StudioSelect } from '../../ui/controls';
import { StudioPanelHeader } from '../../ui/StudioPanel';
import { useStudioColorScheme } from '../../ui/StudioThemeProvider';
import type { StudioEdgeAuthoringTemplateId, StudioEdgeTemplateId, StudioPaletteTemplateId, StudioUserPreset } from './types';
import { UserPresetActions } from './UserPresetActions';
import { studioSpace } from '../../ui/muiSpacing';
import { createPaletteDragPreview, PaletteDragPreview } from './paletteDragPreview';

type PaletteCategory = 'Nodes' | 'Edges' | 'Annotations' | 'Presets';

type PalettePreview = 'directional-link' | 'link' | 'parallel-link' | 'parent-link-pipe' | 'path';

interface PaletteTemplate {
  category: PaletteCategory;
  edgeAuthoring?: boolean;
  footprint?: { height: number; width: number };
  icon?: ReactNode;
  iconDataUri?: string;
  id: StudioPaletteTemplateId;
  label: string;
  nodeIcon?: StudioVisualNodeTemplateId;
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
    id: 'router',
    label: 'Router',
    nodeIcon: 'router',
    placement: true,
    summary: 'Square · SVG'
  },
  {
    category: 'Nodes',
    footprint: { height: 64, width: 190 },
    id: 'controller',
    label: 'Controller',
    nodeIcon: 'controller',
    placement: true,
    summary: 'Card · SVG + metadata'
  },
  {
    category: 'Nodes',
    footprint: { height: 60, width: 176 },
    id: 'service',
    label: 'Service',
    nodeIcon: 'server',
    placement: true,
    summary: 'Card · status preset'
  },
  {
    category: 'Nodes',
    footprint: { height: 150, width: 260 },
    icon: <ParentChildPreviewIcon />,
    id: 'parent-child',
    label: 'Parent with child',
    placement: true,
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

const initialExpanded = new Set<PaletteCategory>(['Nodes', 'Edges', 'Annotations']);
const categoryOrder: PaletteCategory[] = ['Nodes', 'Edges', 'Annotations', 'Presets'];
const edgeTemplateIds = new Set<StudioPaletteTemplateId>(['link', 'parallel-link', 'parent-link-pipe', 'directional-link']);
const palettePreviewMetrics = {
  stageHeight: 28,
  stageWidth: 52,
  square: 28,
  tileHeight: 40,
  tileWidth: 64
} as const;

function ParentChildPreviewIcon() {
  return (
    <Box
      component="span"
      data-testid="palette-parent-child-glyph"
      sx={{
        borderRadius: 1,
        display: 'grid',
        height: palettePreviewMetrics.square,
        placeItems: 'center',
        width: palettePreviewMetrics.square
      }}
    >
      <AccountTreeIcon sx={{ color: 'text.primary', height: 20, width: 20 }} />
    </Box>
  );
}

const edgePreviewSx = (theme: Theme) => {
  const palette = theme.vars?.palette ?? theme.palette;
  return {
    display: 'block',
    fill: 'none',
    height: palettePreviewMetrics.stageHeight,
    overflow: 'visible',
    stroke: palette.text.primary,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2.5,
    width: palettePreviewMetrics.stageWidth,
    '& path, & circle, & rect': { vectorEffect: 'non-scaling-stroke' },
    '& .studio-preview-edge-endpoint': {
      fill: palette.background.default,
      stroke: palette.text.primary,
      strokeWidth: 2
    },
    '& .studio-preview-edge-waypoint': {
      fill: palette.text.primary,
      stroke: palette.background.default,
      strokeWidth: 1.5
    },
    '& .studio-preview-edge-primary': { stroke: palette.text.primary },
    '& .studio-preview-edge-secondary': { stroke: palette.text.primary },
    '& .studio-preview-edge-info': { stroke: palette.text.primary },
    '& .studio-preview-edge-arrow-primary': { fill: 'none', stroke: palette.text.primary, strokeWidth: 3 },
    '& .studio-preview-edge-arrow-secondary': { fill: palette.text.primary, stroke: 'none' },
    '& .studio-preview-edge-pipe-shell': {
      fill: palette.action.selected,
      stroke: palette.text.primary,
      strokeWidth: 2
    },
    '& .studio-preview-edge-lane': { stroke: palette.text.primary, strokeWidth: 3 },
    '& .studio-preview-edge-arrow-lane': { fill: palette.text.primary, stroke: 'none' },
    '& .studio-preview-edge-direction-forward': { stroke: palette.text.primary },
    '& .studio-preview-edge-direction-reverse': { stroke: palette.text.primary },
    '& .studio-preview-edge-arrow-forward': { fill: 'none', stroke: palette.text.primary, strokeWidth: 3 },
    '& .studio-preview-edge-arrow-reverse': { fill: 'none', stroke: palette.text.primary, strokeWidth: 3 }
  };
};

const palettePreviewSx = {
  color: 'text.primary',
  display: 'grid',
  height: palettePreviewMetrics.stageHeight,
  overflow: 'visible',
  placeItems: 'center',
  position: 'relative',
  width: palettePreviewMetrics.stageWidth,
  '&[data-visual="svg"] > img': {
    borderRadius: 1,
    display: 'block',
    height: palettePreviewMetrics.square,
    objectFit: 'contain',
    width: palettePreviewMetrics.square
  },
  '&[data-visual="icon"] > svg': {
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

function PalettePreviewGraphic({ preview }: { preview: PalettePreview }) {
  return (
    <SvgIcon className="studio-preview-edge" sx={edgePreviewSx} viewBox="0 0 64 40">
      {preview === 'link' ? (
        <>
          <circle className="studio-preview-edge-endpoint" cx="5" cy="20" r="3" />
          <path className="studio-preview-edge-primary" d="M9 20h46" />
          <path className="studio-preview-edge-arrow-primary" d="m47 14 8 6-8 6" />
          <circle className="studio-preview-edge-endpoint" cx="59" cy="20" r="3" />
        </>
      ) : null}
      {preview === 'parallel-link' ? (
        <>
          <circle className="studio-preview-edge-endpoint" cx="5" cy="20" r="3" />
          <path className="studio-preview-edge-primary" d="M9 20C20 5 44 5 55 20" />
          <path className="studio-preview-edge-secondary" d="M9 20h46" />
          <path className="studio-preview-edge-info" d="M9 20c11 15 35 15 46 0" />
          <circle className="studio-preview-edge-endpoint" cx="59" cy="20" r="3" />
        </>
      ) : null}
      {preview === 'parent-link-pipe' ? (
        <>
          <circle className="studio-preview-edge-endpoint" cx="5" cy="20" r="3" />
          <rect className="studio-preview-edge-pipe-shell" height="16" rx="8" width="46" x="9" y="12" />
          <path className="studio-preview-edge-lane" d="M10 20h38" />
          <path className="studio-preview-edge-arrow-lane" d="m47 15 9 5-9 5z" />
          <circle className="studio-preview-edge-endpoint" cx="59" cy="20" r="3" />
        </>
      ) : null}
      {preview === 'path' ? (
        <>
          <circle className="studio-preview-edge-endpoint" cx="6" cy="30" r="3" />
          <path className="studio-preview-edge-secondary" d="m9 29 12-10 14 6 14-15h7" />
          <circle className="studio-preview-edge-waypoint" cx="21" cy="19" r="2.8" />
          <circle className="studio-preview-edge-waypoint" cx="35" cy="25" r="2.8" />
          <circle className="studio-preview-edge-waypoint" cx="49" cy="10" r="2.8" />
          <path className="studio-preview-edge-arrow-secondary" d="m51 5 9 5-9 5z" />
        </>
      ) : null}
      {preview === 'directional-link' ? (
        <>
          <circle className="studio-preview-edge-endpoint" cx="5" cy="20" r="3" />
          <path className="studio-preview-edge-direction-forward" d="M9 20c6 0 6-8 14-8h32" />
          <path className="studio-preview-edge-arrow-forward" d="m47 6 8 6-8 6" />
          <path className="studio-preview-edge-direction-reverse" d="M55 20c-6 0-6 8-14 8H9" />
          <path className="studio-preview-edge-arrow-reverse" d="m17 22-8 6 8 6" />
          <circle className="studio-preview-edge-endpoint" cx="59" cy="20" r="3" />
        </>
      ) : null}
    </SvgIcon>
  );
}

export function ObjectPalette({ activeEdgeTemplate, onCollapse, onCreate, onDeletePreset, onEdgeTemplateChange, onPathModeChange, onRenamePreset, pathMode, presets, selectedNodeCount, state }: ObjectPaletteProps) {
  const theme = useTheme();
  const { effectiveMode } = useStudioColorScheme();
  const [expanded, setExpanded] = useState(initialExpanded);
  const [query, setQuery] = useState('');
  const dragPreviewCleanupRef = useRef<() => void>();
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const previousPresetCount = useRef(presets.length);
  const nodeIconDataUris = useMemo<Partial<Record<StudioVisualNodeTemplateId, string | undefined>>>(
    () => {
      const foreground = effectiveMode === 'dark' ? theme.palette.common.white : theme.palette.common.black;
      const colors = { fill: alpha(foreground, 0.08), stroke: foreground };
      return {
        controller: studioVisualNodeTemplateDataUri('controller', colors),
        router: studioVisualNodeTemplateDataUri('router', colors),
        server: studioVisualNodeTemplateDataUri('server', colors)
      };
    },
    [effectiveMode, theme.palette.common.black, theme.palette.common.white]
  );
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
                    : edgeTemplateId
                      ? activeEdgeTemplate === template.id
                        ? 'Edge tool active'
                        : 'Select a node, then drag from a connection point'
                      : template.placement
                        ? 'Drag to canvas or click to add'
                        : template.summary;
                  const active = edgeTemplateId ? activeEdgeTemplate === template.id : false;
                  const preset = template.presetId ? presets.find((candidate) => candidate.id === template.presetId) : undefined;
                  const iconDataUri = template.nodeIcon ? nodeIconDataUris[template.nodeIcon] : template.iconDataUri;
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
                          gap: studioSpace.space6,
                          gridColumn: '1 / -1',
                          gridTemplateColumns: '64px minmax(0, 1fr) 20px',
                          minHeight: 58,
                          pl: studioSpace.space8,
                          position: 'relative',
                          pr: studioSpace.space8,
                          py: studioSpace.space6,
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
                          '@container studio-workspace (max-width: 280px)': {
                            gridTemplateColumns: '64px minmax(0, 1fr)',
                            '& .studio-template-action': { display: 'none' }
                          }
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
                          <Box className="studio-template-preview" component="span" data-family={categorySlug(template.category)} data-preview={template.preview} data-visual={iconDataUri ? 'svg' : template.preview ? 'preview' : 'icon'} sx={palettePreviewSx}>
                            {iconDataUri ? <Box alt="" component="img" draggable={false} src={iconDataUri} /> : null}
                            {template.preview ? <PalettePreviewGraphic preview={template.preview} /> : template.icon}
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
