import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import type { TopoDocument } from 'topoviewer';
import type { MapperCoveragePreview } from './mapperCoveragePreview';
import { mapperPresetOptions } from './mapperPresets';
import {
  mapperRuleResolverModes,
  mapperRuleTargetKinds,
  mapperRuleValueKinds,
  type MapperRuleBuilderState,
  type MapperRuleResolverMode,
  type MapperRuleTargetKind,
  type MapperTopologyPickers
} from './mapperRuleBuilder';

interface MapperYamlToolsHost {
  openDocs(target: string): Promise<void>;
}

interface MapperYamlActionsProps {
  host: MapperYamlToolsHost;
  insertMapperPreset?: (presetId: string) => void;
}

interface MapperRuleBuilderPanelProps {
  insertMapperRuleFromBuilder?: () => void;
  mapperCoveragePreview?: MapperCoveragePreview;
  mapperPickers?: MapperTopologyPickers;
  mapperRuleBuilder?: MapperRuleBuilderState;
  updateMapperRuleBuilder?: (patch: Partial<MapperRuleBuilderState>) => void;
  visibleDocument?: TopoDocument;
}

export function MapperYamlActions({ host, insertMapperPreset }: MapperYamlActionsProps) {
  const [mapperDocsAnchor, setMapperDocsAnchor] = useState<HTMLElement | null>(null);
  const [mapperPresetAnchor, setMapperPresetAnchor] = useState<HTMLElement | null>(null);
  const closeMapperDocs = () => setMapperDocsAnchor(null);
  const closeMapperPresets = () => setMapperPresetAnchor(null);
  const openMapperDocs = (target: string) => {
    closeMapperDocs();
    void host.openDocs(target);
  };
  const applyMapperPreset = (presetId: string) => {
    closeMapperPresets();
    insertMapperPreset?.(presetId);
  };

  return (
    <>
      <Button
        aria-controls={mapperDocsAnchor ? 'topoviewer-vscode-mapper-docs-menu' : undefined}
        aria-haspopup="menu"
        size="small"
        onClick={(event) => setMapperDocsAnchor(event.currentTarget)}
      >
        Mapper docs
      </Button>
      <Menu
        anchorEl={mapperDocsAnchor}
        id="topoviewer-vscode-mapper-docs-menu"
        onClose={closeMapperDocs}
        open={Boolean(mapperDocsAnchor)}
      >
        <MenuItem onClick={() => openMapperDocs('docs/zensical/topoviewer/grafana-mapper-recipes/')}>Mapper recipes</MenuItem>
        <MenuItem onClick={() => openMapperDocs('docs/zensical/topoviewer/schemas/#grafana-mapper-yaml')}>Mapper schema</MenuItem>
        <MenuItem onClick={() => openMapperDocs('docs/zensical/topoviewer/object-reference/')}>Object attributes</MenuItem>
      </Menu>
      <Button
        aria-controls={mapperPresetAnchor ? 'topoviewer-vscode-mapper-presets-menu' : undefined}
        aria-haspopup="menu"
        size="small"
        onClick={(event) => setMapperPresetAnchor(event.currentTarget)}
      >
        Presets
      </Button>
      <Menu
        anchorEl={mapperPresetAnchor}
        id="topoviewer-vscode-mapper-presets-menu"
        onClose={closeMapperPresets}
        open={Boolean(mapperPresetAnchor)}
      >
        {mapperPresetOptions.map((preset) => (
          <MenuItem key={preset.id} onClick={() => applyMapperPreset(preset.id)}>
            <Stack spacing={0.25}>
              <Typography variant="body2">{preset.label}</Typography>
              <Typography variant="caption" color="text.secondary">{preset.description}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export function MapperRuleBuilderPanel({
  insertMapperRuleFromBuilder,
  mapperCoveragePreview,
  mapperPickers,
  mapperRuleBuilder,
  updateMapperRuleBuilder,
  visibleDocument
}: MapperRuleBuilderPanelProps) {
  const [builderExpanded, setBuilderExpanded] = useState(true);

  if (!mapperRuleBuilder || !mapperPickers) {
    return mapperCoveragePreview ? <MapperCoverageSummary mapperCoveragePreview={mapperCoveragePreview} /> : null;
  }

  const updateMapperBuilder = (patch: Partial<MapperRuleBuilderState>) => updateMapperRuleBuilder?.(patch);
  const mapperObjectIds = mapperPickers.objectIdsByKind[mapperRuleBuilder.targetKind];
  const mapperLabelValues = mapperPickers.labelEntries
    .filter((entry) => !mapperRuleBuilder.labelKey || entry.key === mapperRuleBuilder.labelKey)
    .map((entry) => entry.value);
  const mapperLabelValue = mapperLabelValues.includes(mapperRuleBuilder.labelValue)
    ? mapperRuleBuilder.labelValue
    : mapperLabelValues[0] || '';

  return (
    <>
      <Accordion
        className="topoviewer-vscode-mapper-builder"
        disableGutters
        elevation={0}
        expanded={builderExpanded}
        onChange={(_event, expanded) => setBuilderExpanded(expanded)}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">Rule builder</Typography>
            <Typography variant="caption" color="text.secondary">
              Build a mapper rule from current topology IDs, labels, data keys, and endpoints.
            </Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                label="Rule ID"
                value={mapperRuleBuilder.id}
                onChange={(event) => updateMapperBuilder({ id: event.target.value })}
              />
              <TextField
                fullWidth
                size="small"
                label="Metric"
                value={mapperRuleBuilder.metric}
                onChange={(event) => updateMapperBuilder({ metric: event.target.value })}
              />
            </Stack>

            <Stack direction="row" spacing={1}>
              <FormControl fullWidth size="small">
                <InputLabel id="mapper-builder-target-kind">Target</InputLabel>
                <Select
                  labelId="mapper-builder-target-kind"
                  label="Target"
                  value={mapperRuleBuilder.targetKind}
                  onChange={(event) => updateMapperBuilder({
                    objectId: '',
                    targetKind: event.target.value as MapperRuleTargetKind
                  })}
                >
                  {mapperRuleTargetKinds.map((kind) => <MenuItem key={kind} value={kind}>{kind}</MenuItem>)}
                </Select>
                <FormHelperText>TopoViewer object family to overlay.</FormHelperText>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel id="mapper-builder-resolver">Match by</InputLabel>
                <Select
                  labelId="mapper-builder-resolver"
                  label="Match by"
                  value={mapperRuleBuilder.resolverMode}
                  onChange={(event) => updateMapperBuilder({ resolverMode: event.target.value as MapperRuleResolverMode })}
                >
                  {mapperRuleResolverModes.map((mode) => <MenuItem key={mode} value={mode}>{mode}</MenuItem>)}
                </Select>
                <FormHelperText>How telemetry rows bind to objects.</FormHelperText>
              </FormControl>
            </Stack>

            {['id', 'label', 'data'].includes(mapperRuleBuilder.resolverMode) && (
              <TextField
                fullWidth
                size="small"
                label="Telemetry label"
                helperText="Prometheus label that carries the object ID, label value, or data value."
                value={mapperRuleBuilder.metricLabel}
                onChange={(event) => updateMapperBuilder({ metricLabel: event.target.value })}
              />
            )}

            {['id', 'staticObjectIds'].includes(mapperRuleBuilder.resolverMode) && (
              <FormControl fullWidth size="small">
                <InputLabel id="mapper-builder-object">Object</InputLabel>
                <Select
                  labelId="mapper-builder-object"
                  label="Object"
                  value={mapperRuleBuilder.objectId || mapperObjectIds[0] || ''}
                  onChange={(event) => updateMapperBuilder({ objectId: String(event.target.value) })}
                >
                  {mapperObjectIds.map((id) => <MenuItem key={id} value={id}>{id}</MenuItem>)}
                </Select>
                <FormHelperText>Topology-derived object ID picker.</FormHelperText>
              </FormControl>
            )}

            {mapperRuleBuilder.resolverMode === 'label' && (
              <Stack direction="row" spacing={1}>
                <FormControl fullWidth size="small">
                  <InputLabel id="mapper-builder-label-key">Label key</InputLabel>
                  <Select
                    labelId="mapper-builder-label-key"
                    label="Label key"
                    value={mapperRuleBuilder.labelKey || mapperPickers.labelKeys[0] || ''}
                    onChange={(event) => {
                      const nextKey = String(event.target.value);
                      const nextValue = mapperPickers.labelEntries.find((entry) => entry.key === nextKey)?.value || '';
                      updateMapperBuilder({ labelKey: nextKey, labelValue: nextValue });
                    }}
                  >
                    {mapperPickers.labelKeys.map((key) => <MenuItem key={key} value={key}>{key}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel id="mapper-builder-label-value">Label value</InputLabel>
                  <Select
                    labelId="mapper-builder-label-value"
                    label="Label value"
                    value={mapperLabelValue}
                    onChange={(event) => updateMapperBuilder({ labelValue: String(event.target.value) })}
                  >
                    {mapperLabelValues.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
            )}

            {mapperRuleBuilder.resolverMode === 'data' && (
              <FormControl fullWidth size="small">
                <InputLabel id="mapper-builder-data-key">Data key</InputLabel>
                <Select
                  labelId="mapper-builder-data-key"
                  label="Data key"
                  value={mapperRuleBuilder.dataKey || mapperPickers.dataKeys[0] || ''}
                  onChange={(event) => updateMapperBuilder({ dataKey: String(event.target.value) })}
                >
                  {mapperPickers.dataKeys.map((key) => <MenuItem key={key} value={key}>{key}</MenuItem>)}
                </Select>
                <FormHelperText>Topology-derived `data.*` key picker.</FormHelperText>
              </FormControl>
            )}

            {mapperRuleBuilder.resolverMode === 'endpoint' && (
              <Stack spacing={1}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Source label"
                    value={mapperRuleBuilder.sourceLabel}
                    onChange={(event) => updateMapperBuilder({ sourceLabel: event.target.value })}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Target label"
                    value={mapperRuleBuilder.targetLabel}
                    onChange={(event) => updateMapperBuilder({ targetLabel: event.target.value })}
                  />
                </Stack>
                <FormControl fullWidth size="small">
                  <InputLabel id="mapper-builder-endpoint-preview">Topology endpoint pair</InputLabel>
                  <Select
                    labelId="mapper-builder-endpoint-preview"
                    label="Topology endpoint pair"
                    value={mapperPickers.endpointPairs[0]?.label || ''}
                    onChange={() => undefined}
                  >
                    {mapperPickers.endpointPairs.map((pair) => <MenuItem key={pair.label} value={pair.label}>{pair.label}</MenuItem>)}
                  </Select>
                  <FormHelperText>Reference picker only; endpoint matching uses telemetry source/target labels.</FormHelperText>
                </FormControl>
              </Stack>
            )}

            {mapperRuleBuilder.resolverMode === 'selector' && (
              <TextField
                fullWidth
                size="small"
                label="Selector"
                helperText="Example: link[labels.type = &quot;fabric&quot;]"
                value={mapperRuleBuilder.selector}
                onChange={(event) => updateMapperBuilder({ selector: event.target.value })}
              />
            )}

            <Stack direction="row" spacing={1}>
              <FormControl fullWidth size="small">
                <InputLabel id="mapper-builder-value">Value as</InputLabel>
                <Select
                  labelId="mapper-builder-value"
                  label="Value as"
                  value={mapperRuleBuilder.valueAs}
                  onChange={(event) => updateMapperBuilder({ valueAs: String(event.target.value) })}
                >
                  {mapperRuleValueKinds.map((kind) => <MenuItem key={kind} value={kind}>{kind}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                size="small"
                label="Label template"
                value={mapperRuleBuilder.labelTemplate}
                onChange={(event) => updateMapperBuilder({ labelTemplate: event.target.value })}
              />
            </Stack>

            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                label="Warning threshold"
                value={mapperRuleBuilder.warningThreshold}
                onChange={(event) => updateMapperBuilder({ warningThreshold: event.target.value })}
              />
              <TextField
                fullWidth
                size="small"
                label="Error threshold"
                value={mapperRuleBuilder.errorThreshold}
                onChange={(event) => updateMapperBuilder({ errorThreshold: event.target.value })}
              />
            </Stack>

            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                label="Default color"
                type="color"
                value={mapperRuleBuilder.defaultColor}
                onChange={(event) => updateMapperBuilder({ defaultColor: event.target.value })}
              />
              <TextField
                fullWidth
                size="small"
                label="Default width"
                value={mapperRuleBuilder.defaultWidth}
                onChange={(event) => updateMapperBuilder({ defaultWidth: event.target.value })}
              />
              <TextField
                fullWidth
                size="small"
                label="Badge template"
                value={mapperRuleBuilder.badgeTemplate}
                onChange={(event) => updateMapperBuilder({ badgeTemplate: event.target.value })}
              />
            </Stack>

            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                label="State"
                value={mapperRuleBuilder.stateName}
                onChange={(event) => updateMapperBuilder({ stateName: event.target.value })}
              />
              <TextField
                fullWidth
                size="small"
                label="When value"
                value={mapperRuleBuilder.stateExpression}
                onChange={(event) => updateMapperBuilder({ stateExpression: event.target.value })}
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                label="State color"
                type="color"
                value={mapperRuleBuilder.stateColor}
                onChange={(event) => updateMapperBuilder({ stateColor: event.target.value })}
              />
              <TextField
                fullWidth
                size="small"
                label="State width"
                value={mapperRuleBuilder.stateWidth}
                onChange={(event) => updateMapperBuilder({ stateWidth: event.target.value })}
              />
            </Stack>

            <FormControlLabel
              control={(
                <Checkbox
                  checked={mapperRuleBuilder.propagateToLayerMembers}
                  onChange={(event) => updateMapperBuilder({ propagateToLayerMembers: event.target.checked })}
                />
              )}
              label="Propagate aggregate state to layer members"
            />

            <Button
              size="small"
              variant="contained"
              disabled={!visibleDocument || !insertMapperRuleFromBuilder}
              onClick={insertMapperRuleFromBuilder}
            >
              Insert mapper rule
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>
      {mapperCoveragePreview && <MapperCoverageSummary mapperCoveragePreview={mapperCoveragePreview} />}
    </>
  );
}

function MapperCoverageSummary({ mapperCoveragePreview }: { mapperCoveragePreview: MapperCoveragePreview }) {
  return (
    <Alert severity={mapperCoveragePreview.severity} className="topoviewer-vscode-mapper-coverage">
      <Stack spacing={1}>
        <Box>
          <Typography variant="subtitle2">Synthetic mapper coverage</Typography>
          <Typography variant="body2">{mapperCoveragePreview.summary}</Typography>
        </Box>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Chip size="small" label={`${mapperCoveragePreview.counts.matchedRules}/${mapperCoveragePreview.counts.totalRules} rules`} />
          <Chip size="small" label={`${mapperCoveragePreview.counts.matchedObjects} objects`} />
          <Chip size="small" label={`${mapperCoveragePreview.counts.unmatchedRules} unmatched`} />
          <Chip size="small" label={`${mapperCoveragePreview.counts.ambiguousRules} ambiguous`} />
          <Chip size="small" label={`${mapperCoveragePreview.counts.staleReferences} stale`} />
          <Chip size="small" label={`${mapperCoveragePreview.counts.duplicateTargets} duplicate targets`} />
        </Stack>
        {mapperCoveragePreview.rows.length > 0 && (
          <Stack spacing={0.5}>
            {mapperCoveragePreview.rows.slice(0, 4).map((row) => (
              <Box key={row.id}>
                <Typography variant="caption">
                  {row.id}: {row.target} / {row.resolver} / {row.status}
                </Typography>
                <Typography variant="caption" color="text.secondary" component="p">
                  {row.detail}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
        <Typography variant="caption" color="text.secondary">
          This uses synthetic labels from the current topology. Grafana recomputes coverage from live data frames at runtime.
        </Typography>
      </Stack>
    </Alert>
  );
}
