import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  authoringFieldDefaultValue,
  authoringFieldIsVisible,
  authoringObjectSourcePath,
  coerceAuthoringFieldValue,
  findAuthoringObject,
  resolveStyleProvenance,
  styleAuthoringMetadataByTarget,
  type AuthoringFieldMetadata,
  type AuthoringNestedFieldMetadata,
  type AuthoringObjectSelection
} from 'topoviewer/authoring';
import type { MapperAuthoringTargetKind } from 'topoviewer/authoring';
import type { StyleTargetKind } from 'topoviewer';
import type { StudioAuthoringProfileOverride } from '../../contracts/profiles';
import type { StudioDocumentKind, StudioSessionSnapshot } from '../../contracts/project';
import type { StudioStyleEditRequest, StudioStyleUnsetRequest } from '../../contracts/inspector';
import type { StudioViewportPreferences } from '../viewport/types';
import { resolveStudioFieldProfile } from './profile';
import { StudioColorField } from '../../ui/StudioColorField';
import {
  StudioButton,
  StudioCheckbox,
  StudioAccordion,
  StudioAccordionDetails,
  StudioAccordionSummary,
  StudioFormControl,
  StudioFormHelperText,
  StudioFormLabel,
  StudioIconButton,
  StudioLabeledControl,
  StudioOption,
  StudioSearchField,
  StudioSelect,
  StudioSwitch,
  StudioTab,
  StudioTabs,
  StudioTextField
} from '../../ui/controls';
import { MapperContextPanel } from './MapperContextPanel';
import { StyleAttributeMatrix } from './StyleAttributeMatrix';
import { ViewportProperties } from './ViewportProperties';
import { useCoarseWheelScroll } from '../../ui/useCoarseWheelScroll';

export type InspectorDocumentView = 'object' | 'style' | 'mapper' | 'viewport';

interface InspectorProps {
  ariaLabel?: string;
  documentView?: InspectorDocumentView;
  onCommit(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void;
  onCommitViewport(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void;
  onCommitStyle(request: StudioStyleEditRequest): boolean;
  onCopyId(id: string): void;
  onOpenMapper(): void;
  onOpenSource(document: StudioDocumentKind, path: Array<string | number>): void;
  onResetProfile(): void;
  onUnsetStyle(request: StudioStyleUnsetRequest): boolean;
  onViewportPreferencesChange(patch: Partial<StudioViewportPreferences>): void;
  profile: StudioAuthoringProfileOverride;
  state: 'default' | 'open' | 'closed';
  snapshot: StudioSessionSnapshot;
  showDocumentTabs?: boolean;
  viewportPreferences: StudioViewportPreferences;
}

const inspectorDocumentViews: Array<{ id: InspectorDocumentView; label: string }> = [
  { id: 'object', label: 'Object' },
  { id: 'style', label: 'Style' },
  { id: 'mapper', label: 'Mapper' },
  { id: 'viewport', label: 'Viewport' }
];
const styleTargets = new Set<StyleTargetKind>(['node', 'link', 'linkDirection', 'path', 'region', 'shape', 'callout', 'text']);
const mapperTargets = new Set<MapperAuthoringTargetKind>(['node', 'link', 'linkDirection', 'path', 'region', 'graph']);
const styleTargetLabels: Record<StyleTargetKind, string> = {
  callout: 'Callout',
  link: 'Link',
  linkDirection: 'Link direction',
  node: 'Node',
  path: 'Path',
  region: 'Region',
  shape: 'Shape',
  text: 'Text'
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function nestedValue(value: unknown, path: string[]): unknown {
  return path.reduce((current, segment) => (
    current && typeof current === 'object' && !Array.isArray(current)
      ? (current as Record<string, unknown>)[segment]
      : undefined
  ), value);
}

function setNestedValue(target: Record<string, unknown>, path: string[], value: unknown) {
  let current = target;
  path.forEach((segment, index) => {
    if (index === path.length - 1) {
      current[segment] = value;
      return;
    }
    const child = record(current[segment]);
    current[segment] = child;
    current = child;
  });
}

function nestedValueWithRequiredDefaults(
  field: AuthoringFieldMetadata,
  value: unknown
): Record<string, unknown> {
  const result = structuredClone(record(value));
  field.nestedFields?.filter((nested) => nested.required).forEach((nested) => {
    const segments = nested.path.split('.');
    if (nestedValue(result, segments) !== undefined) return;
    const fallback = authoringFieldDefaultValue(nestedFieldMetadata(field, nested));
    if (fallback !== undefined) setNestedValue(result, segments, fallback);
  });
  return result;
}

function draftValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function targetForSelection(kind: string | undefined): StyleTargetKind | undefined {
  return kind && styleTargets.has(kind as StyleTargetKind) ? kind as StyleTargetKind : undefined;
}

function mapperTargetForSelection(kind: string | undefined): MapperAuthoringTargetKind | undefined {
  return kind && mapperTargets.has(kind as MapperAuthoringTargetKind) ? kind as MapperAuthoringTargetKind : undefined;
}

export interface StyleFieldEditorProps {
  assetOptions: string[];
  compact?: boolean;
  explicit?: boolean;
  field: AuthoringFieldMetadata;
  onCommit(path: string[], value: unknown): void;
  onUnset?(path: string[]): void;
  path?: string[];
  value: unknown;
}

function FieldResetAction({
  explicit,
  field,
  onUnset
}: {
  explicit: boolean;
  field: AuthoringFieldMetadata;
  onUnset(): void;
}) {
  if (!explicit) return null;
  return <StudioIconButton
    aria-label={`Use inherited ${field.label}`}
    className="studio-field-reset"
    onClick={onUnset}
    title="Use inherited value"
    type="button"
  ><RestartAltIcon fontSize="inherit" /></StudioIconButton>;
}

function nestedFieldMetadata(parent: AuthoringFieldMetadata, nested: AuthoringNestedFieldMetadata): AuthoringFieldMetadata {
  return {
    control: nested.control,
    default: nested.default,
    description: nested.description,
    examples: nested.examples,
    group: parent.group,
    label: nested.label,
    level: nested.level,
    order: nested.order,
    path: nested.path,
    targets: parent.targets,
    valueType: nested.valueType,
    values: nested.values,
    visibleWhen: nested.visibleWhen
  };
}

export function StyleFieldEditor({
  assetOptions,
  compact = false,
  explicit = false,
  field,
  onCommit,
  onUnset,
  path = [field.path],
  value
}: StyleFieldEditorProps) {
  const effective = value ?? authoringFieldDefaultValue(field);
  const [draft, setDraft] = useState(draftValue(effective));
  const [error, setError] = useState<string>();
  useEffect(() => {
    setDraft(draftValue(effective));
    setError(undefined);
  }, [effective, field.path]);

  function commit(input: unknown = draft) {
    const result = coerceAuthoringFieldValue(field, input);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(undefined);
    if (JSON.stringify(result.value) !== JSON.stringify(value)) onCommit(path, result.value);
  }

  function inputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === 'Escape') {
      setDraft(draftValue(effective));
      setError(undefined);
      event.currentTarget.blur();
    }
  }

  const options = field.control?.kind === 'asset' ? assetOptions : field.values || [];
  const selectOptions = draft && !options.includes(draft) ? [draft, ...options] : options;
  const specializedEditor = field.control?.specializedEditor;
  const generatedId = useId();
  const fieldId = `studio-field-${generatedId.replaceAll(':', '')}`;
  const descriptionId = `studio-field-description-${path.join('-')}`;
  const errorId = `studio-field-error-${path.join('-')}`;

  if (field.control?.kind === 'nested' && field.nestedFields) {
    const nestedRecord = record(value);
    return (
      <StudioFormControl className="studio-nested-field" component="fieldset" data-specialized-editor={specializedEditor}>
        <StudioFormLabel component="legend">
          <Typography component="span" variant="subtitle2">{field.label}</Typography>
          {onUnset ? <FieldResetAction explicit={explicit} field={field} onUnset={() => onUnset(path)} /> : null}
        </StudioFormLabel>
        <StudioFormHelperText className="studio-field-description">{field.description}</StudioFormHelperText>
        {field.nestedFields
          .filter((nested) => authoringFieldIsVisible(nestedFieldMetadata(field, nested), nestedRecord))
          .sort((left, right) => left.order - right.order)
          .map((nested) => {
            const segments = nested.path.split('.');
            const nestedField = nestedFieldMetadata(field, nested);
            return (
              <StyleFieldEditor
                assetOptions={assetOptions}
                explicit={nestedValue(nestedRecord, segments) !== undefined}
                field={nestedField}
                key={nested.path}
                onCommit={(nestedPath, next) => {
                  const nextValue = nestedValueWithRequiredDefaults(field, nestedRecord);
                  setNestedValue(nextValue, nestedPath, next);
                  onCommit(path, nextValue);
                }}
                onUnset={onUnset ? (nestedPath) => onUnset([...path, ...nestedPath]) : undefined}
                path={segments}
                value={nestedValue(nestedRecord, segments)}
              />
            );
          })}
      </StudioFormControl>
    );
  }

  return (
    <StudioFormControl className={`studio-generated-field${compact ? ' studio-generated-field--compact' : ''}`} data-field-path={path.join('.')} data-specialized-editor={specializedEditor} error={Boolean(error)}>
      {!compact ? <Box className="studio-generated-field-heading">
        <StudioFormLabel htmlFor={fieldId}>{field.label}</StudioFormLabel>
        {onUnset && field.valueType !== 'color'
          ? <FieldResetAction explicit={explicit} field={field} onUnset={() => onUnset(path)} />
          : null}
      </Box> : null}
      <Box className="studio-generated-field-control">
      {field.control?.kind === 'switch' ? (
        <StudioLabeledControl
          className="studio-switch-field"
          control={<StudioSwitch checked={effective === true} id={fieldId} onChange={(event) => commit(event.target.checked)} />}
          label={effective === true ? 'On' : 'Off'}
        />
      ) : field.control?.kind === 'select' || field.control?.kind === 'asset' ? (
        <StudioSelect
          aria-describedby={compact ? undefined : descriptionId}
          aria-label={field.label}
          id={fieldId}
          onChange={(event) => {
            setDraft(event.target.value);
            commit(event.target.value);
          }}
          value={draft}
        >
          {!draft ? <StudioOption value="">Not set</StudioOption> : null}
          {selectOptions.map((option) => <StudioOption key={option} value={option}>{option}</StudioOption>)}
        </StudioSelect>
      ) : field.valueType === 'color' ? (
        <StudioColorField
          ariaDescribedBy={compact ? undefined : descriptionId}
          error={error}
          id={fieldId}
          label={field.label}
          onChange={setDraft}
          onCommit={(next) => commit(next ?? draft)}
          onReset={onUnset && explicit ? () => onUnset(path) : undefined}
          resetLabel={`Use inherited ${field.label}`}
          value={draft}
        />
      ) : (
        <Box className="studio-generated-input">
          <StudioTextField
            aria-describedby={`${compact ? '' : descriptionId}${error ? ` ${errorId}` : ''}` || undefined}
            aria-errormessage={error ? errorId : undefined}
            aria-label={field.label}
            error={Boolean(error)}
            id={fieldId}
            inputMode={field.valueType === 'integer' || field.valueType === 'number' ? 'decimal' : undefined}
            onBlur={() => commit()}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={inputKeyDown}
            slotProps={{
              htmlInput: {
                max: field.control?.maximum,
                min: field.control?.minimum,
                step: field.control?.step
              }
            }}
            type={field.valueType === 'integer' || field.valueType === 'number' ? 'number' : 'text'}
            value={draft}
          />
        </Box>
      )}
      {compact && onUnset && field.valueType !== 'color'
        ? <FieldResetAction explicit={explicit} field={field} onUnset={() => onUnset(path)} />
        : null}
      </Box>
      {!compact ? <StudioFormHelperText className="studio-field-description" id={descriptionId}>{field.description}</StudioFormHelperText> : null}
      {error ? <StudioFormHelperText className="studio-field-error" error id={errorId} role="alert">{error}</StudioFormHelperText> : null}
    </StudioFormControl>
  );
}

function PositionEditor({
  objectPath,
  onCommit,
  position
}: {
  objectPath: Array<string | number>;
  onCommit(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void;
  position: unknown[];
}) {
  return (
    <Box className="studio-field-group" component="section">
      <Typography component="h3" variant="subtitle2">Position</Typography>
      <Box className="studio-field-row">
        {['X', 'Y'].map((label, index) => (
          <Box className="studio-field" key={label}>
            <Typography component="span" variant="caption">{label}</Typography>
            <StudioTextField
              aria-label={`Position ${label}`}
              key={`${label}-${String(position[index] ?? 0)}`}
              defaultValue={String(position[index] ?? 0)}
              onBlur={(event) => onCommit([...objectPath, 'position', index], Number(event.target.value), objectPath)}
              type="number"
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function Inspector({
  ariaLabel = 'Properties',
  documentView,
  onCommit,
  onCommitViewport,
  onCommitStyle,
  onCopyId,
  onOpenMapper,
  onOpenSource,
  onResetProfile,
  onUnsetStyle,
  onViewportPreferencesChange,
  profile,
  showDocumentTabs = true,
  state,
  snapshot,
  viewportPreferences
}: InspectorProps) {
  const renderCount = useRef(0);
  renderCount.current += 1;
  const [internalDocumentView, setInternalDocumentView] = useState<InspectorDocumentView>('viewport');
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [query, setQuery] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [styleTarget, setStyleTarget] = useState<StyleTargetKind>('node');
  const [selectedStyleFieldPath, setSelectedStyleFieldPath] = useState<string>();
  const stylePanelRef = useRef<HTMLElement>(null);
  const selection = snapshot.selection[0];
  const selectedStyleTargets = [...new Set(snapshot.selection
    .map((candidate) => targetForSelection(candidate.kind))
    .filter((candidate): candidate is StyleTargetKind => Boolean(candidate)))];
  const singleStyleSelection = snapshot.selection.length === 1 && selectedStyleTargets.length === 1;
  const selectionKey = selection ? `${selection.kind}:${selection.id}` : undefined;
  const previousSelectionKey = useRef<string>();
  const object = useMemo(
    () => findAuthoringObject(snapshot.projection.document, selection as AuthoringObjectSelection | undefined),
    [selection, snapshot.projection.document]
  );
  const objectPath = useMemo(
    () => selection
      ? authoringObjectSourcePath(snapshot.projection.document, selection as AuthoringObjectSelection)
      : undefined,
    [selection, snapshot.projection.document]
  );
  const selectedTarget = selectedStyleTargets.length === 1 ? selectedStyleTargets[0] : undefined;
  const activeStyleTarget = styleTarget;
  const mapperTarget = mapperTargetForSelection(selection?.kind);
  const activeDocumentView = documentView ?? internalDocumentView;
  useCoarseWheelScroll(stylePanelRef, activeDocumentView === 'style');
  const style = record(object?.style);
  const position = Array.isArray(object?.position) ? object.position : undefined;
  const assetOptions = Object.keys(snapshot.projection.document.icons || {}).sort();
  const allFields = activeDocumentView === 'style' ? styleAuthoringMetadataByTarget[activeStyleTarget] : [];
  const provenance = useMemo(
    () => activeDocumentView === 'style' && selectedTarget && object
      ? resolveStyleProvenance(selectedTarget, object as Parameters<typeof resolveStyleProvenance>[1], snapshot.projection.document, {
          inlineSourcePath: objectPath
        })
      : [],
    [activeDocumentView, object, objectPath, selectedTarget, snapshot.projection.document]
  );
  const provenanceByKey = new Map(provenance.map((field) => [field.key, field]));
  const objectStyleEnabled = Boolean(singleStyleSelection && objectPath && selectedTarget === activeStyleTarget);
  const objectStyle = objectStyleEnabled ? style : {};
  const editScope: { kind: 'object' } | undefined = objectStyleEnabled ? { kind: 'object' } : undefined;
  const effectiveStyle = Object.fromEntries(provenance.map((field) => [field.key, field.effectiveValue]));
  const fieldVisibilityLayers = [effectiveStyle, objectStyle];
  const resolvedProfile = resolveStudioFieldProfile(allFields, activeStyleTarget, profile);
  const profileByPath = new Map(resolvedProfile.map((field) => [field.path, field]));
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchingFields = allFields.filter((field) => {
    const fieldProfile = profileByPath.get(field.path);
    if (fieldProfile?.hidden && !showHidden) return false;
    if (!fieldVisibilityLayers.some((layer) => authoringFieldIsVisible(field, layer))) return false;
    return !normalizedQuery || [field.path, field.label, field.description, field.group, ...(field.aliases || [])]
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
  }).sort((left, right) => (
    (profileByPath.get(left.path)?.order ?? left.order) - (profileByPath.get(right.path)?.order ?? right.order)
    || left.path.localeCompare(right.path)
  ));
  const mainFields = matchingFields.filter((field) => (
    (profileByPath.get(field.path)?.level || field.level) === 'basic'
  ));
  const additionalFields = matchingFields.filter((field) => (
    (profileByPath.get(field.path)?.level || field.level) !== 'basic'
  ));
  const displayedFields = normalizedQuery || showMoreFields
    ? matchingFields
    : mainFields;
  const groups = displayedFields.reduce<Map<string, AuthoringFieldMetadata[]>>((result, field) => {
    const current = result.get(field.group) || [];
    current.push(field);
    result.set(field.group, current);
    return result;
  }, new Map());
  const knownKeys = new Set(allFields.map((field) => field.path));
  const unknownKeys = Object.keys(objectStyle).filter((key) => !knownKeys.has(key));
  const identityKey = selection?.kind === 'callout' ? 'title' : selection?.kind === 'text' ? 'text' : 'name';
  const identityLabel = identityKey === 'title' ? 'Title' : identityKey === 'text' ? 'Text' : 'Name';
  const identityValue = String(object?.[identityKey] || '');

  useEffect(() => {
    if (selectedTarget) setStyleTarget(selectedTarget);
    setSelectedStyleFieldPath(undefined);
  }, [selection?.id, selectedTarget]);
  useEffect(() => {
    if (selectionKey === previousSelectionKey.current) return;
    previousSelectionKey.current = selectionKey;
    if (documentView === undefined) setInternalDocumentView(selectionKey ? 'object' : 'viewport');
  }, [documentView, selectionKey]);
  useEffect(() => setShowMoreFields(false), [activeStyleTarget]);

  function commitStyle(fieldPath: string[], value: unknown) {
    if (!editScope) return;
    onCommitStyle({ fieldPath, objectPath, scope: editScope, value });
  }

  function unsetStyle(fieldPath: string[]) {
    if (!editScope) return;
    onUnsetStyle({ fieldPath, objectPath, scope: editScope });
  }

  function openUnsupportedStyleField(key: string) {
    if (objectPath) onOpenSource('topology', [...objectPath, 'style', key]);
  }

  function activateStyleField(field: AuthoringFieldMetadata) {
    if (!objectStyleEnabled) return;
    setSelectedStyleFieldPath(field.path);
  }

  function styleEditorValue(field: AuthoringFieldMetadata) {
    if (objectStyle[field.path] !== undefined) return objectStyle[field.path];
    return provenanceByKey.get(field.path)?.effectiveValue ?? authoringFieldDefaultValue(field);
  }

  return (
    <Paper className={`studio-inspector${showDocumentTabs ? '' : ' studio-inspector--single-view'}`} aria-label={ariaLabel} component="aside" data-render-count={renderCount.current} data-state={state} elevation={0} square>
      <Typography className="studio-visually-hidden" component="h2">{ariaLabel}</Typography>
      <Box className="studio-inspector-content">
        {showDocumentTabs ? <StudioTabs
          aria-label="Contextual properties"
          className="studio-inspector-document-tabs"
          onChange={(_event, value: InspectorDocumentView) => setInternalDocumentView(value)}
          selectionFollowsFocus
          value={activeDocumentView}
          variant="fullWidth"
        >
          {inspectorDocumentViews.map((item) => (
            <StudioTab
              aria-controls={`studio-inspector-${item.id}-panel`}
              id={`studio-inspector-${item.id}-tab`}
              key={item.id}
              label={item.label}
              value={item.id}
            />
          ))}
        </StudioTabs> : null}
        {activeDocumentView === 'viewport' ? (
          <ViewportProperties
            onCommit={onCommitViewport}
            onPreferencesChange={onViewportPreferencesChange}
            preferences={viewportPreferences}
            snapshot={snapshot}
          />
        ) : null}
        {activeDocumentView === 'object' && selection && object && objectPath ? (
            <Box
              aria-label="Object fields"
              className="studio-inspector-document-panel"
              id="studio-inspector-object-panel"
              role="tabpanel"
            >
              <Box className="studio-field-group" component="section">
                <Typography component="h3" variant="subtitle2">Identity</Typography>
                <Box className="studio-field">
                  <Typography component="span" variant="caption">{identityLabel}</Typography>
                  <StudioTextField
                    aria-label={identityLabel}
                    key={identityValue}
                    defaultValue={identityValue}
                    minRows={identityKey === 'text' ? 3 : undefined}
                    multiline={identityKey === 'text'}
                    onBlur={(event) => onCommit([...objectPath, identityKey], event.target.value, objectPath)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && (identityKey !== 'text' || !event.shiftKey)) {
                        event.preventDefault();
                        event.currentTarget.blur();
                      }
                      if (event.key === 'Escape') {
                        const input = event.target as HTMLInputElement;
                        input.value = identityValue;
                        input.blur();
                      }
                    }}
                  />
                </Box>
              </Box>
              <StudioAccordion className="studio-object-advanced">
                <StudioAccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>Advanced</StudioAccordionSummary>
                <StudioAccordionDetails>
                  <Box className="studio-field studio-readonly-field">
                    <Typography component="span" variant="caption">ID</Typography>
                    <StudioTextField aria-label="ID" slotProps={{ input: { readOnly: true } }} value={selection.id} />
                    <StudioIconButton aria-label="Copy object ID" onClick={() => onCopyId(selection.id)} title="Copy object ID">
                      <ContentCopyIcon fontSize="small" />
                    </StudioIconButton>
                  </Box>
                  <Typography className="studio-field-description" color="text.secondary" variant="caption">Stored in topology.yaml</Typography>
                  {position ? <PositionEditor objectPath={objectPath} onCommit={onCommit} position={position} /> : null}
                </StudioAccordionDetails>
              </StudioAccordion>
            </Box>
          ) : null}
        {activeDocumentView === 'object' && (!selection || !object || !objectPath) ? (
          <Box className="studio-inspector-empty studio-inspector-document-panel" id="studio-inspector-object-panel" role="tabpanel">
            <Typography variant="body2">Select an object on the canvas.</Typography>
          </Box>
        ) : null}
        {activeDocumentView === 'mapper' && mapperTarget ? (
          <MapperContextPanel onOpenMapper={onOpenMapper} snapshot={snapshot} target={mapperTarget} />
        ) : null}
        {activeDocumentView === 'mapper' && !mapperTarget ? (
          <Box className="studio-inspector-empty studio-inspector-document-panel" id="studio-inspector-mapper-panel" role="tabpanel">
            <Typography variant="body2">Select a topology object to inspect telemetry mapping.</Typography>
          </Box>
        ) : null}
          {activeDocumentView === 'style' ? (
            <Box
              aria-label={`${activeStyleTarget} style fields`}
              className="studio-style-inspector studio-inspector-document-panel"
              id="studio-inspector-style-panel"
              ref={stylePanelRef}
              role="tabpanel"
            >
              <Stack aria-label="Style context" className="studio-style-context" data-mixed={!objectStyleEnabled || undefined} spacing={0.25}>
                <Typography component="strong" variant="subtitle2">{objectStyleEnabled && selection
                  ? `${styleTargetLabels[activeStyleTarget]} · ${selection.id}`
                  : 'No single object selected'}</Typography>
                <Typography color="text.secondary" variant="caption">{objectStyleEnabled
                  ? 'Changes apply only to this object.'
                  : 'Select one object to edit its style.'}</Typography>
              </Stack>
              {!objectStyleEnabled ? (
                <Box className="studio-inspector-empty"><Typography variant="body2">Select one object to continue.</Typography></Box>
              ) : <>
              <StudioSearchField
                aria-label="Search style fields"
                className="studio-inspector-search"
                clearLabel="Clear style field search"
                onChange={(event) => setQuery(event.target.value)}
                onClear={() => setQuery('')}
                placeholder="Search fields"
                value={query}
              />
              <StudioAccordion className="studio-inspector-profile-actions">
                <StudioAccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>Customize fields</StudioAccordionSummary>
                <StudioAccordionDetails>
                  <StudioLabeledControl control={<StudioCheckbox checked={showHidden} onChange={(event) => setShowHidden(event.target.checked)} />} label="Show hidden" />
                  <StudioButton aria-label="Reset field profile" onClick={onResetProfile} title="Reset field profile" type="button"><RestartAltIcon fontSize="small" />Reset</StudioButton>
                </StudioAccordionDetails>
              </StudioAccordion>
              <Box
                className="studio-generated-fields"
                data-additional-field-count={additionalFields.length}
                data-field-count={matchingFields.length}
                data-main-field-count={mainFields.length}
                data-rendered-field-count={displayedFields.length}
              >
                <StyleAttributeMatrix
                  activeFieldPath={selectedStyleFieldPath}
                  effectiveStyle={effectiveStyle}
                  fieldsByGroup={groups}
                  onActivate={activateStyleField}
                  objectStyle={objectStyle}
                  renderEditor={(field, mode) => (
                    <Box className={`studio-style-matrix-editor studio-style-matrix-editor--${mode}`}>
                      <StyleFieldEditor
                        assetOptions={assetOptions}
                        compact={mode === 'inline'}
                        explicit={objectStyle[field.path] !== undefined}
                        field={field}
                        onCommit={commitStyle}
                        onUnset={unsetStyle}
                        value={styleEditorValue(field)}
                      />
                    </Box>
                  )}
                />
                {!matchingFields.length ? <Box className="studio-inspector-empty"><Typography variant="body2">No matching fields</Typography></Box> : null}
                {!normalizedQuery && additionalFields.length ? (
                  <StudioButton
                    aria-expanded={showMoreFields}
                    className="studio-show-more-fields"
                    onClick={() => setShowMoreFields((current) => !current)}
                    type="button"
                  >
                    {showMoreFields ? 'View Less' : `View More (${additionalFields.length})`}
                  </StudioButton>
                ) : null}
              </Box>
              </>}
              {unknownKeys.length ? (
                <Box className="studio-unsupported-fields" component="section">
                  <Typography component="h3" variant="subtitle2">Unsupported fields</Typography>
                  {unknownKeys.map((key) => (
                    <StudioButton
                      aria-label={`Open ${key} in YAML`}
                      key={key}
                      onClick={() => openUnsupportedStyleField(key)}
                      title="Open in topology YAML"
                      type="button"
                    >
                      <Typography component="code" variant="caption">{key}</Typography>
                    </StudioButton>
                  ))}
                  <Typography color="text.secondary" variant="caption">Preserved in YAML. Edit these fields in the source workspace.</Typography>
                </Box>
              ) : null}
            </Box>
          ) : null}
      </Box>
    </Paper>
  );
}
