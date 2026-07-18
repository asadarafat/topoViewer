import type {
  StudioAssetContent,
  StudioAssetRequest,
  StudioExportRequest,
  StudioHostEvent
} from 'topoviewer-studio/host';
import type { StudioRecoverySnapshot } from 'topoviewer-studio';
import {
  dispatchStudioHostRequest,
  parseStudioHostReport,
  parseStudioHostRequest,
  type StudioHostResponseMessage,
  type StudioHostWatchMessage
} from '../shared/studioHostProtocol';
import {
  WorkspaceStudioHost,
  type WorkspaceFileEntry,
  type WorkspaceFileWrite,
  type WorkspaceStudioPort
} from '../extension/workspaceStudioHost';

const encoder = new TextEncoder();

class BrowserWorkspacePort implements WorkspaceStudioPort {
  readonly id = 'vscode-test-workspace';
  readonly name = 'VS Code test workspace';
  readonly trusted = true;
  readonly exports: StudioExportRequest[] = [];
  readonly files = new Map<string, Uint8Array>([
    ['topology.yaml', encoder.encode([
      'version: "0.2"',
      'graph:',
      '  id: vscode-test-workspace',
      '  layers:',
      '    - id: physical',
      '      labels: { name: Physical }',
      '    - id: paths',
      '      labels: { name: Paths }',
      '    - id: annotations',
      '      labels: { name: Annotations }',
      '  nodes: []',
      '  links: []',
      '  paths: []',
      '  regions: []',
      'diagram:',
      '  shapes: []',
      '  callouts: []',
      ''
    ].join('\n'))],
    ['stylesheet.yaml', encoder.encode([
      'version: "0.2"',
      'layout:',
      '  mode: manual',
      '  width: 1280',
      '  height: 720',
      'stylesheet:',
      '  - selector: node',
      '    style:',
      '      shape: rectangle',
      '  - selector: link',
      '    style:',
      '      curveStyle: bezier',
      ''
    ].join('\n'))]
  ]);
  private preferences = new Map<string, unknown>();
  private recovery?: StudioRecoverySnapshot;
  private watchers = new Set<(paths: string[]) => void>();

  chooseAssets(_request: StudioAssetRequest): Promise<StudioAssetContent[]> { return Promise.resolve([]); }
  copyText(text: string): Promise<void> { return navigator.clipboard.writeText(text); }
  exportArtifact(request: StudioExportRequest): Promise<void> {
    this.exports.push(structuredClone(request));
    return Promise.resolve();
  }
  listFiles(): Promise<WorkspaceFileEntry[]> {
    return Promise.resolve([...this.files].map(([path, bytes]) => ({
      mediaType: path.endsWith('.yaml') ? 'application/yaml' : 'application/octet-stream',
      modifiedAt: '2026-07-10T08:00:00.000Z',
      path,
      size: bytes.byteLength
    })));
  }
  readFile(path: string): Promise<Uint8Array> {
    const bytes = this.files.get(path);
    return bytes ? Promise.resolve(Uint8Array.from(bytes)) : Promise.reject(new Error(`Missing test-host file: ${path}`));
  }
  readPreference<T>(key: string): Promise<T | undefined> { return Promise.resolve(this.preferences.get(key) as T | undefined); }
  readRecovery(): Promise<StudioRecoverySnapshot | undefined> { return Promise.resolve(this.recovery && structuredClone(this.recovery)); }
  report(_event: StudioHostEvent): void {}
  watch(listener: (paths: string[]) => void): () => void {
    this.watchers.add(listener);
    return () => this.watchers.delete(listener);
  }
  writeFilesAtomically(files: WorkspaceFileWrite[]): Promise<void> {
    files.forEach((file) => this.files.set(file.path, Uint8Array.from(file.bytes)));
    return Promise.resolve();
  }
  writePreference<T>(key: string, value: T): Promise<void> {
    this.preferences.set(key, structuredClone(value));
    return Promise.resolve();
  }
  writeRecovery(snapshot: StudioRecoverySnapshot): Promise<void> {
    this.recovery = structuredClone(snapshot);
    return Promise.resolve();
  }
}

const port = new BrowserWorkspacePort();
const host = new WorkspaceStudioHost({
  mapperPath: 'mapper.yaml',
  now: () => '2026-07-10T08:00:00.000Z',
  port,
  stylesheetPath: 'stylesheet.yaml',
  topologyPath: 'topology.yaml'
});
const unwatch = host.watchProject?.((event) => {
  const message: StudioHostWatchMessage = { event, type: 'studio:host-watch' };
  window.dispatchEvent(new MessageEvent('message', { data: message }));
});

window.acquireVsCodeApi = () => ({
  postMessage(message: unknown) {
    const request = parseStudioHostRequest(message);
    if (request) {
      void dispatchStudioHostRequest(host, request).then((result) => {
        const response: StudioHostResponseMessage = { id: request.id, result, type: 'studio:host-response' };
        window.dispatchEvent(new MessageEvent('message', { data: response }));
      });
      return;
    }
    const report = parseStudioHostReport(message);
    if (report) host.report(report.event);
  }
});

(window as typeof window & {
  __topoviewerVsCodeStudioTest?: {
    exports: StudioExportRequest[];
    source(path: string): string | undefined;
  };
}).__topoviewerVsCodeStudioTest = {
  exports: port.exports,
  source(path) {
    const bytes = port.files.get(path);
    return bytes ? new TextDecoder().decode(bytes) : undefined;
  }
};

window.addEventListener('beforeunload', () => unwatch?.(), { once: true });
await import('../webview/main');
