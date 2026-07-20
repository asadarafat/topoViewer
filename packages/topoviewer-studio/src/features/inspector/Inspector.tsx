import { useDeferredValue, useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { IconSpec } from 'topoviewer';
import {
  authoringFieldDefaultValue,
  authoringFieldIsVisible,
  authoringObjectSourcePath,
  coerceAuthoringFieldValue,
  findAuthoringObject,
  type AuthoringFieldMetadata,
  type AuthoringNestedFieldMetadata,
  type AuthoringObjectSelection
} from 'topoviewer/authoring';
import type { StudioSessionSnapshot } from '../../contracts/project';
import type { StudioIdentityRenamePreview } from '../../contracts/inspector';
import type { StudioViewportPreferences } from '../viewport/types';
import { StudioColorField } from '../../ui/StudioColorField';
import { StudioCheckbox, StudioFormControl, StudioFormHelperText, StudioFormLabel, StudioIconButton, StudioLabeledControl, StudioMultiAutocomplete, StudioOption, StudioSelect, StudioTextField } from '../../ui/controls';
import { StudioPropertyRow } from '../../ui/StudioPropertyRow';
import { ViewportProperties } from './ViewportProperties';
import { studioSpace } from '../../ui/muiSpacing';
import { StudioIconPicker } from './StudioIconPicker';

export type InspectorDocumentView = 'object' | 'viewport';

interface InspectorProps {
  ariaLabel?: string;
  documentView: InspectorDocumentView;
  embedded?: boolean;
  onCommit(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void;
  onCommitViewport(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void;
  onCopyId(id: string): void;
  onPreviewIdRename(selection: AuthoringObjectSelection, nextId: string): StudioIdentityRenamePreview;
  onRenameId(selection: AuthoringObjectSelection, nextId: string): boolean;
  onUnset(path: Array<string | number>, scopePath: Array<string | number>): void;
  onViewportPreferencesChange(patch: Partial<StudioViewportPreferences>): void;
  snapshot: StudioSessionSnapshot;
  viewportPreferences: StudioViewportPreferences;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function nestedValue(value: unknown, path: string[]): unknown {
  return path.reduce((current, segment) => (current && typeof current === 'object' && !Array.isArray(current) ? (current as Record<string, unknown>)[segment] : undefined), value);
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

function nestedValueWithRequiredDefaults(field: AuthoringFieldMetadata, value: unknown): Record<string, unknown> {
  const result = structuredClone(record(value));
  field.nestedFields
    ?.filter((nested) => nested.required)
    .forEach((nested) => {
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

export interface StyleFieldEditorProps {
  compact?: boolean;
  disabled?: boolean;
  explicit?: boolean;
  field: AuthoringFieldMetadata;
  iconDefinitions?: Record<string, IconSpec>;
  mixed?: boolean;
  onCommit(path: string[], value: unknown): void;
  onUnset?(path: string[]): void;
  path?: string[];
  value: unknown;
}

function FieldResetAction({ explicit, field, onUnset }: { explicit: boolean; field: AuthoringFieldMetadata; onUnset(): void }) {
  if (!explicit) return null;
  return (
    <StudioIconButton aria-label={`Use inherited ${field.label}`} onClick={onUnset} title="Remove override and use inherited value" type="button">
      <RestartAltIcon fontSize="inherit" />
    </StudioIconButton>
  );
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

export function StyleFieldEditor({ compact = false, disabled = false, explicit = false, field, iconDefinitions = {}, mixed = false, onCommit, onUnset, path = [field.path], value }: StyleFieldEditorProps) {
  const effective = mixed ? undefined : (value ?? authoringFieldDefaultValue(field));
  const [draft, setDraft] = useState(draftValue(effective));
  const [error, setError] = useState<string>();
  useEffect(() => {
    setDraft(draftValue(effective));
    setError(undefined);
  }, [effective, field.path, mixed]);

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

  const options = field.control?.kind === 'asset' ? Object.keys(iconDefinitions).sort() : field.values || [];
  const selectOptions = draft && !options.includes(draft) ? [draft, ...options] : options;
  const specializedEditor = field.control?.specializedEditor;
  const generatedId = useId();
  const fieldId = `studio-field-${generatedId.replaceAll(':', '')}`;
  const descriptionId = `studio-field-description-${path.join('-')}`;
  const errorId = `studio-field-error-${path.join('-')}`;

  if (field.control?.kind === 'nested' && field.nestedFields) {
    const nestedRecord = record(value);
    const availableNestedFields = field.nestedFields
      .filter((nested) => authoringFieldIsVisible(nestedFieldMetadata(field, nested), nestedRecord))
      .filter((nested) => !(nested.control?.kind === 'select' && nested.values?.length === 1))
      .sort((left, right) => left.order - right.order);
    const nestedFieldsId = `${fieldId}-nested-fields`;
    return (
      <Box
        data-specialized-editor={specializedEditor}
        sx={{
          display: 'grid',
          minWidth: 0
        }}
      >
        {mixed ? <StudioFormHelperText sx={{ color: 'warning.main' }}>Mixed values</StudioFormHelperText> : null}
        <Box id={nestedFieldsId} sx={{ display: 'grid' }}>
          {availableNestedFields.map((nested) => {
            const segments = nested.path.split('.');
            const nestedField = nestedFieldMetadata(field, nested);
            return (
              <StudioPropertyRow
                description={nested.description}
                key={nested.path}
                label={nested.path === 'type' ? field.label : nested.label}
              >
                <StyleFieldEditor
                  compact
                  disabled={disabled}
                  explicit={nestedValue(nestedRecord, segments) !== undefined}
                  field={nestedField}
                  iconDefinitions={iconDefinitions}
                  mixed={mixed}
                  onCommit={(nestedPath, next) => {
                    const nextValue = nestedValueWithRequiredDefaults(field, nestedRecord);
                    setNestedValue(nextValue, nestedPath, next);
                    onCommit(path, nextValue);
                  }}
                  onUnset={onUnset ? (nestedPath) => onUnset([...path, ...nestedPath]) : undefined}
                  path={segments}
                  value={nestedValue(nestedRecord, segments)}
                />
              </StudioPropertyRow>
            );
          })}
        </Box>
      </Box>
    );
  }

  return (
    <StudioFormControl
      className={`studio-generated-field${compact ? ' studio-generated-field--compact' : ''}`}
      data-field-path={path.join('.')}
      data-specialized-editor={specializedEditor}
      disabled={disabled}
      error={Boolean(error)}
      sx={{
        display: 'grid',
        gap: compact ? 0 : studioSpace.space4,
        height: compact ? '100%' : 'auto',
        minWidth: 0
      }}
    >
      {!compact ? (
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: studioSpace.space8,
            justifyContent: 'space-between'
          }}
        >
          <StudioFormLabel htmlFor={fieldId}>{field.label}</StudioFormLabel>
          {onUnset && field.valueType !== 'color' ? <FieldResetAction explicit={explicit} field={field} onUnset={() => onUnset(path)} /> : null}
        </Box>
      ) : null}
      <Box
        className="studio-generated-field-control"
        sx={{
          alignItems: 'center',
          display: 'grid',
          gap: studioSpace.space4,
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          minWidth: 0
        }}
      >
        {field.control?.kind === 'switch' ? (
          <StudioLabeledControl
            control={<StudioCheckbox aria-label={field.label} checked={effective === true} disabled={disabled} id={fieldId} indeterminate={mixed} onChange={(event) => commit(event.target.checked)} />}
            label={mixed ? 'Mixed' : effective === true ? 'On' : 'Off'}
            sx={{ justifyContent: 'space-between', m: 0 }}
          />
        ) : field.control?.kind === 'asset' && specializedEditor === 'icon-picker' ? (
          <StudioIconPicker
            ariaDescribedBy={compact ? undefined : descriptionId}
            disabled={disabled}
            icons={iconDefinitions}
            id={fieldId}
            mixed={mixed}
            onChange={(next) => {
              setDraft(next);
              commit(next);
            }}
            options={selectOptions}
            value={draft}
          />
        ) : field.control?.kind === 'select' || field.control?.kind === 'asset' ? (
          <StudioSelect
            aria-describedby={compact ? undefined : descriptionId}
            aria-label={field.label}
            disabled={disabled}
            id={fieldId}
            onChange={(event) => {
              setDraft(event.target.value);
              commit(event.target.value);
            }}
            value={draft}
          >
            {!draft ? <StudioOption value="">{mixed ? 'Mixed' : 'Not set'}</StudioOption> : null}
            {selectOptions.map((option) => (
              <StudioOption key={option} value={option}>
                {option}
              </StudioOption>
            ))}
          </StudioSelect>
        ) : field.valueType === 'color' ? (
          <StudioColorField
            ariaDescribedBy={compact ? undefined : descriptionId}
            disabled={disabled}
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
          <Box className="studio-generated-input" sx={{ display: 'flex', minWidth: 0 }}>
            <StudioTextField
              aria-describedby={`${compact ? '' : descriptionId}${error ? ` ${errorId}` : ''}` || undefined}
              aria-errormessage={error ? errorId : undefined}
              aria-label={field.label}
              disabled={disabled}
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
                  placeholder: mixed ? 'Mixed' : field.control?.placeholder,
                  step: field.control?.step
                }
              }}
              type={field.valueType === 'integer' || field.valueType === 'number' ? 'number' : 'text'}
              value={draft}
            />
          </Box>
        )}
        {compact && onUnset && field.valueType !== 'color' ? <FieldResetAction explicit={explicit} field={field} onUnset={() => onUnset(path)} /> : null}
      </Box>
      {!compact ? <StudioFormHelperText id={descriptionId}>{field.description}</StudioFormHelperText> : null}
      {error ? (
        <StudioFormHelperText error id={errorId} role="alert">
          {error}
        </StudioFormHelperText>
      ) : null}
    </StudioFormControl>
  );
}

function PositionEditor({ objectPath, onCommit, position }: { objectPath: Array<string | number>; onCommit(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void; position: unknown[] }) {
  return (
    <StudioPropertyRow className="studio-position-property-row" label="Position">
      <Box
        className="studio-property-row-pair"
        sx={{
          display: 'grid',
          gap: studioSpace.space6,
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'
        }}
      >
        {['X', 'Y'].map((label, index) => (
          <StudioTextField
            aria-label={`Position ${label}`}
            key={`${label}-${String(position[index] ?? 0)}`}
            defaultValue={String(position[index] ?? 0)}
            onBlur={(event) => onCommit([...objectPath, 'position', index], Number(event.target.value), objectPath)}
            slotProps={{
              input: {
                endAdornment: (
                  <Typography color="text.secondary" variant="caption">
                    {label}
                  </Typography>
                )
              }
            }}
            type="number"
          />
        ))}
      </Box>
    </StudioPropertyRow>
  );
}

export function Inspector({ ariaLabel = 'Properties', documentView, embedded = false, onCommit, onCommitViewport, onCopyId, onPreviewIdRename, onRenameId, onUnset, onViewportPreferencesChange, snapshot, viewportPreferences }: InspectorProps) {
  const selection = snapshot.selection[0];
  const object = useMemo(() => findAuthoringObject(snapshot.projection.document, selection as AuthoringObjectSelection | undefined), [selection, snapshot.projection.document]);
  const objectPath = useMemo(() => (selection ? authoringObjectSourcePath(snapshot.projection.document, selection as AuthoringObjectSelection) : undefined), [selection, snapshot.projection.document]);
  const position = Array.isArray(object?.position) ? object.position : undefined;
  const objectLabels = record(object?.labels);
  const hasDisplayAlias = Object.prototype.hasOwnProperty.call(objectLabels, 'name');
  const displayName = hasDisplayAlias ? String(objectLabels.name ?? '') : selection?.id || '';
  const [idDraft, setIdDraft] = useState(selection?.id || '');
  const deferredIdDraft = useDeferredValue(idDraft);
  useEffect(() => setIdDraft(selection?.id || ''), [selection?.id, selection?.kind]);
  const idPreview = useMemo(() => {
    if (!selection || !deferredIdDraft.trim() || deferredIdDraft.trim() === selection.id) return undefined;
    return onPreviewIdRename(selection as AuthoringObjectSelection, deferredIdDraft.trim());
  }, [deferredIdDraft, onPreviewIdRename, selection]);
  const idPreviewText = idDraft !== deferredIdDraft
    ? 'Checking rename impact...'
    : idPreview?.error
      ? idPreview.error
      : idPreview
        ? `${idPreview.affectedReferences} reference${idPreview.affectedReferences === 1 ? '' : 's'} across ${idPreview.affectedDocuments} file${idPreview.affectedDocuments === 1 ? '' : 's'} will update${idPreview.externalRisks ? `; ${idPreview.externalRisks} external telemetry ${idPreview.externalRisks === 1 ? 'dependency remains' : 'dependencies remain'} outside Studio` : ''}.`
        : 'Canonical identity used by topology, styles, attention, and mapper references.';
  const contentKey = selection?.kind === 'callout' ? 'title' : selection?.kind === 'text' ? 'text' : selection?.kind === 'linkDirection' ? 'label' : undefined;
  const contentLabel = contentKey === 'title' ? 'Title' : contentKey === 'text' ? 'Text' : contentKey === 'label' ? 'Direction label' : undefined;
  const contentValue = contentKey ? String(object?.[contentKey] || '') : '';
  const objectLayers = Array.isArray(object?.layers) ? object.layers.map(String) : [];
  const layerOptions = (snapshot.projection.document.graph?.layers || []).map((layer) => layer.id);
  const supportsLayers = selection && ['callout', 'link', 'node', 'path', 'region', 'shape', 'text'].includes(selection.kind);

  return (
    <Paper
      className={`studio-inspector studio-inspector--single-view${embedded ? ' studio-inspector--embedded' : ''}`}
      aria-label={ariaLabel}
      component={embedded ? 'section' : 'aside'}
      elevation={0}
      square
      sx={{
        height: embedded ? 'auto' : '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        width: '100%'
      }}
    >
      <Typography className="studio-visually-hidden" component="h2">
        {ariaLabel}
      </Typography>
      <Box
        className="studio-inspector-content"
        sx={{
          display: 'grid',
          gridTemplateRows: 'minmax(0, 1fr)',
          height: embedded ? 'auto' : '100%',
          minHeight: 0
        }}
      >
        {documentView === 'viewport' ? <ViewportProperties onCommit={onCommitViewport} onPreferencesChange={onViewportPreferencesChange} preferences={viewportPreferences} snapshot={snapshot} /> : null}
        {documentView === 'object' && selection && object && objectPath ? (
          <Box
            aria-label="Object fields"
            className="studio-inspector-document-panel"
            id="studio-inspector-object-panel"
            role="tabpanel"
            sx={{
              minHeight: 0,
              minWidth: 0,
              overflowY: embedded ? 'visible' : 'auto'
            }}
          >
            <Box className="studio-topology-property-list" component="section" sx={{ display: 'grid' }}>
              <StudioPropertyRow description="Canonical identity. Renaming updates known topology, stylesheet, attention, and mapper references." label="ID">
                <Box sx={{ alignItems: 'center', display: 'grid', gap: studioSpace.space4, gridTemplateColumns: 'minmax(0, 1fr) auto' }}>
                  <StudioTextField
                    aria-label="Object ID"
                    error={Boolean(idPreview?.error)}
                    helperText={idPreviewText}
                    onChange={(event) => setIdDraft(event.target.value)}
                    onBlur={(event) => {
                      const nextId = event.target.value.trim();
                      if (!nextId || nextId === selection.id) {
                        setIdDraft(selection.id);
                        return;
                      }
                      const preview = onPreviewIdRename(selection as AuthoringObjectSelection, nextId);
                      if (preview.error) return;
                      if (!onRenameId(selection as AuthoringObjectSelection, nextId)) setIdDraft(selection.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        event.currentTarget.blur();
                      }
                      if (event.key === 'Escape') {
                        setIdDraft(selection.id);
                        event.currentTarget.blur();
                      }
                    }}
                    value={idDraft}
                  />
                  <StudioIconButton aria-label="Copy object ID" onClick={() => onCopyId(selection.id)} title="Copy object ID">
                    <ContentCopyIcon fontSize="small" />
                  </StudioIconButton>
                </Box>
              </StudioPropertyRow>
              <StudioPropertyRow description="Optional non-unique label. Clear it to hide the visible label; enter the object ID to restore the default." label="Visible label">
                <StudioTextField
                  aria-label="Visible label"
                  key={`${selection.id}:${hasDisplayAlias}:${displayName}`}
                  defaultValue={displayName}
                  onBlur={(event) => {
                    const value = event.target.value.trim();
                    const path = [...objectPath, 'labels', 'name'];
                    if (value === displayName) return;
                    if (value === selection.id) {
                      if (hasDisplayAlias) onUnset(path, objectPath);
                      return;
                    }
                    onCommit(path, value, objectPath);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                    if (event.key === 'Escape') {
                      const input = event.target as HTMLInputElement;
                      input.value = displayName;
                      input.blur();
                    }
                  }}
                />
              </StudioPropertyRow>
              {contentKey && contentLabel ? (
                <StudioPropertyRow label={contentLabel}>
                  <StudioTextField
                    aria-label={contentLabel}
                    defaultValue={contentValue}
                    key={`${selection.id}:${contentKey}:${contentValue}`}
                    minRows={contentKey === 'text' ? 3 : undefined}
                    multiline={contentKey === 'text'}
                    onBlur={(event) => onCommit([...objectPath, contentKey], event.target.value, objectPath)}
                  />
                </StudioPropertyRow>
              ) : null}
              {position ? <PositionEditor objectPath={objectPath} onCommit={onCommit} position={position} /> : null}
              {supportsLayers && layerOptions.length ? (
                <StudioPropertyRow description="Topology layers containing this object." label="Layers">
                  <StudioMultiAutocomplete
                    ariaLabel="Layers"
                    disableCloseOnSelect
                    filterSelectedOptions
                    onChange={(_event, next) => {
                      if (next.length) onCommit([...objectPath, 'layers'], next, objectPath);
                    }}
                    options={layerOptions}
                    value={objectLayers}
                  />
                </StudioPropertyRow>
              ) : null}
            </Box>
          </Box>
        ) : null}
        {documentView === 'object' && (!selection || !object || !objectPath) ? (
          <Box className="studio-inspector-empty studio-inspector-document-panel" id="studio-inspector-object-panel" role="tabpanel" sx={{ color: 'text.secondary', p: studioSpace.space16 }}>
            <Typography variant="body2">Select an object on the canvas.</Typography>
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
}
