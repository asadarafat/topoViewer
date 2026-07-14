import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import CodeIcon from '@mui/icons-material/Code';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { MapperAuthoringFieldMetadata } from 'topoviewer/authoring';
import type {
  StudioMapperFieldEditRequest,
  StudioMapperFieldUnsetRequest,
  StudioMapperRuleReference
} from '../../contracts/mapper';
import {
  mapperApplicableMetadata,
  mapperFieldIsDirectlyEditable,
  mapperFieldScopePath,
  mapperFieldSourcePath,
  mapperValueAtPath,
  unknownMapperSourcePaths
} from './mapperFieldModel';
import { StudioColorField } from '../../ui/StudioColorField';
import {
  StudioButton,
  StudioFormControl,
  StudioFormHelperText,
  StudioFormLabel,
  StudioIconButton,
  StudioLabeledControl,
  StudioOption,
  StudioSearchField,
  StudioSelect,
  StudioSwitch,
  StudioTextField
} from '../../ui/controls';

interface MapperGeneratedFieldsProps {
  mapper: Record<string, unknown>;
  onCommit(request: StudioMapperFieldEditRequest): boolean;
  onOpenSource(path: Array<string | number>): void;
  onUnset(request: StudioMapperFieldUnsetRequest): boolean;
  rule?: StudioMapperRuleReference;
}

function draftValue(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value);
}

function coerce(field: MapperAuthoringFieldMetadata, input: string | boolean) {
  if (field.valueType === 'boolean') return { ok: true as const, value: Boolean(input) };
  if (field.valueType === 'number' || field.valueType === 'integer') {
    const value = Number(input);
    if (!Number.isFinite(value) || (field.valueType === 'integer' && !Number.isInteger(value))) {
      return { error: field.valueType === 'integer' ? 'Enter a whole number.' : 'Enter a finite number.', ok: false as const };
    }
    return { ok: true as const, value };
  }
  const value = String(input);
  if (field.valueType === 'enum' && field.values && !field.values.includes(value)) {
    return { error: `Choose one of: ${field.values.join(', ')}.`, ok: false as const };
  }
  return { ok: true as const, value };
}

function MapperScalarControl({
  field,
  onCommit,
  onUnset,
  path,
  scopePath,
  value
}: {
  field: MapperAuthoringFieldMetadata;
  onCommit(request: StudioMapperFieldEditRequest): boolean;
  onUnset(request: StudioMapperFieldUnsetRequest): boolean;
  path: Array<string | number>;
  scopePath: Array<string | number>;
  value: unknown;
}) {
  const [draft, setDraft] = useState(draftValue(value));
  const [error, setError] = useState<string>();
  useEffect(() => {
    setDraft(draftValue(value));
    setError(undefined);
  }, [field.path, value]);

  function commit(input: string | boolean = draft) {
    if (input === '' && !field.required && value === undefined) return;
    const result = coerce(field, input);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(undefined);
    if (JSON.stringify(result.value) !== JSON.stringify(value)) onCommit({ field, path, scopePath, value: result.value });
  }

  function keyDown(event: KeyboardEvent<HTMLElement>) {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Enter') {
      event.preventDefault();
      input.blur();
    } else if (event.key === 'Escape') {
      setDraft(draftValue(value));
      setError(undefined);
      input.blur();
    }
  }

  const inputId = `studio-mapper-${path.map(String).join('-')}`;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;
  return (
    <StudioFormControl className="studio-mapper-field" data-field-path={field.path} error={Boolean(error)}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <StudioFormLabel htmlFor={inputId}>{field.label}</StudioFormLabel>
        {field.valueType !== 'color' ? <StudioIconButton aria-label={`Unset ${field.label}`} disabled={value === undefined || field.required} onClick={() => onUnset({ path, scopePath })} title={`Unset ${field.label}`}><CloseIcon fontSize="inherit" /></StudioIconButton> : null}
      </Stack>
      {field.valueType === 'boolean' ? (
        <StudioLabeledControl className="studio-switch-field" control={<StudioSwitch checked={value === true} id={inputId} onChange={(event) => commit(event.target.checked)} />} label={value === true ? 'On' : 'Off'} />
      ) : field.valueType === 'enum' ? (
        <StudioSelect aria-describedby={descriptionId} aria-label={field.label} id={inputId} onChange={(event) => {
          setDraft(event.target.value);
          commit(event.target.value);
        }} value={draft}>
          {!field.required ? <StudioOption value="">Not set</StudioOption> : null}
          {(field.values || []).map((option) => <StudioOption key={option} value={option}>{option}</StudioOption>)}
        </StudioSelect>
      ) : field.valueType === 'color' ? (
        <StudioColorField
          ariaDescribedBy={descriptionId}
          error={error}
          id={inputId}
          label={field.label}
          onChange={setDraft}
          onCommit={(next) => commit(next ?? draft)}
          onReset={!field.required && value !== undefined ? () => {
            setDraft('');
            setError(undefined);
            onUnset({ path, scopePath });
          } : undefined}
          resetLabel={`Reset ${field.label} to default`}
          value={draft}
        />
      ) : (
        <StudioTextField
          aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ''}`}
          aria-errormessage={error ? errorId : undefined}
          error={Boolean(error)}
          id={inputId}
          inputMode={field.valueType === 'integer' || field.valueType === 'number' ? 'decimal' : undefined}
          onBlur={() => commit()}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={keyDown}
          type={field.valueType === 'integer' || field.valueType === 'number' ? 'number' : 'text'}
          value={draft}
        />
      )}
      <StudioFormHelperText id={descriptionId}>{field.description}</StudioFormHelperText>
      {error ? <StudioFormHelperText error id={errorId} role="alert">{error}</StudioFormHelperText> : null}
    </StudioFormControl>
  );
}

export function MapperGeneratedFields({ mapper, onCommit, onOpenSource, onUnset, rule }: MapperGeneratedFieldsProps) {
  const [query, setQuery] = useState('');
  const [showMore, setShowMore] = useState(false);
  const matchingFields = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return mapperApplicableMetadata(rule, 'all').filter((field) => !normalized || (
      `${field.path} ${field.label} ${field.description} ${field.group}`.toLowerCase().includes(normalized)
    ));
  }, [query, rule]);
  const commonFields = matchingFields.filter((field) => field.level === 'basic');
  const additionalFields = matchingFields.filter((field) => field.level !== 'basic');
  const fields = query.trim() || showMore ? matchingFields : commonFields;
  const groups = useMemo(() => {
    const grouped = new Map<string, typeof fields>();
    fields.forEach((field) => grouped.set(field.group, [...(grouped.get(field.group) || []), field]));
    return grouped;
  }, [fields]);
  const unknownPaths = useMemo(() => unknownMapperSourcePaths(mapper), [mapper]);

  return (
    <Box className="studio-mapper-generated" aria-label="Mapper fields" component="section">
      <StudioSearchField
        aria-label="Search mapper fields"
        className="studio-inspector-search"
        clearLabel="Clear mapper field search"
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
        placeholder="Search mapper fields"
        value={query}
      />
      {[...groups.entries()].map(([group, groupFields]) => (
        <Box className="studio-mapper-field-group" component="section" key={group}>
          <Typography component="h3" variant="subtitle2">{group}</Typography>
          {groupFields.map((field) => {
            const path = mapperFieldSourcePath(field, rule);
            const direct = path && mapperFieldIsDirectlyEditable(field, rule);
            if (!path || !direct) {
              const sourcePath = path || [];
              return (
                <Paper className="studio-mapper-raw-field" data-field-path={field.path} key={field.path} variant="outlined">
                  <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}><Typography component="strong" variant="subtitle2">{field.label}</Typography><Typography component="code" variant="caption">{field.path}</Typography></Stack>
                  <Typography color="text.secondary" component="span" variant="caption">{field.description}</Typography>
                  <StudioButton onClick={() => onOpenSource(sourcePath)}><CodeIcon fontSize="inherit" /> Edit in YAML</StudioButton>
                </Paper>
              );
            }
            return (
              <MapperScalarControl
                field={field}
                key={field.path}
                onCommit={onCommit}
                onUnset={onUnset}
                path={path}
                scopePath={(() => {
                  const scopePath = mapperFieldScopePath(path, field);
                  return scopePath.length && mapperValueAtPath(mapper, scopePath) === undefined ? [] : scopePath;
                })()}
                value={mapperValueAtPath(mapper, path)}
              />
            );
          })}
        </Box>
      ))}
      {unknownPaths.length ? (
        <Box className="studio-mapper-unknown-fields" component="section">
          <Typography component="h3" variant="subtitle2">Future or unsupported fields</Typography>
          <Typography color="text.secondary" component="span" variant="body2">These values are source-preserved. Review them in YAML before changing them.</Typography>
          {unknownPaths.map((path) => (
            <StudioButton key={path.join('.')} onClick={() => onOpenSource(path)}><Typography component="code" variant="caption">{path.join('.')}</Typography></StudioButton>
          ))}
        </Box>
      ) : null}
      {!query.trim() && additionalFields.length ? (
        <StudioButton
          aria-expanded={showMore}
          className="studio-show-more-fields"
          onClick={() => setShowMore((current) => !current)}
          type="button"
        >
          {showMore ? 'View Less' : `View More (${additionalFields.length})`}
        </StudioButton>
      ) : null}
    </Box>
  );
}
