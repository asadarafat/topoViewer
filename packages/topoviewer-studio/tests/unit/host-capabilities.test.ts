import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { BrowserStudioHost } from '../../src/hosts/browserHost';
import { DirectoryStudioHost } from '../../src/hosts/directoryStudioHost';

describe('Studio host presentation capabilities', () => {
  it('describes browser and directory project lifecycles without UI host-kind checks', () => {
    const browser = new BrowserStudioHost({ directoryPicker: undefined, indexedDB: new IDBFactory() });
    const directory = new DirectoryStudioHost({
      displayName: 'Desktop directory',
      hostKind: 'desktop',
      port: {
        copyText: () => Promise.resolve(),
        exportArtifact: () => Promise.resolve(),
        id: 'desktop-token',
        listFiles: () => Promise.resolve([]),
        name: 'Desktop project',
        readFile: () => Promise.resolve(new Uint8Array()),
        readPreference: () => Promise.resolve(undefined),
        readRecovery: () => Promise.resolve(undefined),
        report: () => undefined,
        trusted: true,
        watch: () => () => undefined,
        commitFiles: () => Promise.resolve(),
        writePreference: () => Promise.resolve(),
        writeRecovery: () => Promise.resolve()
      },
      stylesheetPath: 'stylesheet.yaml',
      topologyPath: 'topology.yaml'
    });

    expect(browser.displayName).toBe('Browser storage');
    expect(browser.capabilities.projectCatalog).toBe(true);
    expect(directory.displayName).toBe('Desktop directory');
    expect(directory.capabilities.projectCatalog).toBe(false);
  });
});
