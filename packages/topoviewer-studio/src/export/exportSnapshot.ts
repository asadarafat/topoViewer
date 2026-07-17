import type { StudioProject } from '../contracts/project';
import type { StudioExporter, StudioExportOptions, StudioExportResult, StudioExportSnapshot } from '../contracts/export';

function deepFreeze<Value>(value: Value): Readonly<Value> {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return Object.freeze(value);
}

export function createStudioExportSnapshot(project: StudioProject, sourceRevision: string): StudioExportSnapshot {
  return deepFreeze({
    project: structuredClone(project),
    sourceRevision
  }) as StudioExportSnapshot;
}

export async function runStudioExporter(exporter: StudioExporter, snapshot: StudioExportSnapshot, options: StudioExportOptions): Promise<StudioExportResult> {
  if (exporter.kind !== options.kind) {
    throw new Error(`Exporter ${exporter.kind} cannot produce ${options.kind}.`);
  }
  const before = JSON.stringify(snapshot.project);
  const result = await exporter.export(snapshot, options);
  if (JSON.stringify(snapshot.project) !== before) throw new Error('Exporter mutated the source project.');
  if (result.sourceRevision !== snapshot.sourceRevision) {
    throw new Error('Exporter returned artifacts from a different source revision.');
  }
  return result;
}
