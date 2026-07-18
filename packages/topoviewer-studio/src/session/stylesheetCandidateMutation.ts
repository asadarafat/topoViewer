import { planAuthoringStylesheetDeletionCleanup, styleExactIdSelector, type AuthoringObjectSelection } from 'topoviewer/authoring';
import type { StylesheetDocument, StyleTargetKind } from 'topoviewer';
import { isSeq } from 'yaml';
import type { StudioDiagnostic } from '../contracts/project';
import type { ParsedStudioSource, StudioYamlPath } from './types';
import { insertSequenceValue, normalizedStructuralEdit, parseStudioSource, removeScopedValue, surgicalScalarEdit, surgicalRemoveMappingValue, surgicalRemoveSequenceValue, surgicalRemoveSequenceValues, upsertScopedValue } from './yamlSource';

export interface StudioStylesheetTarget {
  id: string;
  kind: StyleTargetKind;
}

export interface StudioCandidateStyleField {
  exists: boolean;
  path?: StudioYamlPath;
  selector: string;
  value?: unknown;
}

export interface StudioCandidateStyleRule {
  path: StudioYamlPath;
  selector: string;
}

export type StudioCandidateMutationResult =
  | { status: 'applied'; text: string; updatedSelectors: string[] }
  | { status: 'unchanged'; text: string; updatedSelectors: string[] }
  | { diagnostics: StudioDiagnostic[]; status: 'invalid' }
  | {
      after: string;
      before: string;
      reason: string;
      status: 'normalization-required';
    };

function nestedValue(path: StudioYamlPath, value: unknown): Record<string, unknown> {
  return path.reduceRight<Record<string, unknown>>(
    (current, segment) => ({
      [String(segment)]: Object.keys(current).length === 0 ? value : current
    }),
    {}
  );
}

function recordWithoutPath(root: Record<string, unknown>, path: StudioYamlPath): Record<string, unknown> {
  if (path.length === 0) return {};
  const [segment, ...rest] = path;
  if (typeof segment !== 'string') return { ...root };
  const next = { ...root };
  if (rest.length === 0) {
    delete next[segment];
    return next;
  }
  const child = record(next[segment]);
  if (!child) return next;
  const updated = recordWithoutPath(child, rest);
  if (Object.keys(updated).length === 0) delete next[segment];
  else next[segment] = updated;
  return next;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function valueAt(root: unknown, path: StudioYamlPath): unknown {
  return path.reduce<unknown>((value, segment) => {
    if (typeof segment === 'number') return Array.isArray(value) ? value[segment] : undefined;
    return record(value)?.[segment];
  }, root);
}

function selectorExactId(selector: unknown): { id: string; kind: StyleTargetKind } | undefined {
  if (typeof selector !== 'string') return undefined;
  const match = selector.trim().match(/^([a-zA-Z][\w-]*)\[\s*id\s*=\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^\]]+?))\s*\]$/);
  if (!match) return undefined;
  const kind = match[1] as StyleTargetKind;
  if (!['node', 'link', 'linkDirection', 'path', 'region', 'shape', 'callout', 'text'].includes(kind)) {
    return undefined;
  }
  let id = match[2] ?? match[3] ?? match[4] ?? '';
  if (match[2] !== undefined) {
    try {
      id = JSON.parse(`"${match[2]}"`) as string;
    } catch {
      return undefined;
    }
  } else if (match[3] !== undefined) {
    id = match[3].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  } else {
    id = id.trim();
  }
  return { id, kind };
}

function exactRuleIndices(source: ParsedStudioSource, target: StudioStylesheetTarget): number[] {
  const rules = source.value.stylesheet;
  if (!Array.isArray(rules)) return [];
  return rules.flatMap((value, index) => {
    const exact = selectorExactId(record(value)?.selector);
    return exact?.kind === target.kind && exact.id === target.id ? [index] : [];
  });
}

function selectorRuleIndices(source: ParsedStudioSource, selector: string): number[] {
  const rules = source.value.stylesheet;
  if (!Array.isArray(rules)) return [];
  const normalized = selector.trim();
  return rules.flatMap((value, index) => (String(record(value)?.selector || '').trim() === normalized ? [index] : []));
}

export function candidateStyleField(stylesheetText: string, target: StudioStylesheetTarget, fieldPath: StudioYamlPath): StudioCandidateStyleField {
  const selector = styleExactIdSelector(target.kind, target.id);
  const parsed = parseStylesheet(stylesheetText);
  if (!parsed.ok) return { exists: false, selector };
  const index = exactRuleIndices(parsed.source, target).at(-1);
  if (index === undefined) return { exists: false, selector };
  const path: StudioYamlPath = ['stylesheet', index, 'style', ...fieldPath];
  const value = valueAt(parsed.source.value, path);
  return value === undefined ? { exists: false, path, selector } : { exists: true, path, selector, value };
}

export function candidateStyleRule(stylesheetText: string, target: StudioStylesheetTarget): StudioCandidateStyleRule | undefined {
  const parsed = parseStylesheet(stylesheetText);
  if (!parsed.ok) return undefined;
  const index = exactRuleIndices(parsed.source, target).at(-1);
  return index === undefined
    ? undefined
    : {
        path: ['stylesheet', index],
        selector: styleExactIdSelector(target.kind, target.id)
      };
}

export function candidateStyleFieldForSelector(stylesheetText: string, selector: string, fieldPath: StudioYamlPath): StudioCandidateStyleField {
  const parsed = parseStylesheet(stylesheetText);
  if (!parsed.ok) return { exists: false, selector };
  const index = selectorRuleIndices(parsed.source, selector).at(-1);
  if (index === undefined) return { exists: false, selector };
  const path: StudioYamlPath = ['stylesheet', index, 'style', ...fieldPath];
  const value = valueAt(parsed.source.value, path);
  return value === undefined ? { exists: false, path, selector } : { exists: true, path, selector, value };
}

export function candidateStyleRuleForSelector(stylesheetText: string, selector: string): StudioCandidateStyleRule | undefined {
  const parsed = parseStylesheet(stylesheetText);
  if (!parsed.ok) return undefined;
  const index = selectorRuleIndices(parsed.source, selector).at(-1);
  return index === undefined ? undefined : { path: ['stylesheet', index], selector };
}

export function removeCandidateStyleRulesForDeletedObjects(
  stylesheetText: string,
  deletedSelections: AuthoringObjectSelection[]
): Exclude<StudioCandidateMutationResult, { status: 'normalization-required' }> {
  const parsed = parseStylesheet(stylesheetText);
  if (!parsed.ok) return { diagnostics: parsed.diagnostics, status: 'invalid' };
  const cleanup = planAuthoringStylesheetDeletionCleanup(
    parsed.source.value as StylesheetDocument,
    deletedSelections
  );
  if (cleanup.removals.length === 0) {
    return { status: 'unchanged', text: stylesheetText, updatedSelectors: [] };
  }
  const indices = cleanup.removals.map((removal) => Number(removal.path.at(-1)));
  const text = surgicalRemoveSequenceValues(parsed.source, ['stylesheet'], indices);
  if (text === undefined) {
    const document = parsed.source.document.clone();
    indices.sort((left, right) => right - left).forEach((index) => document.deleteIn(['stylesheet', index]));
    const normalized = String(document);
    return {
      status: 'applied',
      text: parsed.source.lineEnding === '\r\n' ? normalized.replace(/(?<!\r)\n/g, '\r\n') : normalized,
      updatedSelectors: cleanup.removals.map((removal) => `${removal.selection.kind}[id = ${JSON.stringify(removal.selection.id)}]`)
    };
  }
  return {
    status: 'applied',
    text,
    updatedSelectors: cleanup.removals.map((removal) => `${removal.selection.kind}[id = ${JSON.stringify(removal.selection.id)}]`)
  };
}

function parseStylesheet(text: string) {
  return parseStudioSource('stylesheet', text);
}

function invalidFieldPath(): StudioCandidateMutationResult {
  return {
    diagnostics: [
      {
        code: 'invalid-style-field-path',
        document: 'stylesheet',
        message: 'A candidate style field path must contain at least one property.',
        severity: 'error'
      }
    ],
    status: 'invalid'
  };
}

function normalizationForMissingSequence(source: ParsedStudioSource, target: StudioStylesheetTarget, fieldPath: StudioYamlPath, value: unknown): StudioCandidateMutationResult {
  const selector = styleExactIdSelector(target.kind, target.id);
  const rule = { selector, style: nestedValue(fieldPath, value) };
  return {
    after: normalizedStructuralEdit(source, ['stylesheet'], [rule]),
    before: source.text,
    reason: 'Creating the missing stylesheet sequence requires a reviewed document normalization.',
    status: 'normalization-required'
  };
}

function normalizationForMissingSelectorSequence(source: ParsedStudioSource, selector: string, fieldPath: StudioYamlPath, value: unknown): StudioCandidateMutationResult {
  const rule = { selector, style: nestedValue(fieldPath, value) };
  return {
    after: normalizedStructuralEdit(source, ['stylesheet'], [rule]),
    before: source.text,
    reason: 'Creating the missing stylesheet sequence requires a reviewed document normalization.',
    status: 'normalization-required'
  };
}

export function setCandidateStyleField(stylesheetText: string, target: StudioStylesheetTarget, fieldPath: StudioYamlPath, value: unknown): StudioCandidateMutationResult {
  if (fieldPath.length === 0) return invalidFieldPath();
  const parsed = parseStylesheet(stylesheetText);
  if (!parsed.ok) return { diagnostics: parsed.diagnostics, status: 'invalid' };
  const source = parsed.source;
  const selector = styleExactIdSelector(target.kind, target.id);
  const indices = exactRuleIndices(source, target);
  const index = indices.at(-1);

  if (index === undefined) {
    if (!isSeq(source.document.getIn(['stylesheet'], true))) {
      return normalizationForMissingSequence(source, target, fieldPath, value);
    }
    const text = insertSequenceValue(source, ['stylesheet'], {
      selector,
      style: nestedValue(fieldPath, value)
    });
    return text === undefined ? normalizationForMissingSequence(source, target, fieldPath, value) : { status: 'applied', text, updatedSelectors: [selector] };
  }

  const path: StudioYamlPath = ['stylesheet', index, 'style', ...fieldPath];
  const surgical = surgicalScalarEdit(source, path, value);
  if (surgical !== undefined) return { status: 'applied', text: surgical, updatedSelectors: [selector] };
  const text = upsertScopedValue(source, path, value, ['stylesheet', index]);
  if (text !== undefined) return { status: 'applied', text, updatedSelectors: [selector] };
  return {
    after: normalizedStructuralEdit(source, path, value),
    before: stylesheetText,
    reason: `Updating ${selector} requires a reviewed YAML normalization.`,
    status: 'normalization-required'
  };
}

export function replaceCandidateStyleRule(stylesheetText: string, target: StudioStylesheetTarget, style: Record<string, unknown>): StudioCandidateMutationResult {
  const parsed = parseStylesheet(stylesheetText);
  if (!parsed.ok) return { diagnostics: parsed.diagnostics, status: 'invalid' };
  const source = parsed.source;
  const selector = styleExactIdSelector(target.kind, target.id);
  const index = exactRuleIndices(source, target).at(-1);
  if (index === undefined) {
    const rule = { selector, style };
    if (!isSeq(source.document.getIn(['stylesheet'], true))) {
      return {
        after: normalizedStructuralEdit(source, ['stylesheet'], [rule]),
        before: source.text,
        reason: 'Creating the missing stylesheet sequence requires a reviewed document normalization.',
        status: 'normalization-required'
      };
    }
    const text = insertSequenceValue(source, ['stylesheet'], rule);
    return text === undefined
      ? {
          after: normalizedStructuralEdit(source, ['stylesheet'], [...((source.value.stylesheet as unknown[]) || []), rule]),
          before: source.text,
          reason: `Creating ${selector} requires a reviewed YAML normalization.`,
          status: 'normalization-required'
        }
      : { status: 'applied', text, updatedSelectors: [selector] };
  }

  const path: StudioYamlPath = ['stylesheet', index, 'style'];
  const text = upsertScopedValue(source, path, style, ['stylesheet', index]);
  return text === undefined
    ? {
        after: normalizedStructuralEdit(source, path, style),
        before: source.text,
        reason: `Replacing ${selector} requires a reviewed YAML normalization.`,
        status: 'normalization-required'
      }
    : { status: 'applied', text, updatedSelectors: [selector] };
}

export function setCandidateStyleFieldForTargets(stylesheetText: string, targets: StudioStylesheetTarget[], fieldPath: StudioYamlPath, value: unknown): StudioCandidateMutationResult {
  const unique = [...new Map(targets.map((target) => [`${target.kind}\u0000${target.id}`, target])).values()];
  if (unique.length === 0) return { status: 'unchanged', text: stylesheetText, updatedSelectors: [] };
  if (new Set(unique.map((target) => target.kind)).size !== 1) {
    return {
      diagnostics: [
        {
          code: 'mixed-style-target-kinds',
          document: 'stylesheet',
          message: 'Bulk Visual style edits require selected objects of one style target kind.',
          severity: 'error'
        }
      ],
      status: 'invalid'
    };
  }

  let text = stylesheetText;
  const updatedSelectors: string[] = [];
  for (const target of unique) {
    const result = setCandidateStyleField(text, target, fieldPath, value);
    if (result.status === 'invalid' || result.status === 'normalization-required') return result;
    text = result.text;
    updatedSelectors.push(...result.updatedSelectors);
  }
  return text === stylesheetText ? { status: 'unchanged', text, updatedSelectors } : { status: 'applied', text, updatedSelectors };
}

export function setCandidateStyleFieldForSelector(stylesheetText: string, selector: string, fieldPath: StudioYamlPath, value: unknown): StudioCandidateMutationResult {
  if (fieldPath.length === 0) return invalidFieldPath();
  const parsed = parseStylesheet(stylesheetText);
  if (!parsed.ok) return { diagnostics: parsed.diagnostics, status: 'invalid' };
  const source = parsed.source;
  const index = selectorRuleIndices(source, selector).at(-1);

  if (index === undefined) {
    if (!isSeq(source.document.getIn(['stylesheet'], true))) {
      return normalizationForMissingSelectorSequence(source, selector, fieldPath, value);
    }
    const text = insertSequenceValue(source, ['stylesheet'], {
      selector,
      style: nestedValue(fieldPath, value)
    });
    return text === undefined ? normalizationForMissingSelectorSequence(source, selector, fieldPath, value) : { status: 'applied', text, updatedSelectors: [selector] };
  }

  const path: StudioYamlPath = ['stylesheet', index, 'style', ...fieldPath];
  const surgical = surgicalScalarEdit(source, path, value);
  if (surgical !== undefined) return { status: 'applied', text: surgical, updatedSelectors: [selector] };
  const text = upsertScopedValue(source, path, value, ['stylesheet', index]);
  if (text !== undefined) return { status: 'applied', text, updatedSelectors: [selector] };
  return {
    after: normalizedStructuralEdit(source, path, value),
    before: stylesheetText,
    reason: `Updating ${selector} requires a reviewed YAML normalization.`,
    status: 'normalization-required'
  };
}

export function unsetCandidateStyleField(stylesheetText: string, target: StudioStylesheetTarget, fieldPath: StudioYamlPath): StudioCandidateMutationResult {
  if (fieldPath.length === 0) return invalidFieldPath();
  const parsed = parseStylesheet(stylesheetText);
  if (!parsed.ok) return { diagnostics: parsed.diagnostics, status: 'invalid' };
  const source = parsed.source;
  const selector = styleExactIdSelector(target.kind, target.id);
  const index = exactRuleIndices(source, target).at(-1);
  if (index === undefined) return { status: 'unchanged', text: stylesheetText, updatedSelectors: [] };
  const path: StudioYamlPath = ['stylesheet', index, 'style', ...fieldPath];
  if (source.document.getIn(path, true) === undefined) {
    return { status: 'unchanged', text: stylesheetText, updatedSelectors: [] };
  }
  const rule = record(valueAt(source.value, ['stylesheet', index]));
  const currentStyle = record(rule?.style);
  if (!currentStyle) return { status: 'unchanged', text: stylesheetText, updatedSelectors: [] };
  const nextStyle = recordWithoutPath(currentStyle, fieldPath);
  if (Object.keys(nextStyle).length === 0 && Object.keys(rule || {}).every((key) => key === 'selector' || key === 'style')) {
    const withoutRule = surgicalRemoveSequenceValue(source, ['stylesheet'], index) ?? removeScopedValue(source, ['stylesheet', index], ['stylesheet']);
    return withoutRule === undefined
      ? {
          after: normalizedStructuralEdit(
            source,
            ['stylesheet'],
            (source.value.stylesheet as unknown[]).filter((_, ruleIndex) => ruleIndex !== index)
          ),
          before: stylesheetText,
          reason: `Cleaning the empty ${selector} rule requires a reviewed YAML normalization.`,
          status: 'normalization-required'
        }
      : { status: 'applied', text: withoutRule, updatedSelectors: [selector] };
  }

  let removalFieldPath = fieldPath;
  for (let depth = 1; depth < fieldPath.length; depth += 1) {
    if (valueAt(nextStyle, fieldPath.slice(0, depth)) !== undefined) continue;
    removalFieldPath = fieldPath.slice(0, depth);
    break;
  }
  const removalPath: StudioYamlPath = ['stylesheet', index, 'style', ...removalFieldPath];
  const removed = surgicalRemoveMappingValue(source, removalPath) ?? removeScopedValue(source, removalPath, ['stylesheet', index]);
  return removed === undefined
    ? {
        after: normalizedStructuralEdit(source, removalPath, undefined),
        before: stylesheetText,
        reason: `Removing ${selector} requires a reviewed YAML normalization.`,
        status: 'normalization-required'
      }
    : { status: 'applied', text: removed, updatedSelectors: [selector] };
}

export function unsetCandidateStyleFieldForSelector(stylesheetText: string, selector: string, fieldPath: StudioYamlPath): StudioCandidateMutationResult {
  if (fieldPath.length === 0) return invalidFieldPath();
  const parsed = parseStylesheet(stylesheetText);
  if (!parsed.ok) return { diagnostics: parsed.diagnostics, status: 'invalid' };
  const source = parsed.source;
  const index = selectorRuleIndices(source, selector).at(-1);
  if (index === undefined) return { status: 'unchanged', text: stylesheetText, updatedSelectors: [] };
  const path: StudioYamlPath = ['stylesheet', index, 'style', ...fieldPath];
  if (source.document.getIn(path, true) === undefined) {
    return { status: 'unchanged', text: stylesheetText, updatedSelectors: [] };
  }
  const rule = record(valueAt(source.value, ['stylesheet', index]));
  const currentStyle = record(rule?.style);
  if (!currentStyle) return { status: 'unchanged', text: stylesheetText, updatedSelectors: [] };
  const nextStyle = recordWithoutPath(currentStyle, fieldPath);
  if (Object.keys(nextStyle).length === 0 && Object.keys(rule || {}).every((key) => key === 'selector' || key === 'style')) {
    const withoutRule = surgicalRemoveSequenceValue(source, ['stylesheet'], index) ?? removeScopedValue(source, ['stylesheet', index], ['stylesheet']);
    return withoutRule === undefined
      ? {
          after: normalizedStructuralEdit(
            source,
            ['stylesheet'],
            (source.value.stylesheet as unknown[]).filter((_, ruleIndex) => ruleIndex !== index)
          ),
          before: stylesheetText,
          reason: `Cleaning the empty ${selector} rule requires a reviewed YAML normalization.`,
          status: 'normalization-required'
        }
      : { status: 'applied', text: withoutRule, updatedSelectors: [selector] };
  }

  let removalFieldPath = fieldPath;
  for (let depth = 1; depth < fieldPath.length; depth += 1) {
    if (valueAt(nextStyle, fieldPath.slice(0, depth)) !== undefined) continue;
    removalFieldPath = fieldPath.slice(0, depth);
    break;
  }
  const removalPath: StudioYamlPath = ['stylesheet', index, 'style', ...removalFieldPath];
  const removed = surgicalRemoveMappingValue(source, removalPath) ?? removeScopedValue(source, removalPath, ['stylesheet', index]);
  return removed === undefined
    ? {
        after: normalizedStructuralEdit(source, removalPath, undefined),
        before: stylesheetText,
        reason: `Removing ${selector} requires a reviewed YAML normalization.`,
        status: 'normalization-required'
      }
    : { status: 'applied', text: removed, updatedSelectors: [selector] };
}
