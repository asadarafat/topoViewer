import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
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
import type { StudioViewportPreferences } from '../viewport/types';
import { StudioColorField } from '../../ui/StudioColorField';
import {
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
  StudioSelect,
  StudioTextField
} from '../../ui/controls';
import { ViewportProperties } from './ViewportProperties';

export type InspectorDocumentView = 'object' | 'viewport';

interface InspectorProps {
  ariaLabel?: string;
  documentView: InspectorDocumentView;
  onCommit(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void;
  onCommitViewport(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void;
  onCopyId(id: string): void;
  onViewportPreferencesChange(patch: Partial<StudioViewportPreferences>): void;
  snapshot: StudioSessionSnapshot;
  viewportPreferences: StudioViewportPreferences;
}

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


export interface StyleFieldEditorProps {
  assetOptions: string[];
  compact?: boolean;
  disabled?: boolean;
  explicit?: boolean;
  field: AuthoringFieldMetadata;
  mixed?: boolean;
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
  disabled = false,
  explicit = false,
  field,
  mixed = false,
  onCommit,
  onUnset,
  path = [field.path],
  value
}: StyleFieldEditorProps) {
  const effective = mixed ? undefined : value ?? authoringFieldDefaultValue(field);
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
      <StudioFormControl className="studio-nested-field" component="fieldset" data-specialized-editor={specializedEditor} disabled={disabled}>
        <StudioFormLabel component="legend">
          <Typography component="span" variant="subtitle2">{field.label}</Typography>
          {onUnset ? <FieldResetAction explicit={explicit} field={field} onUnset={() => onUnset(path)} /> : null}
        </StudioFormLabel>
        <StudioFormHelperText className="studio-field-description">{field.description}</StudioFormHelperText>
        {mixed ? <StudioFormHelperText className="studio-field-mixed">Mixed values</StudioFormHelperText> : null}
        {field.nestedFields
          .filter((nested) => authoringFieldIsVisible(nestedFieldMetadata(field, nested), nestedRecord))
          .sort((left, right) => left.order - right.order)
          .map((nested) => {
            const segments = nested.path.split('.');
            const nestedField = nestedFieldMetadata(field, nested);
            return (
              <StyleFieldEditor
                assetOptions={assetOptions}
                disabled={disabled}
                explicit={nestedValue(nestedRecord, segments) !== undefined}
                field={nestedField}
                key={nested.path}
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
            );
          })}
      </StudioFormControl>
    );
  }

  return (
    <StudioFormControl className={`studio-generated-field${compact ? ' studio-generated-field--compact' : ''}`} data-field-path={path.join('.')} data-specialized-editor={specializedEditor} disabled={disabled} error={Boolean(error)}>
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
          control={<StudioCheckbox aria-label={field.label} checked={effective === true} disabled={disabled} id={fieldId} indeterminate={mixed} onChange={(event) => commit(event.target.checked)} />}
          label={mixed ? 'Mixed' : effective === true ? 'On' : 'Off'}
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
          {selectOptions.map((option) => <StudioOption key={option} value={option}>{option}</StudioOption>)}
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
        <Box className="studio-generated-input">
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
  onCopyId,
  onViewportPreferencesChange,
  snapshot,
  viewportPreferences
}: InspectorProps) {
  const selection = snapshot.selection[0];
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
  const position = Array.isArray(object?.position) ? object.position : undefined;
  const identityKey = selection?.kind === 'callout' ? 'title' : selection?.kind === 'text' ? 'text' : 'name';
  const identityLabel = identityKey === 'title' ? 'Title' : identityKey === 'text' ? 'Text' : 'Name';
  const identityValue = String(object?.[identityKey] || '');

  return (
    <Paper className="studio-inspector studio-inspector--single-view" aria-label={ariaLabel} component="aside" elevation={0} square>
      <Typography className="studio-visually-hidden" component="h2">{ariaLabel}</Typography>
      <Box className="studio-inspector-content">
        {documentView === 'viewport' ? (
          <ViewportProperties
            onCommit={onCommitViewport}
            onPreferencesChange={onViewportPreferencesChange}
            preferences={viewportPreferences}
            snapshot={snapshot}
          />
        ) : null}
        {documentView === 'object' && selection && object && objectPath ? (
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
        {documentView === 'object' && (!selection || !object || !objectPath) ? (
          <Box className="studio-inspector-empty studio-inspector-document-panel" id="studio-inspector-object-panel" role="tabpanel">
            <Typography variant="body2">Select an object on the canvas.</Typography>
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
}
