import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import type { StudioProject, StudioRecoverySnapshot } from '../../src/contracts/project';
import { BrowserProjectStore, BrowserProjectStoreError, browserProjectStoreNames } from '../../src/hosts/browserProjectStore';

function projectFixture(id = 'project-a', revision = 'revision-1'): StudioProject {
  const now = '2026-07-09T08:00:00.000Z';
  return {
    assets: [],
    documents: {
      topology: {
        contentHash: 'topology-v1',
        kind: 'topology',
        path: 'topology.yaml',
        text: 'graph:\n  id: project-a\n  nodes: []\n  links: []\n'
      },
      stylesheet: {
        contentHash: 'stylesheet-v1',
        kind: 'stylesheet',
        path: 'stylesheet.yaml',
        text: 'stylesheet: []\n'
      }
    },
    id,
    metadata: { createdAt: now, profileVersion: 1, schemaVersion: 1, updatedAt: now },
    name: 'Project A',
    revision
  };
}

function recovery(project: StudioProject, capturedAt: string): StudioRecoverySnapshot {
  return {
    capturedAt,
    project,
    reason: 'autosave',
    sourceRevision: `source-${capturedAt}`
  };
}

function store(options: Partial<ConstructorParameters<typeof BrowserProjectStore>[0]> = {}) {
  return new BrowserProjectStore({
    databaseName: `studio-test-${crypto.randomUUID()}`,
    indexedDB: new IDBFactory(),
    now: () => '2026-07-09T08:30:00.000Z',
    ...options
  });
}

describe('BrowserProjectStore', () => {
  it('creates, opens, lists, and revision-checks atomic project saves', async () => {
    const repository = store();
    const initial = projectFixture();
    await repository.createProject(initial);

    expect(await repository.loadProject(initial.id)).toMatchObject({
      ...initial,
      documents: {
        stylesheet: { ...initial.documents.stylesheet, contentHash: expect.stringMatching(/^fnv1a-/) },
        topology: { ...initial.documents.topology, contentHash: expect.stringMatching(/^fnv1a-/) }
      }
    });
    expect(await repository.listProjects()).toEqual([
      expect.objectContaining({
        id: initial.id,
        name: initial.name,
        revision: initial.revision
      })
    ]);

    const next = structuredClone(initial);
    next.name = 'Renamed project';
    const saved = await repository.saveProject({ expectedRevision: initial.revision, project: next });
    expect(saved.revision).not.toBe(initial.revision);
    expect((await repository.loadProject(initial.id)).name).toBe('Renamed project');

    await expect(repository.saveProject({ expectedRevision: initial.revision, project: next })).rejects.toMatchObject({ code: 'conflict' });
  });

  it('rolls back an interrupted transaction without replacing the prior project', async () => {
    let fail = false;
    const repository = store({
      beforeCommit: (operation) => {
        if (fail && operation === 'save the project') throw new DOMException('Interrupted write', 'AbortError');
      }
    });
    const initial = projectFixture();
    await repository.createProject(initial);
    fail = true;
    const changed = { ...initial, name: 'Must not persist' };

    await expect(repository.saveProject({ expectedRevision: initial.revision, project: changed })).rejects.toMatchObject({ code: 'unavailable' });
    expect((await repository.loadProject(initial.id)).name).toBe(initial.name);
  });

  it('keeps only the newest bounded recovery snapshots', async () => {
    const repository = store({ recoveryLimit: 3 });
    const project = projectFixture();
    await repository.createProject(project);
    for (let index = 0; index < 5; index += 1) {
      await repository.saveRecovery(recovery(project, `2026-07-09T08:0${index}:00.000Z`));
    }

    const snapshots = await repository.recoverySnapshots(project.id);
    expect(snapshots).toHaveLength(3);
    expect(snapshots.map((snapshot) => snapshot.capturedAt)).toEqual(['2026-07-09T08:04:00.000Z', '2026-07-09T08:03:00.000Z', '2026-07-09T08:02:00.000Z']);
  });

  it('discards recovery snapshots without deleting the saved project', async () => {
    const repository = store();
    const project = projectFixture();
    await repository.createProject(project);
    await repository.saveRecovery(recovery(project, '2026-07-09T08:01:00.000Z'));

    await repository.discardRecoverySnapshots(project.id);

    expect(await repository.recoverySnapshots(project.id)).toEqual([]);
    expect((await repository.loadProject(project.id)).id).toBe(project.id);
  });

  it('backs up and migrates an older project before returning it', async () => {
    const repository = store();
    const old = projectFixture();
    old.metadata.schemaVersion = 0;
    await repository.createProject(old, { allowLegacy: true });

    const migrated = await repository.loadProject(old.id);
    expect(migrated.metadata.schemaVersion).toBe(1);
    expect((await repository.recoverySnapshots(old.id))[0]).toMatchObject({
      project: { metadata: { schemaVersion: 0 } },
      reason: 'before-migration'
    });
  });

  it('rejects corrupt project records without blanking other projects', async () => {
    const indexedDB = new IDBFactory();
    const databaseName = `studio-test-${crypto.randomUUID()}`;
    const repository = store({ databaseName, indexedDB });
    const healthy = projectFixture('healthy');
    await repository.createProject(healthy);

    const request = indexedDB.open(databaseName);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction(browserProjectStoreNames.projects, 'readwrite');
    transaction.objectStore(browserProjectStoreNames.projects).put({ id: 'corrupt', project: { nope: true } });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();

    await expect(repository.loadProject('corrupt')).rejects.toBeInstanceOf(BrowserProjectStoreError);
    await expect(repository.loadProject('corrupt')).rejects.toMatchObject({ code: 'corrupt-data' });
    expect((await repository.loadProject('healthy')).id).toBe('healthy');
  });

  it('maps quota exhaustion to an actionable typed failure', async () => {
    const repository = store({
      beforeCommit: () => {
        throw new DOMException('Storage full', 'QuotaExceededError');
      }
    });
    await expect(repository.createProject(projectFixture())).rejects.toMatchObject({
      code: 'quota-exceeded',
      retryable: true
    });
  });

  it('deletes one project and can reset the complete browser database', async () => {
    const repository = store();
    await repository.createProject(projectFixture('one'));
    await repository.createProject(projectFixture('two'));
    await repository.deleteProject('one');
    await expect(repository.loadProject('one')).rejects.toMatchObject({ code: 'not-found' });
    expect(await repository.listProjects()).toHaveLength(1);

    await repository.reset();
    expect(await repository.listProjects()).toEqual([]);
  });
});
