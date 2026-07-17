import { Document, isMap, isNode, isScalar, isSeq, LineCounter, parseDocument, Scalar, visit, type Node } from 'yaml';
import type { StudioDiagnostic, StudioDocumentKind } from '../contracts/project';
import { studioSecurityLimits } from '../security/limits';
import type { ParsedStudioSource, StudioSourceRange, StudioYamlPath } from './types';

export type StudioSourceParseResult = { diagnostics: StudioDiagnostic[]; ok: false } | { ok: true; source: ParsedStudioSource };

export const studioYamlLimits = {
  maximumAliases: studioSecurityLimits.sourceAliases,
  maximumBytes: studioSecurityLimits.sourceBytes,
  maximumDepth: studioSecurityLimits.sourceDepth,
  maximumNodes: studioSecurityLimits.sourceNodes
} as const;

function lineEndingFor(text: string): '\n' | '\r\n' {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

function rootIsRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseStudioSource(kind: StudioDocumentKind, text: string): StudioSourceParseResult {
  const sourceBytes = new TextEncoder().encode(text).byteLength;
  if (sourceBytes > studioYamlLimits.maximumBytes) {
    return {
      diagnostics: [
        {
          code: 'yaml-source-too-large',
          column: 1,
          document: kind,
          line: 1,
          message: `${kind} YAML exceeds the ${studioYamlLimits.maximumBytes} byte source limit.`,
          severity: 'error'
        }
      ],
      ok: false
    };
  }
  const lineCounter = new LineCounter();
  let yamlDocument: ReturnType<typeof parseDocument>;
  try {
    yamlDocument = parseDocument(text || '{}\n', {
      keepSourceTokens: true,
      lineCounter,
      prettyErrors: true,
      strict: true,
      uniqueKeys: true
    });
  } catch (error) {
    return {
      diagnostics: [
        {
          code: 'invalid-yaml',
          column: 1,
          document: kind,
          line: 1,
          message: error instanceof Error ? error.message : String(error),
          severity: 'error'
        }
      ],
      ok: false
    };
  }
  if (yamlDocument.errors.length > 0) {
    return {
      diagnostics: yamlDocument.errors.map((error) => ({
        code: 'invalid-yaml',
        column: error.linePos?.[0].col || lineCounter.linePos(error.pos[0]).col,
        document: kind,
        endColumn: error.linePos?.[1]?.col,
        endLine: error.linePos?.[1]?.line,
        line: error.linePos?.[0].line || lineCounter.linePos(error.pos[0]).line,
        message: error.message,
        severity: 'error'
      })),
      ok: false
    };
  }

  const rangedNodes: Node[] = [];
  let excessiveStructure = false;
  visit(yamlDocument, (_key, node, path) => {
    if (isNode(node) && node.range) rangedNodes.push(node);
    if (path.length > studioYamlLimits.maximumDepth || rangedNodes.length > studioYamlLimits.maximumNodes) {
      excessiveStructure = true;
      return visit.BREAK;
    }
  });
  if (excessiveStructure) {
    return {
      diagnostics: [
        {
          code: 'yaml-structure-limit',
          column: 1,
          document: kind,
          line: 1,
          message: `${kind} YAML exceeds the supported structure depth or node-count limit.`,
          severity: 'error'
        }
      ],
      ok: false
    };
  }

  let value: unknown;
  try {
    value = yamlDocument.toJS({
      maxAliasCount: studioYamlLimits.maximumAliases
    });
  } catch (error) {
    return {
      diagnostics: [
        {
          code: 'invalid-yaml-alias',
          column: 1,
          document: kind,
          line: 1,
          message: error instanceof Error ? error.message : String(error),
          severity: 'error'
        }
      ],
      ok: false
    };
  }
  if (!rootIsRecord(value)) {
    return {
      diagnostics: [
        {
          code: 'invalid-yaml-root',
          column: 1,
          document: kind,
          line: 1,
          message: `${kind} YAML must contain an object at the document root.`,
          severity: 'error'
        }
      ],
      ok: false
    };
  }
  return {
    ok: true,
    source: {
      document: yamlDocument,
      kind,
      lineCounter,
      lineEnding: lineEndingFor(text),
      rangedNodes,
      text,
      value
    }
  };
}

function parsedNode(source: ParsedStudioSource, path: StudioYamlPath): Node | undefined {
  const value = source.document.getIn(path, true);
  return value && typeof value === 'object' && 'range' in value ? (value as Node) : undefined;
}

export function sourceRangeAtPath(source: ParsedStudioSource, path: StudioYamlPath): StudioSourceRange | undefined {
  const node = parsedNode(source, path);
  if (!node?.range) return undefined;
  const [startOffset, valueEnd, nodeEnd] = node.range;
  const start = source.lineCounter.linePos(startOffset);
  const endOffset = valueEnd ?? nodeEnd ?? startOffset;
  const end = source.lineCounter.linePos(endOffset);
  return {
    column: start.col,
    endColumn: end.col,
    endLine: end.line,
    endOffset,
    line: start.line,
    startOffset
  };
}

export function sourcePathAtOffset(source: ParsedStudioSource, offset: number): StudioYamlPath | undefined {
  let best: { path: StudioYamlPath; span: number } | undefined;

  function visitValue(value: unknown, path: StudioYamlPath) {
    const node = parsedNode(source, path);
    const range = node?.range;
    if (range) {
      const end = range[2] ?? range[1] ?? range[0];
      if (offset < range[0] || offset > end) return;
      const span = Math.max(0, end - range[0]);
      if (!best || span <= best.span) best = { path, span };
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visitValue(item, [...path, index]));
      return;
    }
    if (!rootIsRecord(value)) return;
    Object.entries(value).forEach(([key, item]) => visitValue(item, [...path, key]));
  }

  visitValue(source.value, []);
  return best?.path;
}

function scalarDocument(value: unknown, type?: Scalar.Type): string {
  const yamlDocument = new Document();
  const node = yamlDocument.createNode(value);
  if (isScalar(node) && type) node.type = type;
  yamlDocument.contents = node;
  return String(yamlDocument).replace(/\n$/, '');
}

function indentMultiline(value: string, column: number, lineEnding: '\n' | '\r\n'): string {
  const indent = ' '.repeat(Math.max(0, column - 1));
  return value.replace(/\n/g, `${lineEnding}${indent}`);
}

export function surgicalScalarEdit(source: ParsedStudioSource, path: StudioYamlPath, value: unknown): string | undefined {
  const current = parsedNode(source, path);
  if (!isScalar(current) || !current.range || (value !== null && !['string', 'number', 'boolean'].includes(typeof value))) {
    return undefined;
  }
  const [start, valueEnd] = current.range;
  const position = source.lineCounter.linePos(start);
  const serialized = indentMultiline(scalarDocument(value, current.type), position.col, source.lineEnding);
  return source.text.slice(0, start) + serialized + source.text.slice(valueEnd);
}

export function surgicalRemoveMappingValue(source: ParsedStudioSource, path: StudioYamlPath): string | undefined {
  if (path.length === 0 || typeof path.at(-1) !== 'string') return undefined;
  const parentPath = path.slice(0, -1);
  const parent = source.document.getIn(parentPath, true);
  if (!isMap(parent) || parent.flow) return undefined;
  const key = path.at(-1);
  const pair = parent.items.find((item) => isScalar(item.key) && item.key.value === key);
  if (!pair || !isScalar(pair.key) || !pair.key.range) return undefined;

  const value = pair.value;
  const valueRange = isNode(value) ? value.range : undefined;
  const nodeEnd = Math.max(pair.key.range[2] ?? pair.key.range[1] ?? pair.key.range[0], valueRange?.[2] ?? valueRange?.[1] ?? valueRange?.[0] ?? 0);
  const lineStart = Math.max(0, source.text.lastIndexOf('\n', pair.key.range[0] - 1) + 1);
  return source.text.slice(0, lineStart) + source.text.slice(nodeEnd);
}

export function surgicalRemoveSequenceValue(source: ParsedStudioSource, path: StudioYamlPath, index: number): string | undefined {
  const sequence = source.document.getIn(path, true);
  if (!isSeq(sequence) || sequence.flow || index < 0 || index >= sequence.items.length) return undefined;
  const item = sequence.items[index];
  if (!isNode(item) || !item.range) return undefined;

  if (sequence.items.length === 1 && typeof path.at(-1) === 'string') {
    const parent = source.document.getIn(path.slice(0, -1), true);
    if (!isMap(parent) || parent.flow) return undefined;
    const key = path.at(-1);
    const pair = parent.items.find((entry) => isScalar(entry.key) && entry.key.value === key);
    if (!pair || !isScalar(pair.key) || !pair.key.range || !sequence.range) return undefined;
    const colon = source.text.indexOf(':', pair.key.range[1]);
    if (colon < 0 || colon >= sequence.range[0]) return undefined;
    const end = sequence.range[2] ?? sequence.range[1] ?? sequence.range[0];
    const ending = source.text.slice(Math.max(colon + 1, end - source.lineEnding.length), end).endsWith(source.lineEnding) ? source.lineEnding : '';
    return source.text.slice(0, colon + 1) + ` []${ending}` + source.text.slice(end);
  }

  const start = Math.max(0, source.text.lastIndexOf('\n', item.range[0] - 1) + 1);
  const end = item.range[2] ?? item.range[1] ?? item.range[0];
  return source.text.slice(0, start) + source.text.slice(end);
}

function valueWithChange(root: Record<string, unknown>, path: StudioYamlPath, value: unknown): Record<string, unknown> {
  function update(current: unknown, index: number): unknown {
    if (index === path.length) return value;
    const segment = path[index];
    if (typeof segment === 'number') {
      const next = Array.isArray(current) ? [...current] : [];
      next[segment] = update(next[segment], index + 1);
      return next;
    }
    const next = current && typeof current === 'object' && !Array.isArray(current) ? { ...(current as Record<string, unknown>) } : {};
    next[segment] = update(next[segment], index + 1);
    return next;
  }
  return update(root, 0) as Record<string, unknown>;
}

function lineCounterFor(text: string): LineCounter {
  const counter = new LineCounter();
  counter.addNewLine(0);
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') counter.addNewLine(index + 1);
  }
  return counter;
}

function shiftParsedRanges(source: ParsedStudioSource, current: Node, valueEnd: number, delta: number) {
  for (const node of source.rangedNodes) {
    if (!node.range) continue;
    if (node === current) {
      node.range = [node.range[0], node.range[1] + delta, node.range[2] + delta];
      continue;
    }
    node.range = node.range.map((offset) => (offset >= valueEnd ? offset + delta : offset)) as typeof node.range;
  }
  if (source.document.range) {
    source.document.range = source.document.range.map((offset) => (offset >= valueEnd ? offset + delta : offset)) as typeof source.document.range;
  }
}

export interface PreparedSurgicalEdit {
  commit(): void;
  source: ParsedStudioSource;
  text: string;
}

export interface StudioScalarEdit {
  path: StudioYamlPath;
  value: unknown;
}

interface PreparedReplacement extends StudioScalarEdit {
  current: Scalar;
  end: number;
  serialized: string;
  start: number;
}

export function prepareSurgicalScalarEdit(source: ParsedStudioSource, path: StudioYamlPath, value: unknown): PreparedSurgicalEdit | undefined {
  const current = parsedNode(source, path);
  if (!isScalar(current) || !current.range || (value !== null && !['string', 'number', 'boolean'].includes(typeof value))) {
    return undefined;
  }
  const [start, valueEnd] = current.range;
  const position = source.lineCounter.linePos(start);
  const serialized = indentMultiline(scalarDocument(value, current.type), position.col, source.lineEnding);
  const replaced = source.text.slice(start, valueEnd);
  if (serialized.includes('\n') || serialized.includes('\r') || replaced.includes('\n') || replaced.includes('\r')) {
    return undefined;
  }
  const text = source.text.slice(0, start) + serialized + source.text.slice(valueEnd);
  const candidate: ParsedStudioSource = {
    ...source,
    text,
    value: valueWithChange(source.value, path, value)
  };
  return {
    commit() {
      const delta = serialized.length - (valueEnd - start);
      shiftParsedRanges(source, current, valueEnd, delta);
      current.value = value;
      current.source = String(value);
      candidate.lineCounter = lineCounterFor(text);
    },
    source: candidate,
    text
  };
}

export function prepareSurgicalScalarEdits(source: ParsedStudioSource, edits: StudioScalarEdit[]): PreparedSurgicalEdit | undefined {
  if (edits.length === 0) return undefined;
  const replacements: PreparedReplacement[] = [];
  const identities = new Set<string>();
  for (const edit of edits) {
    const identity = JSON.stringify(edit.path);
    if (identities.has(identity)) return undefined;
    identities.add(identity);
    const current = parsedNode(source, edit.path);
    if (!isScalar(current) || !current.range || (edit.value !== null && !['string', 'number', 'boolean'].includes(typeof edit.value))) {
      return undefined;
    }
    const [start, end] = current.range;
    const position = source.lineCounter.linePos(start);
    const serialized = indentMultiline(scalarDocument(edit.value, current.type), position.col, source.lineEnding);
    const replaced = source.text.slice(start, end);
    if (serialized.includes('\n') || serialized.includes('\r') || replaced.includes('\n') || replaced.includes('\r')) {
      return undefined;
    }
    replacements.push({ ...edit, current, end, serialized, start });
  }

  let text = source.text;
  for (const replacement of [...replacements].sort((left, right) => right.start - left.start)) {
    text = text.slice(0, replacement.start) + replacement.serialized + text.slice(replacement.end);
  }
  const candidate: ParsedStudioSource = {
    ...source,
    text,
    value: edits.reduce((value, edit) => valueWithChange(value, edit.path, edit.value), source.value)
  };

  return {
    commit() {
      const ordered = [...replacements]
        .sort((left, right) => left.end - right.end)
        .map((replacement) => ({
          ...replacement,
          delta: replacement.serialized.length - (replacement.end - replacement.start)
        }));
      const cumulative = ordered.reduce<number[]>((values, replacement, index) => {
        values.push((values[index - 1] || 0) + replacement.delta);
        return values;
      }, []);
      const shiftedOffset = (offset: number) => {
        let low = 0;
        let high = ordered.length;
        while (low < high) {
          const middle = Math.floor((low + high) / 2);
          if (ordered[middle].end <= offset) low = middle + 1;
          else high = middle;
        }
        return offset + (low > 0 ? cumulative[low - 1] : 0);
      };
      for (const node of source.rangedNodes) {
        if (node.range) node.range = node.range.map(shiftedOffset) as typeof node.range;
      }
      if (source.document.range) {
        source.document.range = source.document.range.map(shiftedOffset) as typeof source.document.range;
      }
      for (const replacement of replacements) {
        replacement.current.value = replacement.value;
        replacement.current.source = String(replacement.value);
      }
      candidate.lineCounter = lineCounterFor(text);
    },
    source: candidate,
    text
  };
}

export function normalizedStructuralEdit(source: ParsedStudioSource, path: StudioYamlPath, value: unknown): string {
  const yamlDocument = source.document.clone();
  yamlDocument.setIn(path, value);
  const normalized = String(yamlDocument);
  const withLineEndings = source.lineEnding === '\r\n' ? normalized.replace(/(?<!\r)\n/g, '\r\n') : normalized;
  const sourceHasEnding = source.text.endsWith(source.lineEnding);
  if (sourceHasEnding || !withLineEndings.endsWith(source.lineEnding)) return withLineEndings;
  return withLineEndings.slice(0, -source.lineEnding.length);
}

export function normalizedStructuralEdits(source: ParsedStudioSource, edits: StudioScalarEdit[]): string {
  const yamlDocument = source.document.clone();
  for (const edit of edits) yamlDocument.setIn(edit.path, edit.value);
  const normalized = String(yamlDocument);
  const withLineEndings = source.lineEnding === '\r\n' ? normalized.replace(/(?<!\r)\n/g, '\r\n') : normalized;
  const sourceHasEnding = source.text.endsWith(source.lineEnding);
  if (sourceHasEnding || !withLineEndings.endsWith(source.lineEnding)) return withLineEndings;
  return withLineEndings.slice(0, -source.lineEnding.length);
}

function scopedReplacement(source: ParsedStudioSource, scopePath: StudioYamlPath, mutate: (yamlDocument: ParsedStudioSource['document']) => void): string | undefined {
  const original = parsedNode(source, scopePath);
  if (!original?.range) return undefined;
  const yamlDocument = source.document.clone();
  mutate(yamlDocument);
  const updated = yamlDocument.getIn(scopePath, true);
  if (!isNode(updated)) return undefined;
  const fragment = new Document();
  fragment.contents = updated;
  const serialized = String(fragment).replace(/\n$/, '');
  const [start, valueEnd, nodeEnd] = original.range;
  const position = source.lineCounter.linePos(start);
  const expandsInlineSequence = isSeq(original) && original.flow === true && isSeq(updated) && updated.flow === false;
  const lineStart = Math.max(0, source.text.lastIndexOf('\n', start - 1) + 1);
  const leadingIndent = source.text.slice(lineStart, start).match(/^\s*/)?.[0].length || 0;
  const blockIndent = leadingIndent + 2;
  const indented = expandsInlineSequence ? `${source.lineEnding}${' '.repeat(blockIndent)}${indentMultiline(serialized, blockIndent + 1, source.lineEnding)}` : indentMultiline(serialized, position.col, source.lineEnding);
  const originalText = source.text.slice(start, nodeEnd);
  const ending = originalText.endsWith(source.lineEnding) ? source.lineEnding : '';
  return source.text.slice(0, start) + indented + ending + source.text.slice(nodeEnd || valueEnd);
}

function nestedSequenceMapping(path: string[], value: unknown): Record<string, unknown> {
  let nested: unknown = [value];
  for (let index = path.length - 1; index >= 0; index -= 1) nested = { [path[index]]: nested };
  return nested as Record<string, unknown>;
}

function insertMissingSequenceValue(source: ParsedStudioSource, path: StudioYamlPath, value: unknown): string | undefined {
  if (path.length === 0 || source.document.getIn(path, true) !== undefined) return undefined;

  let ancestorPath: StudioYamlPath | undefined;
  let ancestor: ReturnType<typeof source.document.getIn>;
  for (let depth = path.length - 1; depth >= 0; depth -= 1) {
    const candidatePath = path.slice(0, depth);
    const candidate = source.document.getIn(candidatePath, true);
    if (candidate === undefined) continue;
    if (!isMap(candidate)) return undefined;
    ancestorPath = candidatePath;
    ancestor = candidate;
    break;
  }
  if (!ancestorPath || !isMap(ancestor) || !ancestor.range) return undefined;

  const missingPath = path.slice(ancestorPath.length);
  if (missingPath.length === 0 || missingPath.some((segment) => typeof segment !== 'string')) return undefined;

  if (ancestor.flow === true) {
    return scopedReplacement(source, ancestorPath, (yamlDocument) => {
      yamlDocument.setIn(path, [value]);
    });
  }

  const fragment = new Document();
  fragment.contents = fragment.createNode(nestedSequenceMapping(missingPath as string[], value));
  const serialized = String(fragment).replace(/\n$/, '');
  const [start, , end] = ancestor.range;
  const column = source.lineCounter.linePos(start).col;
  const indented = `${' '.repeat(Math.max(0, column - 1))}${indentMultiline(serialized, column, source.lineEnding)}`;
  const before = source.text.slice(0, end);
  const after = source.text.slice(end);
  const prefix = before.endsWith(source.lineEnding) ? '' : source.lineEnding;
  const suffix = after.length > 0 || source.text.endsWith(source.lineEnding) ? source.lineEnding : '';
  return `${before}${prefix}${indented}${suffix}${after}`;
}

export function insertSequenceValue(source: ParsedStudioSource, path: StudioYamlPath, value: unknown): string | undefined {
  const sequence = source.document.getIn(path, true);
  if (sequence === undefined) return insertMissingSequenceValue(source, path, value);
  if (!isSeq(sequence)) return undefined;
  return scopedReplacement(source, path, (yamlDocument) => {
    yamlDocument.addIn(path, value);
    const updated = yamlDocument.getIn(path, true);
    if (isSeq(updated) && updated.items.length > 0) updated.flow = false;
  });
}

export function moveSequenceValue(source: ParsedStudioSource, path: StudioYamlPath, from: number, to: number): string | undefined {
  const sequence = source.document.getIn(path, true);
  if (!isSeq(sequence) || from === to || from < 0 || to < 0 || from >= sequence.items.length || to >= sequence.items.length) {
    return undefined;
  }
  return scopedReplacement(source, path, (yamlDocument) => {
    const updated = yamlDocument.getIn(path, true);
    if (!isSeq(updated)) return;
    const [item] = updated.items.splice(from, 1);
    updated.items.splice(to, 0, item);
  });
}

export function upsertScopedValue(source: ParsedStudioSource, path: StudioYamlPath, value: unknown, scopePath: StudioYamlPath): string | undefined {
  const isDescendant = scopePath.every((segment, index) => path[index] === segment) && path.length > scopePath.length;
  if (!isDescendant) return undefined;
  return scopedReplacement(source, scopePath, (yamlDocument) => yamlDocument.setIn(path, value));
}

export function removeScopedValue(source: ParsedStudioSource, path: StudioYamlPath, scopePath: StudioYamlPath): string | undefined {
  const isDescendant = scopePath.every((segment, index) => path[index] === segment) && path.length > scopePath.length;
  if (!isDescendant || source.document.getIn(path, true) === undefined) return undefined;
  return scopedReplacement(source, scopePath, (yamlDocument) => {
    yamlDocument.deleteIn(path);
  });
}
