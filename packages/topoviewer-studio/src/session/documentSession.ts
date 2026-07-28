import type { StudioDiagnostic, StudioDocumentKind, StudioInvalidDraft, StudioProject, StudioSessionSnapshot, StudioSourceDocument } from '../contracts/project';
import { stableProjectSourceRevision, stableTextHash } from './hash';
import { buildProjection, type ParsedSources } from './projection';
import { semanticIdAtPath, sourcePathForSemanticSelection } from './semanticIdentity';
import type { StudioDocumentSession, StudioNormalizationReview, StudioSessionUpdateResult, StudioYamlPath } from './types';
import {
  insertSequenceValue,
  moveSequenceValue as moveYamlSequenceValue,
  normalizedStructuralEdit,
  normalizedStructuralEdits,
  parseStudioSource,
  prepareSurgicalScalarEdit,
  prepareSurgicalScalarEdits,
  removeScopedValue,
  sourcePathAtOffset,
  sourceRangeAtPath,
  surgicalScalarEdit,
  upsertScopedValue
} from './yamlSource';

function sourceDocument(document: StudioSourceDocument, text: string): StudioSourceDocument {
  return { ...document, contentHash: `fnv1a-${stableTextHash(text)}`, text };
}

function projectTexts(project: StudioProject): Partial<Record<StudioDocumentKind, string>> {
  return Object.fromEntries((['topology', 'stylesheet', 'mapper'] as const).filter((kind) => project.documents[kind]).map((kind) => [kind, project.documents[kind]?.text]));
}

function immutableSnapshot(snapshot: StudioSessionSnapshot): StudioSessionSnapshot {
  Object.freeze(snapshot.invalidDrafts);
  Object.freeze(snapshot.projection);
  Object.freeze(snapshot.selection);
  return Object.freeze(snapshot);
}

function normalizationDiff(before: string, after: string) {
  const beforeLines = before.split(/\r?\n/);
  const afterLines = after.split(/\r?\n/);
  let prefix = 0;
  while (prefix < beforeLines.length && prefix < afterLines.length && beforeLines[prefix] === afterLines[prefix]) {
    prefix += 1;
  }
  let suffix = 0;
  while (suffix < beforeLines.length - prefix && suffix < afterLines.length - prefix && beforeLines[beforeLines.length - 1 - suffix] === afterLines[afterLines.length - 1 - suffix]) {
    suffix += 1;
  }
  return {
    afterLines: afterLines.slice(prefix, afterLines.length - suffix),
    beforeLines: beforeLines.slice(prefix, beforeLines.length - suffix),
    startLine: prefix + 1
  };
}

export function createStudioDocumentSession(initialProject: StudioProject): StudioDocumentSession {
  const initialProjection = buildProjection(projectTexts(initialProject));
  if (!initialProjection.ok) {
    throw new Error(initialProjection.diagnostics.map((diagnostic) => diagnostic.message).join('; '));
  }

  let sources: ParsedSources = initialProjection.sources;
  let pendingReview: StudioNormalizationReview | undefined;
  const invalidBaseStatuses: Partial<Record<StudioDocumentKind, StudioSessionSnapshot['status']>> = {};
  let current = immutableSnapshot({
    invalidDrafts: {},
    project: initialProject,
    projection: {
      diagnostics: initialProjection.diagnostics,
      document: initialProjection.document,
      sourceRevision: stableProjectSourceRevision(initialProject)
    },
    selection: [],
    status: 'saved'
  });

  function invalidResult(kind: StudioDocumentKind, text: string, diagnostics: StudioDiagnostic[]): StudioSessionUpdateResult {
    if (!current.invalidDrafts[kind]) invalidBaseStatuses[kind] = current.status;
    const invalidDraft: StudioInvalidDraft = {
      diagnostics,
      document: kind,
      text
    };
    current = immutableSnapshot({
      ...current,
      invalidDrafts: { ...current.invalidDrafts, [kind]: invalidDraft },
      status: 'invalid-draft'
    });
    return { diagnostics, snapshot: current, status: 'invalid' };
  }

  function rejectedResult(diagnostics: StudioDiagnostic[]): StudioSessionUpdateResult {
    return { diagnostics, snapshot: current, status: 'invalid' };
  }

  function valueWithChange(root: unknown, path: StudioYamlPath, value: unknown): unknown {
    if (path.length === 0) return value;
    const [segment, ...rest] = path;
    if (typeof segment === 'number') {
      const next = Array.isArray(root) ? [...root] : [];
      next[segment] = valueWithChange(next[segment], rest, value);
      return next;
    }
    const next = root && typeof root === 'object' && !Array.isArray(root) ? { ...(root as Record<string, unknown>) } : {};
    next[segment] = valueWithChange(next[segment], rest, value);
    return next;
  }

  function isSafeSemanticScalar(kind: StudioDocumentKind, path: StudioYamlPath, value: unknown) {
    if (kind !== 'topology') return false;
    const [root, collection, index, field] = path;
    const graphCollection = root === 'graph' && ['nodes', 'links', 'paths', 'regions'].includes(String(collection));
    const diagramCollection = root === 'diagram' && ['shapes', 'callouts'].includes(String(collection));
    if (!(graphCollection || diagramCollection) || typeof index !== 'number') return false;
    if (field === 'name' && path.length === 4) return typeof value === 'string' && Boolean(value.trim());
    if (field === 'labels' && path[4] === 'name' && path.length === 5) return typeof value === 'string' && Boolean(value.trim());
    if (root === 'graph' && collection === 'nodes' && field === 'position' && path.length === 5 && (path[4] === 0 || path[4] === 1)) return typeof value === 'number' && Number.isFinite(value);
    return false;
  }

  function commitApplied(
    kind: StudioDocumentKind,
    text: string,
    beforeText: string,
    nextProject: StudioProject,
    nextSources: ParsedSources,
    document: StudioSessionSnapshot['projection']['document'],
    diagnostics: StudioDiagnostic[],
    path?: StudioYamlPath
  ): StudioSessionUpdateResult {
    sources = nextSources;
    pendingReview = undefined;
    const revision = stableProjectSourceRevision(nextProject);
    const invalidDrafts = { ...current.invalidDrafts };
    delete invalidDrafts[kind];
    delete invalidBaseStatuses[kind];
    current = immutableSnapshot({
      ...current,
      invalidDrafts,
      project: nextProject,
      projection: { diagnostics, document, sourceRevision: revision },
      status: 'modified'
    });
    return {
      change: {
        afterText: text,
        beforeText,
        document: kind,
        path,
        sourceRevision: revision
      },
      snapshot: current,
      status: 'applied'
    };
  }

  function projectWithText(kind: StudioDocumentKind, text: string): StudioProject | undefined {
    const existing = current.project.documents[kind];
    if (!existing) return undefined;
    return {
      ...current.project,
      documents: {
        ...current.project.documents,
        [kind]: sourceDocument(existing, text)
      }
    } as StudioProject;
  }

  function applySafeSemanticScalar(kind: StudioDocumentKind, path: StudioYamlPath, value: unknown, prepared: NonNullable<ReturnType<typeof prepareSurgicalScalarEdit>>): StudioSessionUpdateResult | undefined {
    if (!isSafeSemanticScalar(kind, path, value)) return undefined;
    const nextProject = projectWithText(kind, prepared.text);
    const existing = current.project.documents[kind];
    if (!nextProject || !existing) return undefined;
    prepared.commit();
    const nextSources = {
      ...sources,
      [kind]: prepared.source
    } as ParsedSources;
    const document = valueWithChange(current.projection.document, path, value) as StudioSessionSnapshot['projection']['document'];
    return commitApplied(kind, prepared.text, existing.text, nextProject, nextSources, document, current.projection.diagnostics, path);
  }

  function applySafeSemanticScalars(kind: StudioDocumentKind, edits: Array<{ path: StudioYamlPath; value: unknown }>, prepared: NonNullable<ReturnType<typeof prepareSurgicalScalarEdits>>): StudioSessionUpdateResult | undefined {
    if (!edits.every((edit) => isSafeSemanticScalar(kind, edit.path, edit.value))) return undefined;
    const nextProject = projectWithText(kind, prepared.text);
    const existing = current.project.documents[kind];
    if (!nextProject || !existing) return undefined;
    prepared.commit();
    const nextSources = {
      ...sources,
      [kind]: prepared.source
    } as ParsedSources;
    const document = edits.reduce((value, edit) => valueWithChange(value, edit.path, edit.value), current.projection.document as unknown) as StudioSessionSnapshot['projection']['document'];
    return commitApplied(kind, prepared.text, existing.text, nextProject, nextSources, document, current.projection.diagnostics);
  }

  function applyText(kind: StudioDocumentKind, text: string, path?: StudioYamlPath, preparedSource?: ParsedSources[StudioDocumentKind], commitPreparedSource?: () => void): StudioSessionUpdateResult {
    const existing = current.project.documents[kind];
    if (!existing) {
      return invalidResult(kind, text, [
        {
          code: 'missing-source-document',
          document: kind,
          message: `Cannot edit missing ${kind} source document.`,
          severity: 'error'
        }
      ]);
    }
    const beforeText = existing.text;
    const nextProject = projectWithText(kind, text);
    if (!nextProject) return rejectedResult([]);
    const projection = buildProjection(projectTexts(nextProject), preparedSource ? { ...sources, [kind]: preparedSource } : sources);
    if (!projection.ok) return invalidResult(kind, text, projection.diagnostics);

    commitPreparedSource?.();
    return commitApplied(kind, text, beforeText, nextProject, projection.sources, projection.document, projection.diagnostics, path);
  }

  function applyDocumentLifecycle(kind: StudioDocumentKind, nextProject: StudioProject, beforeText?: string, afterText?: string): StudioSessionUpdateResult {
    const projection = buildProjection(projectTexts(nextProject));
    if (!projection.ok) return rejectedResult(projection.diagnostics);
    sources = projection.sources;
    pendingReview = undefined;
    const revision = stableProjectSourceRevision(nextProject);
    const invalidDrafts = { ...current.invalidDrafts };
    delete invalidDrafts[kind];
    delete invalidBaseStatuses[kind];
    current = immutableSnapshot({
      ...current,
      invalidDrafts,
      project: nextProject,
      projection: {
        diagnostics: projection.diagnostics,
        document: projection.document,
        sourceRevision: revision
      },
      status: 'modified'
    });
    return {
      change: {
        afterText,
        beforeText,
        document: kind,
        sourceRevision: revision
      },
      snapshot: current,
      status: 'applied'
    };
  }

  function applyTextBatch(documents: Partial<Record<StudioDocumentKind, string>>): StudioSessionUpdateResult {
    const entries = (Object.entries(documents) as Array<[StudioDocumentKind, string | undefined]>).filter((entry): entry is [StudioDocumentKind, string] => entry[1] !== undefined);
    if (!entries.length) return rejectedResult([]);
    const missing = entries.find(([kind]) => !current.project.documents[kind]);
    if (missing) {
      return rejectedResult([{ code: 'missing-source-document', document: missing[0], message: `Cannot edit missing ${missing[0]} source document.`, severity: 'error' }]);
    }
    const beforeProject = current.project;
    const nextDocuments: StudioProject['documents'] = { ...beforeProject.documents };
    for (const [kind, text] of entries) {
      const existing = beforeProject.documents[kind];
      if (!existing) continue;
      const nextDocument = sourceDocument(existing, text);
      if (kind === 'topology') nextDocuments.topology = nextDocument;
      if (kind === 'stylesheet') nextDocuments.stylesheet = nextDocument;
      if (kind === 'mapper') nextDocuments.mapper = nextDocument;
    }
    const nextProject = { ...current.project, documents: nextDocuments } as StudioProject;
    const projection = buildProjection(projectTexts(nextProject));
    if (!projection.ok) return rejectedResult(projection.diagnostics);

    sources = projection.sources;
    pendingReview = undefined;
    const invalidDrafts = { ...current.invalidDrafts };
    entries.forEach(([kind]) => {
      delete invalidDrafts[kind];
      delete invalidBaseStatuses[kind];
    });
    const revision = stableProjectSourceRevision(nextProject);
    current = immutableSnapshot({
      ...current,
      invalidDrafts,
      project: nextProject,
      projection: { diagnostics: projection.diagnostics, document: projection.document, sourceRevision: revision },
      status: 'modified'
    });
    const [firstKind, firstText] = entries[0];
    return {
      change: {
        afterText: firstText,
        beforeText: beforeProject.documents[firstKind]?.text,
        document: firstKind,
        sourceRevision: revision
      },
      snapshot: current,
      status: 'applied'
    };
  }

  return {
    confirmNormalization(reviewId) {
      if (!pendingReview || pendingReview.id !== reviewId) {
        return rejectedResult([
          {
            code: 'normalization-review-expired',
            document: 'topology',
            message: 'The normalization review is no longer current.',
            severity: 'error'
          }
        ]);
      }
      return applyText(pendingReview.document, pendingReview.after, pendingReview.path);
    },
    discardInvalidDraft(kind) {
      if (!current.invalidDrafts[kind]) return;
      const invalidDrafts = { ...current.invalidDrafts };
      delete invalidDrafts[kind];
      const remainingInvalid = Object.keys(invalidDrafts).length > 0;
      const fallback = current.project.revision === initialProject.revision ? 'saved' : 'modified';
      const status = remainingInvalid ? 'invalid-draft' : invalidBaseStatuses[kind] || fallback;
      delete invalidBaseStatuses[kind];
      current = immutableSnapshot({ ...current, invalidDrafts, status });
    },
    createDocument(document) {
      if (document.kind !== 'mapper') {
        return rejectedResult([
          {
            code: 'required-source-lifecycle',
            document: document.kind,
            message: `${document.kind} is a required project document and cannot be created through the optional document lifecycle.`,
            severity: 'error'
          }
        ]);
      }
      if (current.project.documents.mapper) {
        return rejectedResult([
          {
            code: 'source-document-exists',
            document: 'mapper',
            message: 'mapper.yaml already exists.',
            severity: 'error'
          }
        ]);
      }
      const nextDocument = sourceDocument(document, document.text);
      const nextProject = {
        ...current.project,
        documents: { ...current.project.documents, mapper: nextDocument }
      };
      return applyDocumentLifecycle('mapper', nextProject, undefined, document.text);
    },
    insertValue(kind, path, value) {
      const source = sources[kind];
      if (!source) {
        return rejectedResult([
          {
            code: 'missing-source-document',
            document: kind,
            message: `Cannot edit missing ${kind} source document.`,
            severity: 'error'
          }
        ]);
      }
      const text = insertSequenceValue(source, path, value);
      return text === undefined
        ? rejectedResult([
            {
              code: 'invalid-insert-path',
              document: kind,
              message: `Cannot append to ${path.join('.')}; the target is not a YAML sequence.`,
              path,
              severity: 'error'
            }
          ])
        : applyText(kind, text, path);
    },
    markSaved(revision, savedAt) {
      current = immutableSnapshot({
        ...current,
        project: {
          ...current.project,
          metadata: { ...current.project.metadata, updatedAt: savedAt },
          revision
        },
        status: 'saved'
      });
    },
    moveSequenceValue(kind, path, from, to) {
      const source = sources[kind];
      if (!source) {
        return rejectedResult([
          {
            code: 'missing-source-document',
            document: kind,
            message: `Cannot edit missing ${kind} source document.`,
            severity: 'error'
          }
        ]);
      }
      const text = moveYamlSequenceValue(source, path, from, to);
      return text === undefined
        ? rejectedResult([
            {
              code: 'invalid-sequence-move',
              document: kind,
              message: `Cannot move ${path.join('.')} item ${from} to ${to}.`,
              path,
              severity: 'error'
            }
          ])
        : applyText(kind, text, path);
    },
    parsedSource(kind) {
      return sources[kind];
    },
    rebaseRevision(revision) {
      current = immutableSnapshot({
        ...current,
        project: { ...current.project, revision },
        status: Object.keys(current.invalidDrafts).length > 0 ? 'invalid-draft' : 'modified'
      });
    },
    replaceDraft(kind, text) {
      return applyText(kind, text);
    },
    replaceDrafts(documents) {
      return applyTextBatch(documents);
    },
    removeValue(kind, path, scopePath) {
      const source = sources[kind];
      if (!source) {
        return rejectedResult([
          {
            code: 'missing-source-document',
            document: kind,
            message: `Cannot edit missing ${kind} source document.`,
            severity: 'error'
          }
        ]);
      }
      const text = removeScopedValue(source, path, scopePath);
      return text === undefined
        ? rejectedResult([
            {
              code: 'invalid-remove-scope',
              document: kind,
              message: `Cannot remove ${path.join('.')} inside ${scopePath.join('.')}.`,
              path,
              severity: 'error'
            }
          ])
        : applyText(kind, text, path);
    },
    removeDocument(kind) {
      if (kind !== 'mapper') {
        return rejectedResult([
          {
            code: 'required-source-removal',
            document: kind,
            message: `${kind} is required and cannot be removed.`,
            severity: 'error'
          }
        ]);
      }
      const existing = current.project.documents.mapper;
      if (!existing) {
        return rejectedResult([
          {
            code: 'source-document-missing',
            document: 'mapper',
            message: 'mapper.yaml does not exist.',
            severity: 'error'
          }
        ]);
      }
      const documents = { ...current.project.documents };
      delete documents.mapper;
      const nextProject = { ...current.project, documents } as StudioProject;
      return applyDocumentLifecycle('mapper', nextProject, existing.text, undefined);
    },
    restore(snapshot) {
      const projection = buildProjection(projectTexts(snapshot.project));
      if (!projection.ok) {
        throw new Error(`Cannot restore invalid Studio snapshot: ${projection.diagnostics.map((item) => item.message).join('; ')}`);
      }
      sources = projection.sources;
      pendingReview = undefined;
      for (const kind of ['topology', 'stylesheet', 'mapper'] as const) delete invalidBaseStatuses[kind];
      current = immutableSnapshot(snapshot);
    },
    semanticIdForPath(kind, path) {
      return semanticIdAtPath(sources, kind, path);
    },
    setValue(kind, path, value) {
      const existing = current.project.documents[kind];
      if (!existing) {
        return invalidResult(kind, '', [
          {
            code: 'missing-source-document',
            document: kind,
            message: `Cannot edit missing ${kind} source document.`,
            severity: 'error'
          }
        ]);
      }
      const parsed = sources[kind] ? { ok: true as const, source: sources[kind] } : parseStudioSource(kind, existing.text);
      if (!parsed.ok) return invalidResult(kind, existing.text, parsed.diagnostics);
      const prepared = prepareSurgicalScalarEdit(parsed.source, path, value);
      if (prepared) {
        const incremental = applySafeSemanticScalar(kind, path, value, prepared);
        return incremental || applyText(kind, prepared.text, path, prepared.source, prepared.commit);
      }
      const surgical = surgicalScalarEdit(parsed.source, path, value);
      if (surgical !== undefined) return applyText(kind, surgical, path);

      const after = normalizedStructuralEdit(parsed.source, path, value);
      pendingReview = {
        after,
        before: existing.text,
        diff: normalizationDiff(existing.text, after),
        document: kind,
        id: `normalize-${kind}-${stableTextHash(`${existing.text}\u0000${after}\u0000${path.join('.')}`)}`,
        path,
        reason: 'This structural edit requires YAML normalization outside an existing scalar range.'
      };
      return {
        review: pendingReview,
        snapshot: current,
        status: 'normalization-required'
      };
    },
    snapshot() {
      return current;
    },
    setSelection(selection) {
      current = immutableSnapshot({ ...current, selection: [...selection] });
    },
    setStatus(status) {
      current = immutableSnapshot({ ...current, status });
    },
    setValues(kind, edits) {
      if (edits.length === 0) return rejectedResult([]);
      const existing = current.project.documents[kind];
      const source = sources[kind];
      if (!existing || !source) {
        return invalidResult(kind, '', [
          {
            code: 'missing-source-document',
            document: kind,
            message: `Cannot edit missing ${kind} source document.`,
            severity: 'error'
          }
        ]);
      }
      const prepared = prepareSurgicalScalarEdits(source, edits);
      if (prepared) {
        const incremental = applySafeSemanticScalars(kind, edits, prepared);
        return incremental || applyText(kind, prepared.text, undefined, prepared.source, prepared.commit);
      }
      const after = normalizedStructuralEdits(source, edits);
      pendingReview = {
        after,
        before: existing.text,
        diff: normalizationDiff(existing.text, after),
        document: kind,
        id: `normalize-${kind}-${stableTextHash(`${existing.text}\u0000${after}\u0000batch`)}`,
        path: edits[0].path,
        reason: 'This structural edit requires YAML normalization outside existing scalar ranges.'
      };
      return {
        review: pendingReview,
        snapshot: current,
        status: 'normalization-required'
      };
    },
    sourcePathForSelection(selection) {
      return sourcePathForSemanticSelection(sources, selection);
    },
    sourcePathAtOffset(kind, offset) {
      const source = sources[kind];
      return source ? sourcePathAtOffset(source, offset) : undefined;
    },
    sourceRange(kind, path) {
      const source = sources[kind];
      return source ? sourceRangeAtPath(source, path) : undefined;
    },
    sourceValue(kind) {
      const value = sources[kind]?.value;
      return value ? structuredClone(value) : undefined;
    },
    upsertValue(kind, path, value, scopePath) {
      const source = sources[kind];
      if (!source) {
        return rejectedResult([
          {
            code: 'missing-source-document',
            document: kind,
            message: `Cannot edit missing ${kind} source document.`,
            severity: 'error'
          }
        ]);
      }
      const text = upsertScopedValue(source, path, value, scopePath);
      return text === undefined
        ? rejectedResult([
            {
              code: 'invalid-upsert-scope',
              document: kind,
              message: `Cannot update ${path.join('.')} inside ${scopePath.join('.')}.`,
              path,
              severity: 'error'
            }
          ])
        : applyText(kind, text, path);
    }
  };
}
