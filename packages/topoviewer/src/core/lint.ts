import { rendererLimitViolations } from './limits';
import { selectorMatches } from './selector';
import type { GraphEntity, GraphLink, GraphPath, StyleRule, TopoDocument } from './types';
import { validateTopoDocument } from './validation';

export type LintSeverity = 'error' | 'warning';

export interface LintIssue {
  severity: LintSeverity;
  code: string;
  message: string;
  path?: string;
}

export interface LintOptions {
  requireNames?: boolean;
}

function issue(severity: LintSeverity, code: string, message: string, path?: string): LintIssue {
  return { severity, code, message, path };
}

function addEntity(
  seen: Map<string, string>,
  issues: LintIssue[],
  kind: string,
  entity: GraphEntity,
  path: string,
  requireNames: boolean
) {
  const existing = seen.get(entity.id);
  if (existing) {
    issues.push(issue('error', 'duplicate-id', `Duplicate id "${entity.id}" used by ${existing} and ${kind}.`, path));
  } else {
    seen.set(entity.id, kind);
  }

  if (requireNames && !entity.name) {
    issues.push(issue('warning', 'missing-name', `${kind} "${entity.id}" should define name for readable labels, tooltips, and exports.`, path));
  }
}

function objectLayerIssues(entity: GraphEntity, knownLayers: Set<string>, path: string): LintIssue[] {
  return (entity.layers || []).flatMap((layer) => (
    knownLayers.has(layer)
      ? []
      : [issue('error', 'unknown-layer', `Entity "${entity.id}" references unknown layer "${layer}".`, `${path}.layers`)]
  ));
}

function hasSequence(path: GraphPath): path is GraphPath & { sequence: string[] } {
  return Array.isArray(path.sequence) && path.sequence.length >= 2;
}

function ownerNodeId(nodeId: string, nodeParents: Map<string, string>): string {
  return nodeParents.get(nodeId) || nodeId;
}

function endpointMatchesParentPathEndpoint(endpoint: string | undefined, parentEndpoint: string, nodeParents: Map<string, string>): boolean {
  if (!endpoint) return false;
  return ownerNodeId(endpoint, nodeParents) === parentEndpoint;
}

function subjectEntities(document: TopoDocument): Array<{ kind: string; entity: GraphEntity }> {
  const graph = document.graph || {};
  return [
    ...(graph.nodes || []).map((entity) => ({ kind: 'node', entity })),
    ...(graph.links || []).map((entity) => ({ kind: 'link', entity })),
    ...(graph.paths || []).map((entity) => ({ kind: 'path', entity })),
    ...(graph.regions || []).map((entity) => ({ kind: 'region', entity })),
    ...(document.diagram?.shapes || []).map((entity) => ({ kind: 'shape', entity })),
    ...(document.diagram?.callouts || []).map((entity) => ({ kind: 'callout', entity }))
  ];
}

function selectorHasMatch(rule: StyleRule, document: TopoDocument): boolean {
  return subjectEntities(document).some(({ kind, entity }) => selectorMatches(kind, entity, rule.selector));
}

function selectorTargetsGeneratedObject(selector: string): boolean {
  return /\[\s*labels\.leader\s*=/.test(selector);
}

function unsafeImageReference(value: string): boolean {
  const trimmed = value.trim();
  return /^javascript:/i.test(trimmed) || /^data:image\/svg\+xml/i.test(trimmed);
}

export function lintTopoDocument(input: TopoDocument, options: LintOptions = {}): LintIssue[] {
  const document = validateTopoDocument(input);
  const requireNames = options.requireNames !== false;
  const issues: LintIssue[] = [];
  const graph = document.graph || {};
  const diagram = document.diagram || {};
  const knownLayers = new Set((graph.layers || []).map((layer) => layer.id));
  const nodeIds = new Set((graph.nodes || []).map((node) => node.id));
  const regionIds = new Set((graph.regions || []).map((region) => region.id));
  const linkIds = new Set((graph.links || []).map((link) => link.id));
  const sequencedPathIds = new Set((graph.paths || []).filter(hasSequence).map((path) => path.id));
  const nodeParents = new Map((graph.nodes || []).filter((node) => node.parent).map((node) => [node.id, node.parent!]));
  const seenIds = new Map<string, string>();

  (graph.nodes || []).forEach((node, index) => {
    addEntity(seenIds, issues, 'node', node, `graph.nodes[${index}]`, requireNames);
    issues.push(...objectLayerIssues(node, knownLayers, `graph.nodes[${index}]`));
    if (node.parent && !nodeIds.has(node.parent)) {
      issues.push(issue('error', 'broken-parent', `Node "${node.id}" parent "${node.parent}" does not exist as a node.`, `graph.nodes[${index}].parent`));
    }
  });

  (graph.links || []).forEach((link: GraphLink, index) => {
    addEntity(seenIds, issues, 'link', link, `graph.links[${index}]`, requireNames);
    issues.push(...objectLayerIssues(link, knownLayers, `graph.links[${index}]`));
    if (!nodeIds.has(link.source)) issues.push(issue('error', 'broken-source', `Link "${link.id}" source "${link.source}" does not exist.`, `graph.links[${index}].source`));
    if (!nodeIds.has(link.target)) issues.push(issue('error', 'broken-target', `Link "${link.id}" target "${link.target}" does not exist.`, `graph.links[${index}].target`));
    if (link.parent && !linkIds.has(link.parent)) {
      issues.push(issue('error', 'broken-parent-link', `Link "${link.id}" parent "${link.parent}" does not exist as a link.`, `graph.links[${index}].parent`));
    }
  });

  (graph.paths || []).forEach((path, index) => {
    addEntity(seenIds, issues, 'path', path, `graph.paths[${index}]`, requireNames);
    issues.push(...objectLayerIssues(path, knownLayers, `graph.paths[${index}]`));
    if (hasSequence(path)) {
      path.sequence.forEach((nodeId, sequenceIndex) => {
        if (!nodeIds.has(nodeId)) {
          issues.push(issue('error', 'broken-path-node', `Path "${path.id}" sequence node "${nodeId}" does not exist.`, `graph.paths[${index}].sequence[${sequenceIndex}]`));
        }
      });
      return;
    }

    if (!path.source || !path.target || !path.parent) return;
    if (!nodeIds.has(path.source)) issues.push(issue('error', 'broken-source', `Path "${path.id}" source "${path.source}" does not exist.`, `graph.paths[${index}].source`));
    if (!nodeIds.has(path.target)) issues.push(issue('error', 'broken-target', `Path "${path.id}" target "${path.target}" does not exist.`, `graph.paths[${index}].target`));
    if (!sequencedPathIds.has(path.parent)) {
      issues.push(issue('error', 'broken-parent-path', `Path "${path.id}" parent "${path.parent}" does not exist as a sequenced path.`, `graph.paths[${index}].parent`));
      return;
    }
    const parentPath = (graph.paths || []).find((candidate) => candidate.id === path.parent && hasSequence(candidate));
    const parentStart = parentPath?.sequence?.[0];
    const parentEnd = parentPath?.sequence?.[(parentPath.sequence?.length || 1) - 1];
    if (parentStart && !endpointMatchesParentPathEndpoint(path.source, parentStart, nodeParents)) {
      issues.push(issue('warning', 'stitched-source-owner', `Path "${path.id}" source owner does not match parent path first node "${parentStart}".`, `graph.paths[${index}].source`));
    }
    if (parentEnd && !endpointMatchesParentPathEndpoint(path.target, parentEnd, nodeParents)) {
      issues.push(issue('warning', 'stitched-target-owner', `Path "${path.id}" target owner does not match parent path last node "${parentEnd}".`, `graph.paths[${index}].target`));
    }
  });

  (graph.regions || []).forEach((region, index) => {
    addEntity(seenIds, issues, 'region', region, `graph.regions[${index}]`, requireNames);
    issues.push(...objectLayerIssues(region, knownLayers, `graph.regions[${index}]`));
    (region.members || []).forEach((member, memberIndex) => {
      if (!nodeIds.has(member) && !regionIds.has(member)) {
        issues.push(issue('error', 'broken-region-member', `Region "${region.id}" member "${member}" does not exist as a node or region.`, `graph.regions[${index}].members[${memberIndex}]`));
      }
    });
    if (region.parent && !regionIds.has(region.parent)) {
      issues.push(issue('error', 'broken-parent-region', `Region "${region.id}" parent "${region.parent}" does not exist as a region.`, `graph.regions[${index}].parent`));
    }
  });

  (diagram.shapes || []).forEach((shape, index) => {
    addEntity(seenIds, issues, 'shape', shape, `diagram.shapes[${index}]`, false);
    issues.push(...objectLayerIssues(shape, knownLayers, `diagram.shapes[${index}]`));
  });

  (diagram.callouts || []).forEach((callout, index) => {
    addEntity(seenIds, issues, 'callout', callout, `diagram.callouts[${index}]`, false);
    issues.push(...objectLayerIssues(callout, knownLayers, `diagram.callouts[${index}]`));
    if (callout.target && !nodeIds.has(callout.target) && !seenIds.has(callout.target)) {
      issues.push(issue('error', 'broken-callout-target', `Callout "${callout.id}" target "${callout.target}" does not exist.`, `diagram.callouts[${index}].target`));
    }
  });

  (document.stylesheet || []).forEach((rule, index) => {
    if (!selectorTargetsGeneratedObject(rule.selector) && !selectorHasMatch(rule, document)) {
      issues.push(issue('warning', 'unused-selector', `Stylesheet selector "${rule.selector}" does not match any current object.`, `stylesheet[${index}].selector`));
    }
  });

  Object.entries(document.icons || {}).forEach(([key, icon]) => {
    if (icon.src && unsafeImageReference(icon.src)) {
      issues.push(issue('error', 'unsafe-image-reference', `Icon "${key}" uses an unsafe image reference.`, `icons.${key}.src`));
    }
  });

  rendererLimitViolations(document).forEach((message) => {
    issues.push(issue('error', 'renderer-limit', message, 'limits'));
  });

  return issues;
}
