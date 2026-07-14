import type { StyleRule } from 'topoviewer';
import type { StudioCommand, StudioSourceMutation } from '../contracts/commands';
import type { StudioStyleEditRequest, StudioStyleUnsetRequest } from '../contracts/inspector';
import type { StudioSelection } from '../contracts/project';
import type { StudioDocumentSession } from '../session';
import {
  migrateInlineStylesToCandidate,
  type StudioStylesheetTarget,
  type StudioYamlPath
} from '../session';

interface StyleRuleSelectionOptions {
  selection: StudioSelection[];
}

function styleRuleCommand(
  id: string,
  label: string,
  mutations: StudioSourceMutation[],
  selection: StudioSelection[]
): StudioCommand {
  return {
    id,
    label,
    execute: () => ({ mutations, selection, summary: label })
  };
}

function valueAtNestedPath(path: string[], value: unknown): Record<string, unknown> {
  return path.reduceRight<Record<string, unknown>>((nested, segment, index) => ({
    [segment]: index === path.length - 1 ? value : nested
  }), {});
}

export function createStudioInlineStyleMigrationCommand({
  fieldPaths,
  selection,
  target
}: {
  fieldPaths: StudioYamlPath[];
  selection: StudioSelection[];
  target: StudioStylesheetTarget;
}): StudioCommand {
  return {
    id: `migrate-inline-style-${target.kind}-${target.id}`,
    label: `Move ${target.id} inline style to stylesheet`,
    execute(state) {
      const migration = migrateInlineStylesToCandidate({
        fieldPaths,
        stylesheetText: state.project.documents.stylesheet.text,
        target,
        topologyText: state.project.documents.topology.text
      });
      if (migration.status !== 'applied') {
        const detail = migration.status === 'invalid'
          ? migration.diagnostics.map((diagnostic) => diagnostic.message).join('; ')
          : migration.status === 'normalization-required'
            ? migration.reason
            : 'The selected object has no inline values for the requested fields.';
        throw new Error(detail);
      }
      return {
        mutations: [
          { document: 'topology', kind: 'replace-source', text: migration.topologyText },
          { document: 'stylesheet', kind: 'replace-source', text: migration.stylesheetText }
        ],
        selection,
        summary: `Move ${target.id} inline style to stylesheet`
      };
    }
  };
}

export function createStudioStyleRuleCommand({
  insertAt,
  ruleCount,
  selection,
  selector
}: StyleRuleSelectionOptions & { insertAt?: number; ruleCount?: number; selector: string }): StudioCommand {
  const mutations: StudioSourceMutation[] = [{
    document: 'stylesheet',
    kind: 'insert-value',
    path: ['stylesheet'],
    value: { selector, style: {} }
  }];
  if (insertAt !== undefined && ruleCount !== undefined && insertAt >= 0 && insertAt < ruleCount) {
    mutations.push({ document: 'stylesheet', from: ruleCount, kind: 'move-sequence-value', path: ['stylesheet'], to: insertAt });
  }
  return styleRuleCommand(
    'create-style-rule',
    `Create style rule ${selector}`,
    mutations,
    selection
  );
}

export function renameStudioStyleRuleCommand({
  index,
  selection,
  selector
}: StyleRuleSelectionOptions & { index: number; selector: string }): StudioCommand {
  return styleRuleCommand(
    `rename-style-rule-${index}`,
    `Rename style rule to ${selector}`,
    [{
      document: 'stylesheet',
      kind: 'set-value',
      path: ['stylesheet', index, 'selector'],
      value: selector
    }],
    selection
  );
}

export function duplicateStudioStyleRuleCommand({
  rule,
  selection
}: StyleRuleSelectionOptions & { rule: StyleRule }): StudioCommand {
  return styleRuleCommand(
    'duplicate-style-rule',
    `Duplicate style rule ${rule.selector}`,
    [{
      document: 'stylesheet',
      kind: 'insert-value',
      path: ['stylesheet'],
      value: structuredClone(rule)
    }],
    selection
  );
}

export function deleteStudioStyleRuleCommand({
  index,
  selection
}: StyleRuleSelectionOptions & { index: number }): StudioCommand {
  return styleRuleCommand(
    `delete-style-rule-${index}`,
    `Delete style rule ${index + 1}`,
    [{
      document: 'stylesheet',
      kind: 'remove-value',
      path: ['stylesheet', index],
      scopePath: ['stylesheet']
    }],
    selection
  );
}

export function moveStudioStyleRuleCommand({
  direction,
  index,
  rules,
  selection
}: StyleRuleSelectionOptions & {
  direction: -1 | 1;
  index: number;
  rules: StyleRule[];
}): StudioCommand | undefined {
  const destination = index + direction;
  if (!rules[index] || !rules[destination]) return undefined;
  return styleRuleCommand(
    `move-style-rule-${index}-${destination}`,
    `Move style rule ${direction < 0 ? 'earlier' : 'later'}`,
    [{ document: 'stylesheet', from: index, kind: 'move-sequence-value', path: ['stylesheet'], to: destination }],
    selection
  );
}

export function createStudioStyleActions({
  execute,
  session
}: {
  execute(command: StudioCommand): boolean;
  session: StudioDocumentSession;
}) {
  function commitStyleInspector(request: StudioStyleEditRequest) {
    const selection = session.snapshot().selection[0];
    if (request.scope.kind === 'new-rule') {
      const selector = request.scope.selector;
      const value = { selector, style: valueAtNestedPath(request.fieldPath, request.value) };
      return execute(styleRuleCommand(
        `create-style-rule-${request.fieldPath.join('-')}`,
        `Create ${selector} style rule`,
        [{ document: 'stylesheet', kind: 'insert-value', path: ['stylesheet'], value }],
        selection ? [selection] : []
      ));
    }
    if (request.scope.kind === 'object' && !request.objectPath) return false;
    const document = request.scope.kind === 'object' ? 'topology' as const : 'stylesheet' as const;
    const scopePath = request.scope.kind === 'object'
      ? request.objectPath!
      : ['stylesheet', request.scope.ruleIndex];
    const path = request.scope.kind === 'object'
      ? [...request.objectPath!, 'style', ...request.fieldPath]
      : ['stylesheet', request.scope.ruleIndex, 'style', ...request.fieldPath];
    const mutation: StudioSourceMutation = session.sourceRange(document, path)
      ? { document, kind: 'set-value', path, value: request.value }
      : { document, kind: 'upsert-value', path, scopePath, value: request.value };
    return execute({
      coalescingKey: selection ? `${selection.kind}:${selection.id}:${document}:${path.join('.')}` : undefined,
      ...styleRuleCommand(
        `style-${document}-${path.join('-')}`,
        `Edit ${request.fieldPath.at(-1)}`,
        [mutation],
        selection ? [selection] : []
      )
    });
  }

  function unsetStyleInspector(request: StudioStyleUnsetRequest) {
    const selection = session.snapshot().selection[0];
    if (request.scope.kind === 'object' && !request.objectPath) return false;
    const document = request.scope.kind === 'object' ? 'topology' as const : 'stylesheet' as const;
    const scopePath = request.scope.kind === 'object'
      ? request.objectPath!
      : ['stylesheet', request.scope.ruleIndex];
    const path = request.scope.kind === 'object'
      ? [...request.objectPath!, 'style', ...request.fieldPath]
      : ['stylesheet', request.scope.ruleIndex, 'style', ...request.fieldPath];
    if (!session.sourceRange(document, path)) return false;
    return execute(styleRuleCommand(
      `unset-style-${document}-${path.join('-')}`,
      `Unset ${request.fieldPath.at(-1)}`,
      [{ document, kind: 'remove-value', path, scopePath }],
      selection ? [selection] : []
    ));
  }

  function createStyleRule(selector: string, insertAt?: number) {
    const trimmed = selector.trim();
    if (!trimmed) return false;
    const current = session.snapshot();
    return execute(createStudioStyleRuleCommand({
      insertAt,
      ruleCount: current.projection.document.stylesheet?.length || 0,
      selection: current.selection,
      selector: trimmed
    }));
  }

  function renameStyleRule(index: number, selector: string) {
    const trimmed = selector.trim();
    if (!trimmed) return false;
    return execute(renameStudioStyleRuleCommand({
      index,
      selection: session.snapshot().selection,
      selector: trimmed
    }));
  }

  function duplicateStyleRule(index: number) {
    const current = session.snapshot();
    const rule = current.projection.document.stylesheet?.[index];
    return rule
      ? execute(duplicateStudioStyleRuleCommand({ rule, selection: current.selection }))
      : false;
  }

  function moveStyleRule(index: number, direction: -1 | 1) {
    const current = session.snapshot();
    const command = moveStudioStyleRuleCommand({
      direction,
      index,
      rules: current.projection.document.stylesheet || [],
      selection: current.selection
    });
    return command ? execute(command) : false;
  }

  function deleteStyleRule(index: number) {
    const current = session.snapshot();
    return current.projection.document.stylesheet?.[index]
      ? execute(deleteStudioStyleRuleCommand({ index, selection: current.selection }))
      : false;
  }

  return {
    commitStyleInspector,
    createStyleRule,
    deleteStyleRule,
    duplicateStyleRule,
    moveStyleRule,
    renameStyleRule,
    unsetStyleInspector
  };
}
