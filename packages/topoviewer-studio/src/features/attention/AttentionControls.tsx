import { useEffect, useMemo, useState, type ReactNode } from 'react';
import CenterFocusStrongOutlinedIcon from '@mui/icons-material/CenterFocusStrongOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import MultipleStopOutlinedIcon from '@mui/icons-material/MultipleStopOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { buildAttentionIndex, displayName, type FocusPresentationMode, type LinkGroupingKey } from 'topoviewer';
import {
  DEFAULT_AUTHORING_LINK_GROUPING_KEYS,
  DEFAULT_AUTHORING_LINK_GROUPING_THRESHOLD,
  summarizeAuthoringAttention,
  type AuthoringAttentionAction
} from 'topoviewer/authoring/attention';
import type { StudioSelection, StudioSessionSnapshot } from '../../contracts/project';
import {
  StudioAlert,
  StudioButton,
  StudioDialog,
  StudioDialogActions,
  StudioDialogContent,
  StudioDialogTitle,
  StudioFormControl,
  StudioInputLabel,
  StudioLabeledControl,
  StudioMultiAutocomplete,
  StudioOption,
  StudioSelect,
  StudioSwitch,
  StudioTextField
} from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';

interface AttentionControlsProps {
  applyAction(action: AuthoringAttentionAction): Promise<boolean>;
  disabled?: boolean;
  onOpenSource(): void;
  snapshot: StudioSessionSnapshot;
}

const compatibleKinds = new Set<StudioSelection['kind']>([
  'node',
  'link',
  'linkDirection',
  'path',
  'region'
]);
const focusModes: Array<{ label: string; value: FocusPresentationMode }> = [
  { label: 'Highlight', value: 'highlight' },
  { label: 'Dim context', value: 'dim-context' },
  { label: 'Hide context', value: 'hide-context' }
];

function AttentionSection({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  return (
    <Box component="section" sx={{ py: studioSpace.space8 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: studioSpace.space6, mb: studioSpace.space8 }}>
        {icon}
        <Typography component="h4" variant="subtitle2">{title}</Typography>
      </Stack>
      <Stack spacing={studioSpace.space8}>{children}</Stack>
    </Box>
  );
}

function selectMode(
  label: string,
  value: FocusPresentationMode,
  disabled: boolean,
  onChange: (mode: FocusPresentationMode) => void
) {
  const labelId = `studio-attention-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <StudioFormControl disabled={disabled}>
      <StudioInputLabel id={labelId}>{label}</StudioInputLabel>
      <StudioSelect
        inputProps={{ 'aria-label': label }}
        label={label}
        labelId={labelId}
        onChange={(event) => onChange(event.target.value as FocusPresentationMode)}
        value={value}
      >
        {focusModes.map((mode) => <StudioOption key={mode.value} value={mode.value}>{mode.label}</StudioOption>)}
      </StudioSelect>
    </StudioFormControl>
  );
}

function groupingValue(keys: readonly LinkGroupingKey[]): string {
  if (keys.includes('endpoints') && keys.includes('layer')) return 'endpoints-layer';
  return keys[0] || 'endpoints';
}

function groupingKeys(value: string): LinkGroupingKey[] {
  if (value === 'endpoints-layer') return ['endpoints', 'layer'];
  return [value as LinkGroupingKey];
}

export function AttentionControls({ applyAction, disabled = false, onOpenSource, snapshot }: AttentionControlsProps) {
  const document = snapshot.projection.document;
  const attention = document.attention;
  const summary = useMemo(() => summarizeAuthoringAttention(document), [document]);
  const index = useMemo(() => buildAttentionIndex(document), [document]);
  const selectedIds = useMemo(
    () => snapshot.selection.flatMap((selection) =>
      compatibleKinds.has(selection.kind) && index.getObject(selection.id) ? [selection.id] : []
    ),
    [index, snapshot.selection]
  );
  const aggregateCandidate = useMemo(() => {
    if (snapshot.selection.length !== 1) return undefined;
    const selection = snapshot.selection[0];
    if (selection.kind === 'region' && index.getRegion(selection.id)) {
      return { by: 'region' as const, sourceId: selection.id };
    }
    if (selection.kind === 'node' && index.getChildren(selection.id).length) {
      return { by: 'parent' as const, sourceId: selection.id };
    }
    return undefined;
  }, [index, snapshot.selection]);
  const grouping = attention?.links?.grouping;
  const [thresholdDraft, setThresholdDraft] = useState(String(grouping?.threshold || DEFAULT_AUTHORING_LINK_GROUPING_THRESHOLD));
  const [selectorDraft, setSelectorDraft] = useState(grouping?.selector || '');
  const [removeOpen, setRemoveOpen] = useState(false);

  useEffect(() => setThresholdDraft(String(grouping?.threshold || DEFAULT_AUTHORING_LINK_GROUPING_THRESHOLD)), [grouping?.threshold]);
  useEffect(() => setSelectorDraft(grouping?.selector || ''), [grouping?.selector]);

  function commitThreshold() {
    const threshold = Number(thresholdDraft);
    if (Number.isInteger(threshold) && threshold >= 2 && threshold !== grouping?.threshold) {
      applyAction({ type: 'set-link-grouping-threshold', threshold });
      return;
    }
    setThresholdDraft(String(grouping?.threshold || DEFAULT_AUTHORING_LINK_GROUPING_THRESHOLD));
  }

  const advanced = Boolean(
    summary.advancedQueryFields.length ||
    summary.hasAggregateViewport ||
    summary.hasLinkGroupingViewport
  );
  const groups = attention?.aggregate?.groups || [];
  const expandedGroupIds = new Set(attention?.aggregate?.expandedGroupIds || []);
  const focusedIds = attention?.query?.ids ? [...attention.query.ids] : [];
  const currentGroupingKeys = grouping?.by?.length ? grouping.by : DEFAULT_AUTHORING_LINK_GROUPING_KEYS;

  return (
    <Box className="studio-attention-controls" sx={{ minWidth: 0 }}>
      {!summary.configured ? (
        <StudioAlert severity="info" sx={{ mb: studioSpace.space8 }}>
          Attention is not configured. Start from the current canvas selection or enable click focus.
        </StudioAlert>
      ) : null}
      {advanced ? (
        <StudioAlert
          action={<StudioButton onClick={onOpenSource} size="small">View YAML</StudioButton>}
          severity="info"
          sx={{ mb: studioSpace.space8 }}
        >
          Additional YAML criteria are active and preserved by these controls.
        </StudioAlert>
      ) : null}

      <AttentionSection icon={<CenterFocusStrongOutlinedIcon fontSize="small" />} title="Focus">
        <StudioMultiAutocomplete
          ariaLabel="Focused objects"
          disabled={disabled}
          filterSelectedOptions
          getOptionLabel={(id) => {
            const object = index.getObject(id);
            return object ? `${id} · ${displayName(object.entity)}` : id;
          }}
          label="Focused objects"
          onChange={(_event, ids) => applyAction({ type: 'set-focus-ids', ids })}
          options={[...index.objectIds]}
          value={focusedIds}
        />
        <StudioButton
          disabled={disabled || selectedIds.length === 0}
          onClick={() => applyAction({ type: 'set-focus-ids', ids: selectedIds })}
          size="small"
          variant="outlined"
        >
          Focus canvas selection
        </StudioButton>
        {selectMode(
          'Focus mode',
          attention?.query?.mode || 'dim-context',
          disabled,
          (mode) => applyAction({ type: 'set-focus-mode', mode })
        )}
        <StudioLabeledControl
          control={
            <StudioSwitch
              checked={attention?.interactive === true}
              disabled={disabled}
              onChange={(event) => applyAction({ type: 'set-interactive', enabled: event.target.checked })}
              slotProps={{ input: { 'aria-label': 'Interactive click focus' } }}
            />
          }
          label="Interactive click focus"
          labelPlacement="start"
          sx={{ justifyContent: 'space-between', m: 0, width: '100%' }}
        />
        {selectMode(
          'Click mode',
          attention?.clickMode || 'dim-context',
          disabled || attention?.interactive !== true,
          (mode) => applyAction({ type: 'set-click-mode', mode })
        )}
        {attention?.query ? (
          <StudioButton disabled={disabled} onClick={() => applyAction({ type: 'clear-focus-query' })} size="small">
            Clear focus query
          </StudioButton>
        ) : null}
      </AttentionSection>

      <Divider />
      <AttentionSection icon={<HubOutlinedIcon fontSize="small" />} title="Aggregation">
        <StudioButton
          disabled={disabled || !aggregateCandidate}
          onClick={() => aggregateCandidate && applyAction({ type: 'add-aggregate-group', ...aggregateCandidate })}
          size="small"
          variant="outlined"
        >
          Aggregate selected structure
        </StudioButton>
        <Typography color="text.secondary" variant="caption">
          {aggregateCandidate
            ? `${aggregateCandidate.by === 'region' ? 'Region' : 'Parent'} ${aggregateCandidate.sourceId}`
            : 'Select one region or a parent node with children.'}
        </Typography>
        {groups.map((group) => {
          const source = group.by === 'region'
            ? group.regionId
            : group.by === 'parent'
              ? group.parentId
              : `${group.key}=${String(group.value)}`;
          return (
            <Box
              data-attention-group-id={group.id}
              key={group.id}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: studioSpace.space8 }}
            >
              <Typography noWrap title={group.id} variant="body2">{source}</Typography>
              <Typography color="text.secondary" noWrap variant="caption">{group.id}</Typography>
              <StudioLabeledControl
                control={
                  <StudioSwitch
                    checked={expandedGroupIds.has(group.id)}
                    disabled={disabled}
                    onChange={(event) => applyAction({
                      type: 'set-aggregate-group-expanded',
                      groupId: group.id,
                      expanded: event.target.checked
                    })}
                    slotProps={{ input: { 'aria-label': `Start ${group.id} expanded` } }}
                  />
                }
                label="Start expanded"
                labelPlacement="start"
                sx={{ justifyContent: 'space-between', m: 0, width: '100%' }}
              />
              <StudioButton
                color="error"
                disabled={disabled}
                onClick={() => applyAction({ type: 'remove-aggregate-group', groupId: group.id })}
                size="small"
                startIcon={<DeleteOutlineOutlinedIcon />}
              >
                Remove group
              </StudioButton>
            </Box>
          );
        })}
        {groups.length ? (
          <StudioLabeledControl
            control={
              <StudioSwitch
                checked={attention?.aggregate?.expandOnClick === true}
                disabled={disabled}
                onChange={(event) => applyAction({ type: 'set-aggregate-expand-on-click', enabled: event.target.checked })}
                slotProps={{ input: { 'aria-label': 'Expand aggregates on click' } }}
              />
            }
            label="Expand aggregates on click"
            labelPlacement="start"
            sx={{ justifyContent: 'space-between', m: 0, width: '100%' }}
          />
        ) : null}
      </AttentionSection>

      <Divider />
      <AttentionSection icon={<MultipleStopOutlinedIcon fontSize="small" />} title="Parallel links">
        <StudioLabeledControl
          control={
            <StudioSwitch
              checked={grouping?.enabled === true}
              disabled={disabled}
              onChange={(event) => applyAction({ type: 'set-link-grouping-enabled', enabled: event.target.checked })}
              slotProps={{ input: { 'aria-label': 'Group parallel links' } }}
            />
          }
          label="Group parallel links"
          labelPlacement="start"
          sx={{ justifyContent: 'space-between', m: 0, width: '100%' }}
        />
        <StudioTextField
          aria-label="Minimum parallel links"
          disabled={disabled || grouping?.enabled !== true}
          label="Minimum parallel links"
          onBlur={commitThreshold}
          onChange={(event) => setThresholdDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') setThresholdDraft(String(grouping?.threshold || DEFAULT_AUTHORING_LINK_GROUPING_THRESHOLD));
          }}
          slotProps={{ htmlInput: { min: 2, step: 1 } }}
          type="number"
          value={thresholdDraft}
        />
        <StudioFormControl disabled={disabled || grouping?.enabled !== true}>
          <StudioInputLabel id="studio-attention-grouping-keys-label">Grouping keys</StudioInputLabel>
          <StudioSelect
            inputProps={{ 'aria-label': 'Grouping keys' }}
            label="Grouping keys"
            labelId="studio-attention-grouping-keys-label"
            onChange={(event) => applyAction({ type: 'set-link-grouping-by', by: groupingKeys(event.target.value) })}
            value={groupingValue(currentGroupingKeys)}
          >
            <StudioOption value="endpoints">Endpoints</StudioOption>
            <StudioOption value="layer">Layer</StudioOption>
            <StudioOption value="endpoints-layer">Endpoints and layer</StudioOption>
          </StudioSelect>
        </StudioFormControl>
        <StudioTextField
          aria-label="Link selector"
          disabled={disabled || grouping?.enabled !== true}
          label="Link selector"
          onBlur={() => {
            if (selectorDraft !== (grouping?.selector || '')) {
              applyAction({ type: 'set-link-grouping-selector', selector: selectorDraft });
            }
          }}
          onChange={(event) => setSelectorDraft(event.target.value)}
          value={selectorDraft}
        />
        <StudioLabeledControl
          control={
            <StudioSwitch
              checked={grouping?.expandOnClick === true}
              disabled={disabled || grouping?.enabled !== true}
              onChange={(event) => applyAction({ type: 'set-link-grouping-expand-on-click', enabled: event.target.checked })}
              slotProps={{ input: { 'aria-label': 'Expand grouped links on click' } }}
            />
          }
          label="Expand grouped links on click"
          labelPlacement="start"
          sx={{ justifyContent: 'space-between', m: 0, width: '100%' }}
        />
      </AttentionSection>

      <Divider />
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: studioSpace.space6, pt: studioSpace.space8 }}>
        <StudioButton onClick={onOpenSource} size="small" startIcon={<CodeOutlinedIcon />}>
          View attention YAML
        </StudioButton>
        <StudioButton
          color="error"
          disabled={disabled || !summary.configured}
          onClick={() => setRemoveOpen(true)}
          size="small"
          startIcon={<DeleteOutlineOutlinedIcon />}
        >
          Remove attention
        </StudioButton>
      </Stack>

      <StudioDialog
        aria-labelledby="studio-remove-attention-title"
        onClose={() => setRemoveOpen(false)}
        open={removeOpen}
        role="alertdialog"
      >
        <StudioDialogTitle id="studio-remove-attention-title">Remove Attention?</StudioDialogTitle>
        <StudioDialogContent>
          <Typography variant="body2">
            This removes focus, aggregate, link-grouping, and advanced Attention policy from topology.yaml.
          </Typography>
        </StudioDialogContent>
        <StudioDialogActions>
          <StudioButton autoFocus onClick={() => setRemoveOpen(false)}>Cancel</StudioButton>
          <StudioButton
            color="error"
            onClick={() => {
              setRemoveOpen(false);
              applyAction({ type: 'remove-attention' });
            }}
            variant="contained"
          >
            Remove
          </StudioButton>
        </StudioDialogActions>
      </StudioDialog>
    </Box>
  );
}
