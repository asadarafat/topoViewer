import { describe, expect, it } from 'vitest';
import type {
  StudioAssetContent,
  StudioExportRequest,
  StudioExternalChange,
  StudioHost
} from '../src/contracts/host';
import type { StudioProject } from '../src/contracts/project';

export interface StudioHostConformanceFixture {
  chosenAsset: StudioAssetContent;
  dispose?(): Promise<void> | void;
  exported: StudioExportRequest[];
  host: StudioHost;
  replaceDiskProject(project: StudioProject): Promise<void>;
  triggerExternalChange(event: StudioExternalChange): Promise<void> | void;
}

export type StudioHostConformanceFactory = () => Promise<StudioHostConformanceFixture> | StudioHostConformanceFixture;

export function defineStudioHostConformance(name: string, createFixture: StudioHostConformanceFactory) {
  describe(`${name} StudioHost conformance`, () => {
    it('loads, lists, revision-checks, and preserves disk state after a stale save', async () => {
      const fixture = await createFixture();
      try {
        const loaded = await fixture.host.loadProject();
        expect(loaded.ok).toBe(true);
        if (!loaded.ok) return;

        const listed = await fixture.host.listProjects();
        expect(listed).toMatchObject({ ok: true, value: [expect.objectContaining({ id: loaded.value.project.id })] });

        const changed = structuredClone(loaded.value.project);
        changed.name = 'Conformance save';
        changed.documents.topology.text += '# conformance save\n';
        const saved = await fixture.host.saveProject({
          expectedRevision: loaded.value.project.revision,
          project: changed
        });
        expect(saved.ok).toBe(true);
        if (!saved.ok) return;
        expect(saved.value.revision).not.toBe(loaded.value.project.revision);

        const stale = structuredClone(changed);
        stale.name = 'Must not replace disk state';
        const conflict = await fixture.host.saveProject({
          expectedRevision: loaded.value.project.revision,
          project: stale
        });
        expect(conflict).toMatchObject({
          error: { code: 'conflict', retryable: true },
          ok: false
        });
        const afterConflict = await fixture.host.loadProject();
        expect(afterConflict).toMatchObject({
          ok: true,
          value: { project: { documents: { topology: { text: expect.stringContaining('# conformance save') } } } }
        });
      } finally {
        await fixture.dispose?.();
      }
    });

    it('round-trips preferences, selected assets, project assets, and exports', async () => {
      const fixture = await createFixture();
      try {
        expect(await fixture.host.writePreference('studio.color-mode', 'dark')).toEqual({
          ok: true,
          value: undefined
        });
        expect(await fixture.host.readPreference('studio.color-mode')).toEqual({
          ok: true,
          value: 'dark'
        });

        expect(fixture.host.chooseAssets).toBeTypeOf('function');
        const selected = await fixture.host.chooseAssets?.({ accept: ['image/svg+xml'], maximumBytes: 1024, multiple: false });
        expect(selected).toEqual({ ok: true, value: { assets: [fixture.chosenAsset] } });

        const loaded = await fixture.host.loadProject();
        expect(loaded.ok).toBe(true);
        if (!loaded.ok) return;
        const assets = await fixture.host.readProjectAssets({ id: loaded.value.project.id });
        expect(assets).toMatchObject({ ok: true });

        const request: StudioExportRequest = {
          artifact: fixture.chosenAsset,
          kind: 'svg',
          suggestedName: 'conformance.svg'
        };
        expect(await fixture.host.exportArtifact(request)).toEqual({ ok: true, value: undefined });
        expect(fixture.exported).toEqual([request]);
      } finally {
        await fixture.dispose?.();
      }
    });

    it('delivers watch events and supports inspect, keep-draft, and reload-disk decisions without mutation', async () => {
      const fixture = await createFixture();
      try {
        const initial = await fixture.host.loadProject();
        expect(initial.ok).toBe(true);
        if (!initial.ok) return;
        const localDraft = structuredClone(initial.value.project);
        localDraft.name = 'Unsaved Studio draft';
        localDraft.documents.topology.text += '# local Studio draft\n';

        const disk = structuredClone(initial.value.project);
        disk.name = 'External disk edit';
        disk.documents.topology.text += '# external disk edit\n';
        disk.revision = 'external-revision';
        await fixture.replaceDiskProject(disk);

        const events: StudioExternalChange[] = [];
        const unwatch = fixture.host.watchProject?.((event) => events.push(event));
        expect(unwatch).toBeTypeOf('function');
        await fixture.triggerExternalChange({
          kind: 'changed',
          reference: { id: disk.id, revision: disk.revision },
          revision: disk.revision
        });
        expect(events).toEqual([expect.objectContaining({
          kind: 'changed',
          revision: expect.not.stringMatching(initial.value.project.revision)
        })]);

        // Inspect reads disk without replacing the in-memory draft. Keep-draft is
        // therefore a no-op; reload-disk explicitly adopts the loaded project.
        const inspected = await fixture.host.loadProject({ id: disk.id });
        expect(inspected).toMatchObject({
          ok: true,
          value: { project: { documents: { topology: { text: expect.stringContaining('# external disk edit') } } } }
        });
        expect(localDraft.name).toBe('Unsaved Studio draft');
        expect(localDraft.documents.topology.text).toContain('# local Studio draft');
        const reloaded = inspected.ok ? inspected.value.project : undefined;
        expect(reloaded?.documents.topology.text).toContain('# external disk edit');

        unwatch?.();
        await fixture.triggerExternalChange({ kind: 'deleted', reference: { id: disk.id } });
        expect(events).toHaveLength(1);
      } finally {
        await fixture.dispose?.();
      }
    });

    it('returns typed failures for invalid references and bounded asset requests', async () => {
      const fixture = await createFixture();
      try {
        const missing = await fixture.host.loadProject({ id: 'missing-project' });
        expect(missing).toMatchObject({
          error: { code: 'not-found', message: expect.any(String), retryable: false },
          ok: false
        });
        const oversized = await fixture.host.chooseAssets?.({ accept: ['image/svg+xml'], maximumBytes: 1, multiple: false });
        expect(oversized).toMatchObject({
          error: { code: 'quota-exceeded', message: expect.any(String), retryable: false },
          ok: false
        });
      } finally {
        await fixture.dispose?.();
      }
    });
  });
}
