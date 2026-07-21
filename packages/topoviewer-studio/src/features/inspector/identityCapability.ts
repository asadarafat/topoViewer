import type { StylesheetDocument, TopoDocument } from 'topoviewer';
import { indexCanonicalIdentityBundle, planCanonicalObjectIdRename, type AuthoringObjectSelection, type CanonicalIdentityRisk } from 'topoviewer/authoring';
import type { StudioCommand, StudioSourceMutation } from '../../contracts/commands';
import type { StudioIdentityRenamePreview } from '../../contracts/inspector';
import type { StudioSelection } from '../../contracts/project';
import type { StudioDocumentSession, StudioYamlPath } from '../../session';
import type { ParsedStudioSource } from '../../session/types';
import { normalizedStructuralEdits, parseStudioSource, prepareSurgicalScalarEdits } from '../../session/yamlSource';

interface StudioCanonicalRenameCommand {
  changed: boolean;
  command: StudioCommand;
  risks: CanonicalIdentityRisk[];
}

export type StudioDraftIdentityChange =
  | { status: 'none' }
  | { changes: number; status: 'ambiguous' }
  | { nextId: string; selection: StudioSelection; status: 'rename' };

function replacementText(source: ParsedStudioSource, edits: Array<{ kind: 'set' | 'upsert'; path: StudioYamlPath; value: unknown }>): string {
  const scalarEdits = edits.map(({ path, value }) => ({ path, value }));
  if (edits.every((edit) => edit.kind === 'set')) {
    const prepared = prepareSurgicalScalarEdits(source, scalarEdits);
    if (prepared) return prepared.text;
  }
  return normalizedStructuralEdits(source, scalarEdits);
}

export function detectStudioDraftIdentityChange(session: StudioDocumentSession, topologyText: string): StudioDraftIdentityChange {
  const parsed = parseStudioSource('topology', topologyText);
  if (!parsed.ok) return { status: 'none' };
  const current = session.sourceValue('topology') as TopoDocument | undefined;
  if (!current) return { status: 'none' };
  const before = indexCanonicalIdentityBundle({ topology: current }).definitions;
  const after = indexCanonicalIdentityBundle({ topology: parsed.source.value as TopoDocument }).definitions;
  if (before.length !== after.length) return { status: 'none' };
  const afterByPath = new Map(after.map((definition) => [`${definition.kind}:${JSON.stringify(definition.path)}`, definition]));
  const changes = before.flatMap((definition) => {
    const next = afterByPath.get(`${definition.kind}:${JSON.stringify(definition.path)}`);
    return next && next.id !== definition.id ? [{ nextId: next.id, selection: { id: definition.id, kind: definition.kind } as StudioSelection }] : [];
  });
  if (changes.length === 0) return { status: 'none' };
  if (changes.length > 1) return { changes: changes.length, status: 'ambiguous' };
  return { ...changes[0], status: 'rename' };
}

function canonicalRenamePlan(session: StudioDocumentSession, selection: StudioSelection, requestedId: string) {
  const topology = session.sourceValue('topology') as TopoDocument | undefined;
  if (!topology) throw new Error('Topology source is unavailable.');
  return planCanonicalObjectIdRename(
    {
      topology,
      stylesheet: session.sourceValue('stylesheet') as StylesheetDocument | undefined,
      mapper: session.sourceValue('mapper')
    },
    selection as AuthoringObjectSelection,
    requestedId
  );
}

export function previewStudioCanonicalRename(session: StudioDocumentSession, selection: StudioSelection, requestedId: string): StudioIdentityRenamePreview {
  const plan = canonicalRenamePlan(session, selection, requestedId);
  return {
    affectedDocuments: new Set(plan.mutations.map((mutation) => mutation.document)).size,
    affectedReferences: plan.mutations.filter((mutation) => mutation.role !== 'definition').length,
    externalRisks: plan.risks.length
  };
}

export function createStudioCanonicalRenameCommand(session: StudioDocumentSession, selection: StudioSelection, requestedId: string, topologyDraftText?: string): StudioCanonicalRenameCommand {
  const plan = canonicalRenamePlan(session, selection, requestedId);
  const byDocument = new Map<'topology' | 'stylesheet' | 'mapper', typeof plan.mutations>();
  for (const mutation of plan.mutations) {
    const mutations = byDocument.get(mutation.document) || [];
    mutations.push(mutation);
    byDocument.set(mutation.document, mutations);
  }
  const mutations: StudioSourceMutation[] = [...byDocument.entries()].map(([document, edits]) => {
    const parsedDraft = document === 'topology' && topologyDraftText !== undefined ? parseStudioSource('topology', topologyDraftText) : undefined;
    if (parsedDraft && !parsedDraft.ok) throw new Error(parsedDraft.diagnostics.map((diagnostic) => diagnostic.message).join('; '));
    const source = parsedDraft?.ok ? parsedDraft.source : session.parsedSource(document);
    if (!source) throw new Error(`${document} source is unavailable.`);
    return { document, kind: 'replace-source', text: replacementText(source, edits) };
  });
  return {
    changed: mutations.length > 0,
    command: {
      id: `rename-${selection.kind}-${selection.id}-to-${plan.nextSelection.id}`,
      label: `Rename ${selection.id} to ${plan.nextSelection.id}`,
      execute: () => ({
        mutations,
        selection: [plan.nextSelection as StudioSelection],
        summary: `Renamed ${selection.id} to ${plan.nextSelection.id}`
      })
    },
    risks: plan.risks
  };
}

interface StudioIdentityActionsOptions {
  execute(command: StudioCommand): boolean;
  session: StudioDocumentSession;
  setAnnouncement(message: string): void;
  setError(message?: string): void;
}

export function createStudioIdentityActions(options: StudioIdentityActionsOptions) {
  return {
    previewObjectIdRename(selection: StudioSelection, requestedId: string): StudioIdentityRenamePreview {
      try {
        return previewStudioCanonicalRename(options.session, selection, requestedId);
      } catch (error) {
        return {
          affectedDocuments: 0,
          affectedReferences: 0,
          error: error instanceof Error ? error.message : String(error),
          externalRisks: 0
        };
      }
    },
    renameObjectId(selection: StudioSelection, requestedId: string) {
      try {
        const rename = createStudioCanonicalRenameCommand(options.session, selection, requestedId);
        if (!rename.changed) return true;
        const applied = options.execute(rename.command);
        if (applied && rename.risks.length) {
          options.setAnnouncement(
            `Renamed ${selection.id} to ${requestedId.trim()}. Review ${rename.risks.length} external telemetry identity ${rename.risks.length === 1 ? 'dependency' : 'dependencies'}.`
          );
        }
        return applied;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        options.setError(message);
        options.setAnnouncement(`Rename rejected: ${message}`);
        return false;
      }
    }
  };
}
