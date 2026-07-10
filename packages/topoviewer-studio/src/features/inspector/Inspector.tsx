import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  authoringFieldDefaultValue,
  authoringFieldIsVisible,
  authoringObjectSourcePath,
  coerceAuthoringFieldValue,
  findAuthoringObject,
  resolveStyleProvenance,
  styleRuleAffectedObjects,
  styleAuthoringMetadataByTarget,
  type AuthoringFieldMetadata,
  type AuthoringNestedFieldMetadata,
  type AuthoringObjectSelection,
  type StyleFieldProvenance
} from 'topoviewer/authoring';
import type { StyleTargetKind } from 'topoviewer';
import type { StudioAuthoringProfileOverride, StudioFieldPreference } from '../../contracts/profiles';
import type { StudioDocumentKind, StudioSessionSnapshot } from '../../contracts/project';
import type {
  StudioSourceRangeLookup,
  StudioStyleEditRequest,
  StudioStyleEditScope,
  StudioStyleUnsetRequest
} from '../../contracts/inspector';
import {
  fieldLevelAfterToggle,
  resolveStudioFieldProfile
} from './profile';

type InspectorView = 'basic' | 'advanced' | 'all' | 'modified';

interface InspectorProps {
  onCommit(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void;
  onCommitStyle(request: StudioStyleEditRequest): boolean;
  onOpenSource(document: StudioDocumentKind, path: Array<string | number>): void;
  onReorderFieldProfile(target: StyleTargetKind, path: string, direction: -1 | 1): void;
  onResetProfile(): void;
  onUnsetStyle(request: StudioStyleUnsetRequest): boolean;
  onUpdateFieldProfile(
    target: StyleTargetKind,
    path: string,
    patch: Partial<Pick<StudioFieldPreference, 'hidden' | 'level' | 'order'>>
  ): void;
  profile: StudioAuthoringProfileOverride;
  sourceRange: StudioSourceRangeLookup;
  state: 'default' | 'open' | 'closed';
  snapshot: StudioSessionSnapshot;
}

const inspectorViews: Array<{ id: InspectorView; label: string }> = [
  { id: 'basic', label: 'Basic' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'all', label: 'All' },
  { id: 'modified', label: 'Modified' }
];
const styleTargets = new Set<StyleTargetKind>(['node', 'link', 'linkDirection', 'path', 'region', 'shape', 'callout']);

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

function draftValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function targetForSelection(kind: string | undefined): StyleTargetKind | undefined {
  return kind && styleTargets.has(kind as StyleTargetKind) ? kind as StyleTargetKind : undefined;
}

export interface StyleFieldEditorProps {
  assetOptions: string[];
  explicit: boolean;
  field: AuthoringFieldMetadata;
  onCommit(path: string[], value: unknown): void;
  onUnset(path: string[]): void;
  path?: string[];
  provenance?: StyleFieldProvenance;
  profileActions?: {
    hidden: boolean;
    level: 'basic' | 'advanced';
    onHide(hidden: boolean): void;
    onReorder(direction: -1 | 1): void;
    onToggleLevel(): void;
  };
  value: unknown;
  sourceRange?: StudioSourceRangeLookup;
}

function FieldActions({
  explicit,
  field,
  onDefault,
  onUnset,
  profileActions
}: {
  explicit: boolean;
  field: AuthoringFieldMetadata;
  onDefault(): void;
  onUnset(): void;
  profileActions?: StyleFieldEditorProps['profileActions'];
}) {
  const defaultValue = authoringFieldDefaultValue(field);
  return (
    <span className="studio-field-actions">
      {profileActions ? (
        <>
          <button aria-label={`Move ${field.label} earlier`} onClick={() => profileActions.onReorder(-1)} title="Move field earlier" type="button"><KeyboardArrowUpIcon fontSize="inherit" /></button>
          <button aria-label={`Move ${field.label} later`} onClick={() => profileActions.onReorder(1)} title="Move field later" type="button"><KeyboardArrowDownIcon fontSize="inherit" /></button>
          <button aria-label={`Move ${field.label} to ${profileActions.level === 'basic' ? 'Advanced' : 'Basic'}`} onClick={profileActions.onToggleLevel} title={`Move to ${profileActions.level === 'basic' ? 'Advanced' : 'Basic'}`} type="button"><SwapVertIcon fontSize="inherit" /></button>
          <button aria-label={`${profileActions.hidden ? 'Restore' : 'Hide'} ${field.label}`} onClick={() => profileActions.onHide(!profileActions.hidden)} title={profileActions.hidden ? 'Restore field' : 'Hide field'} type="button"><VisibilityOffIcon fontSize="inherit" /></button>
        </>
      ) : null}
      <button aria-label={`Use default for ${field.label}`} disabled={defaultValue === undefined} onClick={onDefault} title="Write the documented default" type="button"><RestartAltIcon fontSize="inherit" /></button>
      <button aria-label={`Unset ${field.label}`} disabled={!explicit} onClick={onUnset} title="Remove the explicit value" type="button"><CloseIcon fontSize="inherit" /></button>
    </span>
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

function ProvenanceDetails({
  provenance,
  sourceRange
}: {
  provenance: StyleFieldProvenance;
  sourceRange?: StudioSourceRangeLookup;
}) {
  const winner = provenance.winner;
  const winnerLabel = winner?.kind === 'rule' && winner.selector
    ? `Rule ${winner.selector}`
    : winner?.kind === 'inline'
      ? 'Object override'
      : winner?.kind === 'runtime'
        ? 'Runtime overlay'
        : winner?.kind === 'default'
          ? 'Default'
          : 'Not set';
  return (
    <details className="studio-style-provenance">
      <summary>{winnerLabel}</summary>
      <ol>
        {provenance.contributors.map((contributor, index) => {
          const range = contributor.path && (contributor.document === 'topology' || contributor.document === 'stylesheet')
            ? sourceRange?.(contributor.document, contributor.path)
            : undefined;
          return (
            <li data-overridden={contributor.overridden} key={`${contributor.kind}-${index}-${contributor.selector || ''}`}>
              <strong>{contributor.kind}</strong>
              {contributor.selector ? <code>{contributor.selector}</code> : null}
              <span>{JSON.stringify(contributor.value)}</span>
              {range ? <small>{contributor.document}.yaml:{range.line}:{range.column}</small> : null}
            </li>
          );
        })}
      </ol>
    </details>
  );
}

export function StyleFieldEditor({
  assetOptions,
  explicit,
  field,
  onCommit,
  onUnset,
  path = [field.path],
  profileActions,
  provenance,
  sourceRange,
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

  if (field.control?.kind === 'nested' && field.nestedFields) {
    const nestedRecord = record(value);
    return (
      <fieldset className="studio-nested-field" data-specialized-editor={specializedEditor}>
        <legend>
          <span>{field.label}</span>
          <FieldActions
            explicit={explicit}
            field={field}
            onDefault={() => {
              const defaultValue = authoringFieldDefaultValue(field);
              if (defaultValue !== undefined) onCommit(path, defaultValue);
            }}
            onUnset={() => onUnset(path)}
            profileActions={profileActions}
          />
        </legend>
        <span className="studio-field-description">{field.description}</span>
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
                onCommit={(nestedPath, next) => onCommit([...path, ...nestedPath], next)}
                onUnset={(nestedPath) => onUnset([...path, ...nestedPath])}
                path={segments}
                value={nestedValue(nestedRecord, segments)}
              />
            );
          })}
        {provenance ? <ProvenanceDetails provenance={provenance} sourceRange={sourceRange} /> : null}
      </fieldset>
    );
  }

  return (
    <div className="studio-generated-field" data-field-path={path.join('.')} data-specialized-editor={specializedEditor}>
      <div className="studio-generated-field-heading">
        <label htmlFor={`studio-field-${path.join('-')}`}>{field.label}</label>
        <FieldActions
          explicit={explicit}
          field={field}
          onDefault={() => {
            const defaultValue = authoringFieldDefaultValue(field);
            if (defaultValue !== undefined) onCommit(path, defaultValue);
          }}
          onUnset={() => onUnset(path)}
          profileActions={profileActions}
        />
      </div>
      {field.control?.kind === 'switch' ? (
        <label className="studio-switch-field">
          <input
            checked={effective === true}
            id={`studio-field-${path.join('-')}`}
            onChange={(event) => commit(event.target.checked)}
            type="checkbox"
          />
          <span>{effective === true ? 'On' : 'Off'}</span>
        </label>
      ) : field.control?.kind === 'select' || field.control?.kind === 'asset' ? (
        <select
          aria-label={field.label}
          id={`studio-field-${path.join('-')}`}
          onChange={(event) => {
            setDraft(event.target.value);
            commit(event.target.value);
          }}
          value={draft}
        >
          {!draft ? <option value="">Not set</option> : null}
          {selectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <div className={`studio-generated-input${field.valueType === 'color' ? ' studio-generated-input--color' : ''}`}>
          {field.valueType === 'color' && /^#[0-9a-f]{6}$/i.test(draft) ? (
            <input
              aria-label={`${field.label} color picker`}
              onChange={(event) => {
                setDraft(event.target.value);
                commit(event.target.value);
              }}
              type="color"
              value={draft}
            />
          ) : null}
          <input
            aria-describedby={`studio-field-description-${path.join('-')}`}
            aria-invalid={Boolean(error)}
            id={`studio-field-${path.join('-')}`}
            inputMode={field.valueType === 'integer' || field.valueType === 'number' ? 'decimal' : undefined}
            min={field.control?.minimum}
            max={field.control?.maximum}
            onBlur={() => commit()}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={inputKeyDown}
            step={field.control?.step}
            type={field.valueType === 'integer' || field.valueType === 'number' ? 'number' : 'text'}
            value={draft}
          />
        </div>
      )}
      <span className="studio-field-description" id={`studio-field-description-${path.join('-')}`}>{field.description}</span>
      {error ? <span className="studio-field-error" role="alert">{error}</span> : null}
      {provenance ? <ProvenanceDetails provenance={provenance} sourceRange={sourceRange} /> : null}
    </div>
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
    <section className="studio-field-group">
      <h3>Position</h3>
      <div className="studio-field-row">
        {['X', 'Y'].map((label, index) => (
          <label className="studio-field" key={label}>
            <span>{label}</span>
            <input
              aria-label={`Position ${label}`}
              key={`${label}-${String(position[index] ?? 0)}`}
              defaultValue={String(position[index] ?? 0)}
              onBlur={(event) => onCommit([...objectPath, 'position', index], Number(event.target.value), objectPath)}
              type="number"
            />
          </label>
        ))}
      </div>
    </section>
  );
}

export function Inspector({
  onCommit,
  onCommitStyle,
  onOpenSource,
  onReorderFieldProfile,
  onResetProfile,
  onUnsetStyle,
  onUpdateFieldProfile,
  profile,
  sourceRange,
  state,
  snapshot
}: InspectorProps) {
  const renderCount = useRef(0);
  renderCount.current += 1;
  const [view, setView] = useState<InspectorView>('basic');
  const [query, setQuery] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [editScopeKey, setEditScopeKey] = useState('object');
  const [newRuleSelector, setNewRuleSelector] = useState('');
  const [visibleFieldLimit, setVisibleFieldLimit] = useState(12);
  const selection = snapshot.selection[0];
  const object = useMemo(
    () => findAuthoringObject(snapshot.projection.document, selection as AuthoringObjectSelection | undefined),
    [selection, snapshot.projection.document]
  );
  const objectPath = selection
    ? authoringObjectSourcePath(snapshot.projection.document, selection as AuthoringObjectSelection)
    : undefined;
  const target = targetForSelection(selection?.kind);
  const style = record(object?.style);
  const position = Array.isArray(object?.position) ? object.position : undefined;
  const assetOptions = Object.keys(snapshot.projection.document.icons || {}).sort();
  const allFields = target ? styleAuthoringMetadataByTarget[target] : [];
  const provenance = target && object
    ? resolveStyleProvenance(target, object as Parameters<typeof resolveStyleProvenance>[1], snapshot.projection.document, {
        inlineSourcePath: objectPath
      })
    : [];
  const provenanceByKey = new Map(provenance.map((field) => [field.key, field]));
  const matchingRuleScopes = [...new Map(provenance.flatMap((field) => field.contributors.flatMap((contributor) => {
    const ruleIndex = contributor.kind === 'rule' ? Number(contributor.path?.[1]) : Number.NaN;
    return Number.isInteger(ruleIndex) && contributor.selector
      ? [[ruleIndex, { ruleIndex, selector: contributor.selector }]] as const
      : [];
  }))).values()].sort((left, right) => left.ruleIndex - right.ruleIndex);
  const selectedRuleIndex = editScopeKey.startsWith('rule:') ? Number(editScopeKey.slice(5)) : undefined;
  const selectedRule = selectedRuleIndex === undefined
    ? undefined
    : snapshot.projection.document.stylesheet?.[selectedRuleIndex];
  const editScope: StudioStyleEditScope = editScopeKey === 'new'
    ? { kind: 'new-rule', selector: newRuleSelector.trim() }
    : selectedRule && selectedRuleIndex !== undefined
      ? { kind: 'rule', ruleIndex: selectedRuleIndex, selector: selectedRule.selector }
      : { kind: 'object' };
  const scopeStyle = editScope.kind === 'rule' ? record(selectedRule?.style) : editScope.kind === 'object' ? style : {};
  const affectedObjects = target && editScope.kind !== 'object'
    ? styleRuleAffectedObjects(snapshot.projection.document, target, editScope.selector)
    : selection && target
      ? [{ id: selection.id, target }]
      : [];
  const resolvedProfile = target ? resolveStudioFieldProfile(allFields, target, profile) : [];
  const profileByPath = new Map(resolvedProfile.map((field) => [field.path, field]));
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredFields = allFields.filter((field) => {
    const fieldProfile = profileByPath.get(field.path);
    if (fieldProfile?.hidden && !showHidden) return false;
    if (!authoringFieldIsVisible(field, style)) return false;
    if (view === 'basic' && (fieldProfile?.level || field.level) !== 'basic') return false;
    if (view === 'advanced' && (fieldProfile?.level || field.level) !== 'advanced') return false;
    if (view === 'modified' && scopeStyle[field.path] === undefined) return false;
    return !normalizedQuery || [field.path, field.label, field.description, field.group, ...(field.aliases || [])]
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
  }).sort((left, right) => (
    (profileByPath.get(left.path)?.order ?? left.order) - (profileByPath.get(right.path)?.order ?? right.order)
    || left.path.localeCompare(right.path)
  ));
  const displayedFields = view === 'all' && !normalizedQuery
    ? filteredFields.slice(0, visibleFieldLimit)
    : filteredFields;
  const groups = displayedFields.reduce<Map<string, AuthoringFieldMetadata[]>>((result, field) => {
    const current = result.get(field.group) || [];
    current.push(field);
    result.set(field.group, current);
    return result;
  }, new Map());
  const knownKeys = new Set(allFields.map((field) => field.path));
  const unknownKeys = Object.keys(style).filter((key) => !knownKeys.has(key));
  const identityKey = selection?.kind === 'callout' ? 'title' : 'name';
  const identityLabel = identityKey === 'title' ? 'Title' : 'Name';
  const identityValue = String(object?.[identityKey] || '');

  useEffect(() => {
    setEditScopeKey('object');
    setNewRuleSelector(target || 'node');
  }, [selection?.id, target]);
  useEffect(() => setVisibleFieldLimit(12), [normalizedQuery, target, view]);

  function commitStyle(fieldPath: string[], value: unknown) {
    if (!objectPath || (editScope.kind === 'new-rule' && !editScope.selector)) return;
    const nextRuleIndex = snapshot.projection.document.stylesheet?.length || 0;
    if (onCommitStyle({ fieldPath, objectPath, scope: editScope, value }) && editScope.kind === 'new-rule') {
      setEditScopeKey(`rule:${nextRuleIndex}`);
    }
  }

  function unsetStyle(fieldPath: string[]) {
    if (!objectPath || editScope.kind === 'new-rule') return;
    onUnsetStyle({ fieldPath, objectPath, scope: editScope });
  }

  return (
    <aside className="studio-inspector" aria-label="Inspector" data-render-count={renderCount.current} data-state={state}>
      <div className="studio-panel-heading"><h2>Inspector</h2></div>
      {!selection || !object || !objectPath ? (
        <div className="studio-inspector-empty"><strong>Nothing selected</strong></div>
      ) : (
        <div className="studio-inspector-content">
          <section className="studio-field-group">
            <h3>Identity</h3>
            <label className="studio-field">
              <span>{identityLabel}</span>
              <input
                aria-label={identityLabel}
                key={identityValue}
                defaultValue={identityValue}
                onBlur={(event) => onCommit([...objectPath, identityKey], event.target.value, objectPath)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                  if (event.key === 'Escape') {
                    event.currentTarget.value = identityValue;
                    event.currentTarget.blur();
                  }
                }}
              />
            </label>
            <label className="studio-field">
              <span>ID</span>
              <input aria-label="ID" readOnly value={selection.id} />
            </label>
          </section>
          {position ? <PositionEditor objectPath={objectPath} onCommit={onCommit} position={position} /> : null}
          {target ? (
            <section className="studio-style-inspector" aria-label={`${target} style fields`}>
              <section className="studio-edit-scope" aria-label="Style edit scope">
                <label>Edit scope
                  <select aria-label="Edit scope" onChange={(event) => setEditScopeKey(event.target.value)} value={editScopeKey}>
                    <option value="object">Selected object override</option>
                    {matchingRuleScopes.map((rule) => (
                      <option key={rule.ruleIndex} value={`rule:${rule.ruleIndex}`}>Rule: {rule.selector}</option>
                    ))}
                    <option value="new">New reusable rule</option>
                  </select>
                </label>
                {editScope.kind === 'new-rule' ? (
                  <label>Selector
                    <input aria-label="New rule selector" onChange={(event) => setNewRuleSelector(event.target.value)} value={newRuleSelector} />
                  </label>
                ) : null}
                <div className="studio-scope-impact" aria-live="polite">
                  <strong>{affectedObjects.length} affected object{affectedObjects.length === 1 ? '' : 's'}</strong>
                  <span>{affectedObjects.map((affected) => affected.id).join(', ') || 'No current matches'}</span>
                </div>
              </section>
              <div className="studio-inspector-view-tabs" role="tablist" aria-label="Style field view">
                {inspectorViews.map((item) => (
                  <button
                    aria-selected={view === item.id}
                    key={item.id}
                    onClick={() => setView(item.id)}
                    role="tab"
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <label className="studio-inspector-search">
                <SearchIcon fontSize="small" />
                <input aria-label="Search style fields" onChange={(event) => setQuery(event.target.value)} placeholder="Search fields" type="search" value={query} />
              </label>
              <div className="studio-inspector-profile-actions">
                <label><input checked={showHidden} onChange={(event) => setShowHidden(event.target.checked)} type="checkbox" />Show hidden</label>
                <button aria-label="Reset field profile" onClick={onResetProfile} title="Reset field profile" type="button"><RestartAltIcon fontSize="small" /></button>
              </div>
              <div className="studio-generated-fields" data-field-count={filteredFields.length} data-rendered-field-count={displayedFields.length}>
                {[...groups.entries()].map(([group, fields]) => (
                  <section className="studio-field-group" key={group}>
                    <div className="studio-field-group-heading"><h3>{group}</h3><span>{fields.length}</span></div>
                    {fields.map((field) => (
                      <StyleFieldEditor
                        assetOptions={assetOptions}
                        explicit={scopeStyle[field.path] !== undefined}
                        field={field}
                        key={field.path}
                        onCommit={commitStyle}
                        onUnset={unsetStyle}
                        profileActions={target ? {
                          hidden: profileByPath.get(field.path)?.hidden || false,
                          level: profileByPath.get(field.path)?.level || field.level,
                          onHide: (hidden) => onUpdateFieldProfile(target, field.path, { hidden }),
                          onReorder: (direction) => onReorderFieldProfile(target, field.path, direction),
                          onToggleLevel: () => onUpdateFieldProfile(target, field.path, {
                            level: fieldLevelAfterToggle(profileByPath.get(field.path)?.level || field.level)
                          })
                        } : undefined}
                        provenance={provenanceByKey.get(field.path)}
                        sourceRange={sourceRange}
                        value={scopeStyle[field.path] ?? provenanceByKey.get(field.path)?.effectiveValue}
                      />
                    ))}
                  </section>
                ))}
                {!filteredFields.length ? <div className="studio-inspector-empty"><span>No matching fields</span></div> : null}
                {displayedFields.length < filteredFields.length ? (
                  <button className="studio-show-more-fields" onClick={() => setVisibleFieldLimit((current) => current + 24)} type="button">
                    Show more fields ({displayedFields.length} of {filteredFields.length})
                  </button>
                ) : null}
              </div>
              {unknownKeys.length ? (
                <section className="studio-unsupported-fields">
                  <h3>Unsupported fields</h3>
                  {unknownKeys.map((key) => (
                    <button
                      aria-label={`Open ${key} in YAML`}
                      key={key}
                      onClick={() => onOpenSource('topology', [...objectPath, 'style', key])}
                      title="Open in topology YAML"
                      type="button"
                    >
                      <code>{key}</code>
                    </button>
                  ))}
                  <span>Preserved in YAML. Edit these fields in the source workspace.</span>
                </section>
              ) : null}
            </section>
          ) : null}
        </div>
      )}
    </aside>
  );
}
