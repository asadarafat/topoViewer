import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  authoringFieldDefaultValue,
  authoringFieldIsVisible,
  authoringObjectSourcePath,
  coerceAuthoringFieldValue,
  findAuthoringObject,
  resolveStyleProvenance,
  styleRulesForTarget,
  styleRuleAffectedObjects,
  styleAuthoringMetadataByTarget,
  styleSelectorSuggestions,
  type AuthoringFieldMetadata,
  type AuthoringNestedFieldMetadata,
  type AuthoringObjectSelection,
  type StyleFieldProvenance
} from 'topoviewer/authoring';
import type { CreateAuthoringPathOptions, MapperAuthoringTargetKind } from 'topoviewer/authoring';
import type { StyleTargetKind } from 'topoviewer';
import type { StudioAuthoringProfileOverride, StudioFieldPreference } from '../../contracts/profiles';
import type { StudioDocumentKind, StudioSessionSnapshot } from '../../contracts/project';
import type {
  StudioSourceRangeLookup,
  StudioStyleEditRequest,
  StudioStyleEditScope,
  StudioStyleUnsetRequest
} from '../../contracts/inspector';
import type { StudioViewportPreferences } from '../viewport/types';
import {
  fieldLevelAfterToggle,
  resolveStudioFieldProfile
} from './profile';
import { StudioColorField } from '../../ui/StudioColorField';
import {
  StudioButton,
  StudioCheckbox,
  StudioAccordion,
  StudioAccordionDetails,
  StudioAccordionSummary,
  StudioIconButton,
  StudioLabeledControl,
  StudioSearchField,
  StudioSelect,
  StudioSwitch,
  StudioTab,
  StudioTabs,
  StudioTextField
} from '../../ui/controls';
import { MapperContextPanel } from './MapperContextPanel';
import { StyleAttributeMatrix, type StudioStyleMatrixSource } from './StyleAttributeMatrix';
import { StyleSelectorControl, StyleTargetControl } from './StyleScopeControl';
import { ViewportProperties } from './ViewportProperties';

export type InspectorDocumentView = 'object' | 'style' | 'mapper' | 'viewport';

interface InspectorProps {
  ariaLabel?: string;
  documentView?: InspectorDocumentView;
  onCommit(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void;
  onCommitViewport(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void;
  onCommitStyle(request: StudioStyleEditRequest): boolean;
  onCreateStyleRule(selector: string, insertAt?: number): boolean;
  onDeleteStyleRule(index: number): boolean;
  onDuplicateStyleRule(index: number): boolean;
  onMoveStyleRule(index: number, direction: -1 | 1): boolean;
  onOpenMapper(): void;
  onOpenSource(document: StudioDocumentKind, path: Array<string | number>): void;
  onReorderFieldProfile(target: StyleTargetKind, path: string, direction: -1 | 1): void;
  onResetProfile(): void;
  onRenameStyleRule(index: number, selector: string): boolean;
  onUnsetStyle(request: StudioStyleUnsetRequest): boolean;
  onUpdateFieldProfile(
    target: StyleTargetKind,
    path: string,
    patch: Partial<Pick<StudioFieldPreference, 'hidden' | 'level' | 'order'>>
  ): void;
  onViewportPreferencesChange(patch: Partial<StudioViewportPreferences>): void;
  pathMode: NonNullable<CreateAuthoringPathOptions['mode']>;
  profile: StudioAuthoringProfileOverride;
  sourceRange: StudioSourceRangeLookup;
  state: 'default' | 'open' | 'closed';
  snapshot: StudioSessionSnapshot;
  setPathMode(mode: NonNullable<CreateAuthoringPathOptions['mode']>): void;
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
  const [open, setOpen] = useState(false);
  const menuId = `studio-field-actions-${useId().replaceAll(':', '')}`;
  return (
    <div
      className="studio-field-actions"
      data-open={open}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (!open) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          setOpen(false);
          event.currentTarget.querySelector<HTMLButtonElement>(':scope > button')?.focus();
          return;
        }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')];
        if (!items.length) return;
        event.preventDefault();
        const current = items.indexOf(event.target as HTMLButtonElement);
        const next = event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : current < 0
              ? event.key === 'ArrowDown' ? 0 : items.length - 1
              : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[next].focus();
      }}
    >
      <StudioIconButton aria-controls={open ? menuId : undefined} aria-expanded={open} aria-haspopup="menu" aria-label={`${field.label} actions`} onClick={() => setOpen((value) => !value)} title={`${field.label} actions`}><MoreVertIcon fontSize="inherit" /></StudioIconButton>
      {open ? <div className="studio-field-action-menu" id={menuId} role="menu">
        <StudioButton disabled={defaultValue === undefined} onClick={() => { onDefault(); setOpen(false); }} role="menuitem">Write default</StudioButton>
        <StudioButton disabled={!explicit} onClick={() => { onUnset(); setOpen(false); }} role="menuitem">Unset value</StudioButton>
        {profileActions ? (
          <>
            <StudioButton onClick={() => { profileActions.onToggleLevel(); setOpen(false); }} role="menuitem">
              {profileActions.level === 'basic' ? 'Move to View More' : 'Show in main list'}
            </StudioButton>
            <StudioButton onClick={() => { profileActions.onReorder(-1); setOpen(false); }} role="menuitem">Move earlier</StudioButton>
            <StudioButton onClick={() => { profileActions.onReorder(1); setOpen(false); }} role="menuitem">Move later</StudioButton>
            <StudioButton onClick={() => { profileActions.onHide(!profileActions.hidden); setOpen(false); }} role="menuitem">
              {profileActions.hidden ? 'Restore field' : 'Hide field'}
            </StudioButton>
          </>
        ) : null}
      </div> : null}
    </div>
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
    <StudioAccordion className="studio-style-provenance">
      <StudioAccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>{winnerLabel}</StudioAccordionSummary>
      <StudioAccordionDetails><ol>
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
      </ol></StudioAccordionDetails>
    </StudioAccordion>
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
  const generatedId = useId();
  const fieldId = `studio-field-${generatedId.replaceAll(':', '')}`;
  const descriptionId = `studio-field-description-${path.join('-')}`;
  const errorId = `studio-field-error-${path.join('-')}`;

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
                onCommit={(nestedPath, next) => {
                  const nextValue = nestedValueWithRequiredDefaults(field, nestedRecord);
                  setNestedValue(nextValue, nestedPath, next);
                  onCommit(path, nextValue);
                }}
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
        <label htmlFor={fieldId}>{field.label}</label>
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
        <StudioLabeledControl
          className="studio-switch-field"
          control={<StudioSwitch checked={effective === true} id={fieldId} onChange={(event) => commit(event.target.checked)} />}
          label={effective === true ? 'On' : 'Off'}
        />
      ) : field.control?.kind === 'select' || field.control?.kind === 'asset' ? (
        <StudioSelect
          aria-describedby={descriptionId}
          aria-label={field.label}
          id={fieldId}
          onChange={(event) => {
            setDraft(event.target.value);
            commit(event.target.value);
          }}
          value={draft}
        >
          {!draft ? <option value="">Not set</option> : null}
          {selectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </StudioSelect>
      ) : field.valueType === 'color' ? (
        <StudioColorField
          ariaDescribedBy={descriptionId}
          error={error}
          id={fieldId}
          label={field.label}
          onChange={setDraft}
          onCommit={(next) => commit(next ?? draft)}
          value={draft}
        />
      ) : (
        <div className="studio-generated-input">
          <StudioTextField
            aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ''}`}
            aria-errormessage={error ? errorId : undefined}
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
        </div>
      )}
      <span className="studio-field-description" id={descriptionId}>{field.description}</span>
      {error ? <span className="studio-field-error" id={errorId} role="alert">{error}</span> : null}
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
          <div className="studio-field" key={label}>
            <span>{label}</span>
            <StudioTextField
              aria-label={`Position ${label}`}
              key={`${label}-${String(position[index] ?? 0)}`}
              defaultValue={String(position[index] ?? 0)}
              onBlur={(event) => onCommit([...objectPath, 'position', index], Number(event.target.value), objectPath)}
              type="number"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function Inspector({
  ariaLabel = 'Properties',
  documentView,
  onCommit,
  onCommitViewport,
  onCommitStyle,
  onCreateStyleRule,
  onDeleteStyleRule,
  onDuplicateStyleRule,
  onMoveStyleRule,
  onOpenMapper,
  onOpenSource,
  onReorderFieldProfile,
  onResetProfile,
  onRenameStyleRule,
  onUnsetStyle,
  onUpdateFieldProfile,
  onViewportPreferencesChange,
  pathMode,
  profile,
  setPathMode,
  showDocumentTabs = true,
  sourceRange,
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
  const [selectedRuleIndex, setSelectedRuleIndex] = useState<number>();
  const [creatingStyleRule, setCreatingStyleRule] = useState(false);
  const [styleSource, setStyleSource] = useState<StudioStyleMatrixSource>('default');
  const [selectedStyleFieldPath, setSelectedStyleFieldPath] = useState<string>();
  const selection = snapshot.selection[0];
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
  const selectedTarget = targetForSelection(selection?.kind);
  const activeStyleTarget = styleTarget;
  const mapperTarget = mapperTargetForSelection(selection?.kind);
  const activeDocumentView = documentView ?? internalDocumentView;
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
  const targetRules = useMemo(
    () => styleRulesForTarget(snapshot.projection.document, activeStyleTarget),
    [activeStyleTarget, snapshot.projection.document]
  );
  const defaultRule = targetRules.find((entry) => entry.rule.selector.trim() === activeStyleTarget);
  const selectorRules = targetRules.filter((entry) => entry.rule.selector.trim() !== activeStyleTarget);
  const ruleMatches = useMemo(
    () => new Map(targetRules.map((entry) => [
      entry.index,
      styleRuleAffectedObjects(snapshot.projection.document, activeStyleTarget, entry.rule.selector)
    ])),
    [activeStyleTarget, snapshot.projection.document, targetRules]
  );
  const matchingRules = selection
    ? selectorRules.filter((entry) => ruleMatches.get(entry.index)?.some((match) => match.id === selection.id))
    : [];
  const activeRule = selectorRules.find((entry) => entry.index === selectedRuleIndex)
    || matchingRules.at(-1)
    || selectorRules[0];
  const bypassEnabled = Boolean(objectPath && selectedTarget === activeStyleTarget);
  const defaultStyle = record(defaultRule?.rule.style);
  const selectorStyle = record(activeRule?.rule.style);
  const bypassStyle = bypassEnabled ? style : {};
  const editScope: StudioStyleEditScope | undefined = styleSource === 'default'
    ? defaultRule ? { kind: 'rule', ruleIndex: defaultRule.index, selector: defaultRule.rule.selector } : undefined
    : styleSource === 'selector'
      ? activeRule ? { kind: 'rule', ruleIndex: activeRule.index, selector: activeRule.rule.selector } : undefined
      : bypassEnabled ? { kind: 'object' } : undefined;
  const scopeStyle = styleSource === 'default' ? defaultStyle : styleSource === 'selector' ? selectorStyle : bypassStyle;
  const affectedObjects = activeRule ? ruleMatches.get(activeRule.index) || [] : [];
  const effectiveStyle = Object.fromEntries(provenance.map((field) => [field.key, field.effectiveValue]));
  const fieldVisibilityLayers = [effectiveStyle, defaultStyle, selectorStyle, bypassStyle];
  const selectorSuggestions = useMemo(
    () => styleSelectorSuggestions(
      activeStyleTarget,
      selectedTarget === activeStyleTarget
        ? object as Parameters<typeof styleSelectorSuggestions>[1]
        : undefined
    ),
    [activeStyleTarget, object, selectedTarget]
  );
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
  const unknownKeys = Object.keys(scopeStyle).filter((key) => !knownKeys.has(key));
  const identityKey = selection?.kind === 'callout' ? 'title' : selection?.kind === 'text' ? 'text' : 'name';
  const identityLabel = identityKey === 'title' ? 'Title' : identityKey === 'text' ? 'Text' : 'Name';
  const identityValue = String(object?.[identityKey] || '');

  useEffect(() => {
    if (selectedTarget) setStyleTarget(selectedTarget);
    setSelectedRuleIndex(undefined);
    setCreatingStyleRule(false);
    setStyleSource('default');
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
    if (!editScope || editScope.kind === 'new-rule') return;
    onUnsetStyle({ fieldPath, objectPath, scope: editScope });
  }

  function openUnsupportedStyleField(key: string) {
    if (editScope?.kind === 'rule') {
      onOpenSource('stylesheet', ['stylesheet', editScope.ruleIndex, 'style', key]);
      return;
    }
    if (objectPath) onOpenSource('topology', [...objectPath, 'style', key]);
  }

  function activateStyleField(field: AuthoringFieldMetadata, source: StudioStyleMatrixSource) {
    if (source === 'bypass' && !bypassEnabled) return;
    if (source === 'default' && !defaultRule) {
      if (!onCreateStyleRule(activeStyleTarget, targetRules[0]?.index)) return;
    }
    setCreatingStyleRule(false);
    setStyleSource(source);
    setSelectedStyleFieldPath(field.path);
  }

  function styleEditorValue(field: AuthoringFieldMetadata) {
    if (scopeStyle[field.path] !== undefined) return scopeStyle[field.path];
    if (styleSource === 'selector' && defaultStyle[field.path] !== undefined) return defaultStyle[field.path];
    return provenanceByKey.get(field.path)?.effectiveValue ?? authoringFieldDefaultValue(field);
  }

  function styleEditorOwner() {
    if (styleSource === 'default') return `Default · ${activeStyleTarget}`;
    if (styleSource === 'selector') return `Selector · ${activeRule?.rule.selector || 'none'}`;
    return `Bypass · ${selection?.id || 'no selection'}`;
  }

  return (
    <aside className={`studio-inspector${showDocumentTabs ? '' : ' studio-inspector--single-view'}`} aria-label={ariaLabel} data-render-count={renderCount.current} data-state={state}>
      <h2 className="studio-visually-hidden">{ariaLabel}</h2>
      <div className="studio-inspector-content">
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
            pathMode={pathMode}
            preferences={viewportPreferences}
            setPathMode={setPathMode}
            snapshot={snapshot}
          />
        ) : null}
        {activeDocumentView === 'object' && selection && object && objectPath ? (
            <div
              aria-label="Object fields"
              className="studio-inspector-document-panel"
              id="studio-inspector-object-panel"
              role="tabpanel"
            >
              <div className="studio-document-owner">
                <strong>topology.yaml</strong>
                <span>Object identity and geometry</span>
              </div>
              <section className="studio-field-group">
                <h3>Identity</h3>
                <div className="studio-field">
                  <span>{identityLabel}</span>
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
                </div>
                <div className="studio-field">
                  <span>ID</span>
                  <StudioTextField aria-label="ID" slotProps={{ input: { readOnly: true } }} value={selection.id} />
                </div>
              </section>
              {position ? <PositionEditor objectPath={objectPath} onCommit={onCommit} position={position} /> : null}
            </div>
          ) : null}
        {activeDocumentView === 'object' && (!selection || !object || !objectPath) ? (
          <div className="studio-inspector-empty studio-inspector-document-panel" id="studio-inspector-object-panel" role="tabpanel">
            <span>Select an object on the canvas.</span>
          </div>
        ) : null}
        {activeDocumentView === 'mapper' && mapperTarget ? (
          <MapperContextPanel onOpenMapper={onOpenMapper} snapshot={snapshot} target={mapperTarget} />
        ) : null}
        {activeDocumentView === 'mapper' && !mapperTarget ? (
          <div className="studio-inspector-empty studio-inspector-document-panel" id="studio-inspector-mapper-panel" role="tabpanel">
            <span>Select a topology object to inspect telemetry mapping.</span>
          </div>
        ) : null}
          {activeDocumentView === 'style' ? (
            <section
              aria-label={`${activeStyleTarget} style fields`}
              className="studio-style-inspector studio-inspector-document-panel"
              id="studio-inspector-style-panel"
              role="tabpanel"
            >
              <StyleTargetControl
                onChange={(target) => {
                  setStyleTarget(target);
                  setSelectedRuleIndex(undefined);
                  setCreatingStyleRule(false);
                  setStyleSource('default');
                  setSelectedStyleFieldPath(undefined);
                }}
                target={activeStyleTarget}
              />
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
              <div
                className="studio-generated-fields"
                data-additional-field-count={additionalFields.length}
                data-field-count={matchingFields.length}
                data-main-field-count={mainFields.length}
                data-rendered-field-count={displayedFields.length}
              >
                <StyleAttributeMatrix
                  activeFieldPath={selectedStyleFieldPath}
                  activeSource={styleSource}
                  bypassEnabled={bypassEnabled}
                  bypassStyle={bypassStyle}
                  defaultStyle={defaultStyle}
                  fieldsByGroup={groups}
                  onActivate={activateStyleField}
                  renderEditor={(field, source) => (
                    <div className="studio-style-matrix-editor">
                      <div className="studio-style-matrix-editor-owner">
                        <strong>{styleEditorOwner()}</strong>
                        <span>{editScope?.kind === 'object' ? 'topology.yaml' : 'stylesheet.yaml'}</span>
                      </div>
                      {source === 'selector' ? (
                        <StyleSelectorControl
                          activeRule={activeRule}
                          allRuleCount={snapshot.projection.document.stylesheet?.length || 0}
                          creatingRule={creatingStyleRule}
                          matchIds={affectedObjects.map((affected) => affected.id)}
                          onCancelCreate={() => setCreatingStyleRule(false)}
                          onCreateRule={(selector) => {
                            const nextRuleIndex = snapshot.projection.document.stylesheet?.length || 0;
                            if (!onCreateStyleRule(selector)) return;
                            setSelectedRuleIndex(nextRuleIndex);
                            setCreatingStyleRule(false);
                            setStyleSource('selector');
                          }}
                          onDeleteRule={(index) => {
                            if (!onDeleteStyleRule(index)) return;
                            setSelectedRuleIndex(undefined);
                          }}
                          onDuplicateRule={(index) => {
                            const nextRuleIndex = snapshot.projection.document.stylesheet?.length || 0;
                            if (onDuplicateStyleRule(index)) setSelectedRuleIndex(nextRuleIndex);
                          }}
                          onMoveRule={(index, direction) => {
                            if (onMoveStyleRule(index, direction)) setSelectedRuleIndex(index + direction);
                          }}
                          onRenameRule={onRenameStyleRule}
                          onSelectRule={(index) => {
                            setSelectedRuleIndex(index);
                            setCreatingStyleRule(false);
                          }}
                          onStartCreate={() => setCreatingStyleRule(true)}
                          selectorRules={selectorRules}
                          suggestions={selectorSuggestions}
                          target={activeStyleTarget}
                        />
                      ) : null}
                      {source !== 'selector' || activeRule ? (
                        <StyleFieldEditor
                          assetOptions={assetOptions}
                          explicit={scopeStyle[field.path] !== undefined}
                          field={field}
                          onCommit={commitStyle}
                          onUnset={unsetStyle}
                          profileActions={{
                            hidden: profileByPath.get(field.path)?.hidden || false,
                            level: profileByPath.get(field.path)?.level || field.level,
                            onHide: (hidden) => onUpdateFieldProfile(activeStyleTarget, field.path, { hidden }),
                            onReorder: (direction) => onReorderFieldProfile(activeStyleTarget, field.path, direction),
                            onToggleLevel: () => onUpdateFieldProfile(activeStyleTarget, field.path, {
                              level: fieldLevelAfterToggle(profileByPath.get(field.path)?.level || field.level)
                            })
                          }}
                          provenance={provenanceByKey.get(field.path)}
                          sourceRange={sourceRange}
                          value={styleEditorValue(field)}
                        />
                      ) : <p className="studio-style-selector-empty">Choose or create a selector to author this value.</p>}
                    </div>
                  )}
                  selectorEnabled
                  selectorStyle={selectorStyle}
                />
                {!matchingFields.length ? <div className="studio-inspector-empty"><span>No matching fields</span></div> : null}
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
              </div>
              {unknownKeys.length ? (
                <section className="studio-unsupported-fields">
                  <h3>Unsupported fields</h3>
                  {unknownKeys.map((key) => (
                    <StudioButton
                      aria-label={`Open ${key} in YAML`}
                      key={key}
                      onClick={() => openUnsupportedStyleField(key)}
                      title={`Open in ${editScope?.kind === 'rule' ? 'stylesheet' : 'topology'} YAML`}
                      type="button"
                    >
                      <code>{key}</code>
                    </StudioButton>
                  ))}
                  <span>Preserved in YAML. Edit these fields in the source workspace.</span>
                </section>
              ) : null}
            </section>
          ) : null}
      </div>
    </aside>
  );
}
