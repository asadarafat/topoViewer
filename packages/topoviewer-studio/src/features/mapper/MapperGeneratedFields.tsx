import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import CodeIcon from '@mui/icons-material/Code';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
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

interface MapperGeneratedFieldsProps {
  mapper: Record<string, unknown>;
  onCommit(request: StudioMapperFieldEditRequest): boolean;
  onOpenSource(path: Array<string | number>): void;
  onUnset(request: StudioMapperFieldUnsetRequest): boolean;
  rule?: StudioMapperRuleReference;
  view: 'advanced' | 'all';
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

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      setDraft(draftValue(value));
      setError(undefined);
      event.currentTarget.blur();
    }
  }

  const inputId = `studio-mapper-${path.map(String).join('-')}`;
  return (
    <div className="studio-mapper-field" data-field-path={field.path}>
      <div>
        <label htmlFor={inputId}>{field.label}</label>
        <button aria-label={`Unset ${field.label}`} disabled={value === undefined || field.required} onClick={() => onUnset({ path, scopePath })} type="button"><CloseIcon fontSize="inherit" /></button>
      </div>
      {field.valueType === 'boolean' ? (
        <label className="studio-switch-field">
          <input checked={value === true} id={inputId} onChange={(event) => commit(event.target.checked)} type="checkbox" />
          <span>{value === true ? 'On' : 'Off'}</span>
        </label>
      ) : field.valueType === 'enum' ? (
        <select aria-label={field.label} id={inputId} onChange={(event) => {
          setDraft(event.target.value);
          commit(event.target.value);
        }} value={draft}>
          {!field.required ? <option value="">Not set</option> : null}
          {(field.values || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input
          aria-invalid={Boolean(error)}
          id={inputId}
          inputMode={field.valueType === 'integer' || field.valueType === 'number' ? 'decimal' : undefined}
          onBlur={() => commit()}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={keyDown}
          type={field.valueType === 'integer' || field.valueType === 'number' ? 'number' : 'text'}
          value={draft}
        />
      )}
      <span>{field.description}</span>
      {error ? <strong role="alert">{error}</strong> : null}
    </div>
  );
}

export function MapperGeneratedFields({ mapper, onCommit, onOpenSource, onUnset, rule, view }: MapperGeneratedFieldsProps) {
  const [query, setQuery] = useState('');
  const fields = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return mapperApplicableMetadata(rule, view).filter((field) => !normalized || (
      `${field.path} ${field.label} ${field.description} ${field.group}`.toLowerCase().includes(normalized)
    ));
  }, [query, rule, view]);
  const groups = useMemo(() => Map.groupBy(fields, (field) => field.group), [fields]);
  const unknownPaths = useMemo(() => unknownMapperSourcePaths(mapper), [mapper]);

  return (
    <section className="studio-mapper-generated" aria-label={`${view} mapper fields`}>
      <label className="studio-inspector-search">
        <SearchIcon fontSize="small" />
        <input aria-label="Search mapper fields" onChange={(event) => setQuery(event.target.value)} placeholder="Search mapper fields" value={query} />
      </label>
      {[...groups.entries()].map(([group, groupFields]) => (
        <section className="studio-mapper-field-group" key={group}>
          <h3>{group}</h3>
          {groupFields.map((field) => {
            const path = mapperFieldSourcePath(field, rule);
            const direct = path && mapperFieldIsDirectlyEditable(field, rule);
            if (!path || !direct) {
              const sourcePath = path || [];
              return (
                <div className="studio-mapper-raw-field" data-field-path={field.path} key={field.path}>
                  <div><strong>{field.label}</strong><code>{field.path}</code></div>
                  <span>{field.description}</span>
                  <button onClick={() => onOpenSource(sourcePath)} type="button"><CodeIcon fontSize="inherit" /> Edit in YAML</button>
                </div>
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
        </section>
      ))}
      {unknownPaths.length ? (
        <section className="studio-mapper-unknown-fields">
          <h3>Future or unsupported fields</h3>
          <span>These values are source-preserved. Review them in YAML before changing them.</span>
          {unknownPaths.map((path) => (
            <button key={path.join('.')} onClick={() => onOpenSource(path)} type="button"><code>{path.join('.')}</code></button>
          ))}
        </section>
      ) : null}
    </section>
  );
}
