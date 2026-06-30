import { validateSources } from '../shared/validation';
import type { ExportImagePayload, HarnessFixture, TopoViewerWebviewHost, ValidationResult, WebviewState } from '../shared/types';

declare global {
  interface Window {
    acquireVsCodeApi?: () => {
      postMessage(message: unknown): void;
    };
  }
}

type PendingResolver = (state: WebviewState) => void;

export function exportViewportMessage(payload: ExportImagePayload) {
  return { type: 'exportViewport' as const, ...payload };
}

function defaultMapperText(sourceId = 'topoviewer') {
  return [
    'version: 1',
    'identity:',
    `  sourceId: ${sourceId}`,
    '  sourceIdLabel: source_id',
    'rules: []',
    ''
  ].join('\n');
}

export class VsCodeHostAdapter implements TopoViewerWebviewHost {
  readonly kind = 'vscode' as const;
  private readonly vscode = window.acquireVsCodeApi?.();
  private pendingState: PendingResolver[] = [];
  private latestState: WebviewState | undefined;

  constructor() {
    window.addEventListener('message', (event) => {
      const message = event.data || {};
      if (message.type === 'state') {
        this.latestState = message.state;
        const pending = this.pendingState;
        this.pendingState = [];
        pending.forEach((resolve) => resolve(message.state));
      }
    });
  }

  loadInitialState(): Promise<WebviewState> {
    if (this.latestState) return Promise.resolve(this.latestState);
    this.vscode?.postMessage({ type: 'ready' });
    return new Promise((resolve) => {
      this.pendingState.push(resolve);
      window.setTimeout(() => {
        if (!this.latestState) {
          resolve({
            topologyText: 'graph:\n  nodes: []\n',
            stylesheetText: 'stylesheet: []\n',
            mapperText: defaultMapperText()
          });
        }
      }, 1500);
    });
  }

  validate(state: WebviewState): Promise<ValidationResult> {
    return Promise.resolve(validateSources(state));
  }

  openDocs(target: string): Promise<void> {
    this.vscode?.postMessage({ type: 'openDocs', target });
    return Promise.resolve();
  }

  exportImage(payload: ExportImagePayload): Promise<void> {
    this.vscode?.postMessage(exportViewportMessage(payload));
    return Promise.resolve();
  }
}

export class BrowserHarnessHostAdapter implements TopoViewerWebviewHost {
  readonly kind = 'browser' as const;
  private readonly customFixtureIndexKey = 'topoviewer.vscodeHarness.customFixtures.v1';
  private readonly activeFixtureKey = 'topoviewer.vscodeHarness.activeFixture.v1';
  private readonly stateStoragePrefix = 'topoviewer.vscodeHarness.fixtureState.v1:';

  async loadInitialState(): Promise<WebviewState> {
    const urlState = await this.loadStateFromUrl();
    if (urlState) return urlState;

    const fixtures = await this.listFixtures();
    const activeFixtureId = window.localStorage.getItem(this.activeFixtureKey);
    const fixtureId = activeFixtureId && fixtures.some((fixture) => fixture.id === activeFixtureId)
      ? activeFixtureId
      : fixtures[0]?.id || 'layered-network';
    return this.loadFixture(fixtureId);
  }

  async listFixtures(): Promise<HarnessFixture[]> {
    let templates: HarnessFixture[];
    try {
      const response = await fetch(this.assetUrl('fixtures/index.json'));
      if (!response.ok) throw new Error(`Failed to load fixture index: ${response.status}`);
      templates = await response.json() as HarnessFixture[];
    } catch {
      const response = await fetch('/fixtures');
      if (!response.ok) throw new Error(`Failed to load fixtures: ${response.status}`);
      templates = await response.json() as HarnessFixture[];
    }
    return [
      ...templates.map((fixture) => ({ ...fixture, kind: 'template' as const })),
      ...this.loadCustomFixtures()
    ];
  }

  async loadFixture(id: string): Promise<WebviewState> {
    if (this.isCustomFixture(id)) {
      const fixture = this.loadCustomFixtures().find((candidate) => candidate.id === id);
      const savedState = this.loadSavedState(id);
      if (!fixture || !savedState) throw new Error(`Saved topology "${id}" is no longer available.`);
      window.localStorage.setItem(this.activeFixtureKey, id);
      return {
        fixtureId: id,
        topologyPath: `local://${id}/topology.yaml`,
        stylesheetPath: `local://${id}/stylesheet.yaml`,
        mapperPath: `local://${id}/mapper.tv.yaml`,
        topologyText: savedState.topologyText,
        stylesheetText: savedState.stylesheetText,
        mapperText: savedState.mapperText
      };
    }

    const [topology, stylesheet, mapper] = await Promise.all([
      fetch(this.assetUrl(`fixtures/${id}/topology.yaml`)),
      fetch(this.assetUrl(`fixtures/${id}/stylesheet.yaml`)),
      fetch(this.assetUrl(`fixtures/${id}/mapper.yaml`))
    ]);
    if (!topology.ok || !stylesheet.ok) {
      throw new Error(`Failed to load fixture "${id}".`);
    }
    const baseState = {
      fixtureId: id,
      topologyPath: this.assetUrl(`fixtures/${id}/topology.yaml`),
      stylesheetPath: this.assetUrl(`fixtures/${id}/stylesheet.yaml`),
      mapperPath: this.assetUrl(`fixtures/${id}/mapper.yaml`),
      topologyText: await topology.text(),
      stylesheetText: await stylesheet.text(),
      mapperText: mapper.ok ? await mapper.text() : defaultMapperText(id)
    };
    const savedState = this.isParityMode() ? undefined : this.loadSavedState(id);
    if (!this.isParityMode()) {
      window.localStorage.setItem(this.activeFixtureKey, id);
    }
    return savedState
      ? {
        ...baseState,
        topologyText: savedState.topologyText,
        stylesheetText: savedState.stylesheetText,
        mapperText: savedState.mapperText
      }
      : baseState;
  }

  async createTopology(): Promise<WebviewState> {
    const customFixtures = this.loadCustomFixtures();
    const fixture: HarnessFixture = {
      id: `custom-${Date.now()}`,
      kind: 'saved',
      name: `Custom topology ${customFixtures.length + 1}`
    };
    this.saveCustomFixtures([...customFixtures, fixture]);
    const state: WebviewState = {
      fixtureId: fixture.id,
      topologyPath: `local://${fixture.id}/topology.yaml`,
      stylesheetPath: `local://${fixture.id}/stylesheet.yaml`,
      mapperPath: `local://${fixture.id}/mapper.tv.yaml`,
      topologyText: [
        'graph:',
        '  id: custom-topology',
        '  layers:',
        '    - id: default',
        '      name: Default',
        '  nodes: []',
        '  links: []',
        '  paths: []',
        '  regions: []',
        ''
      ].join('\n'),
      stylesheetText: 'stylesheet: []\n',
      mapperText: defaultMapperText('custom-topology')
    };
    this.saveState(state);
    return state;
  }

  async revertState(state: WebviewState): Promise<WebviewState> {
    const fixtureId = state.fixtureId;
    if (!fixtureId) return state;
    window.localStorage.removeItem(this.storageKey(fixtureId));
    if (this.isCustomFixture(fixtureId)) {
      this.saveCustomFixtures(this.loadCustomFixtures().filter((fixture) => fixture.id !== fixtureId));
      window.localStorage.removeItem(this.activeFixtureKey);
      return this.loadInitialState();
    }
    return this.loadFixture(fixtureId);
  }

  saveState(state: WebviewState): void {
    if (this.isParityMode()) return;
    const fixtureId = state.fixtureId;
    if (!fixtureId) return;
    try {
      window.localStorage.setItem(this.activeFixtureKey, fixtureId);
      window.localStorage.setItem(this.storageKey(fixtureId), JSON.stringify({
        fixtureId,
        topologyText: state.topologyText,
        stylesheetText: state.stylesheetText,
        mapperText: state.mapperText || defaultMapperText(fixtureId)
      }));
    } catch {
      // Local browser persistence is best effort for the harness.
    }
  }

  private storageKey(fixtureId: string): string {
    return `${this.stateStoragePrefix}${fixtureId}`;
  }

  private isParityMode(): boolean {
    return new URLSearchParams(window.location.search).get('parity') === '1';
  }

  private async loadStateFromUrl(): Promise<WebviewState | undefined> {
    const params = new URLSearchParams(window.location.search);
    if (params.get('parity') !== '1') return undefined;

    const fixtureId = params.get('fixture');
    if (fixtureId) {
      return this.loadFixture(fixtureId);
    }

    const topologyPath = params.get('topology');
    const stylesheetPath = params.get('stylesheet');
    const mapperPath = params.get('mapper');
    if (!topologyPath) return undefined;

    const topologyUrl = new URL(topologyPath, window.location.href).toString();
    const stylesheetUrl = stylesheetPath ? new URL(stylesheetPath, window.location.href).toString() : undefined;
    const mapperUrl = mapperPath ? new URL(mapperPath, window.location.href).toString() : undefined;
    const [topology, stylesheet, mapper] = await Promise.all([
      fetch(topologyUrl),
      stylesheetUrl ? fetch(stylesheetUrl) : Promise.resolve(undefined),
      mapperUrl ? fetch(mapperUrl) : Promise.resolve(undefined)
    ]);
    if (!topology.ok || (stylesheet && !stylesheet.ok) || (mapper && !mapper.ok)) {
      throw new Error('Failed to load parity topology, stylesheet, or mapper.');
    }
    return {
      fixtureId: params.get('id') || 'renderer-parity',
      topologyPath: topologyUrl,
      stylesheetPath: stylesheetUrl,
      mapperPath: mapperUrl,
      topologyText: await topology.text(),
      stylesheetText: stylesheet ? await stylesheet.text() : '',
      mapperText: mapper ? await mapper.text() : defaultMapperText(params.get('id') || 'renderer-parity')
    };
  }

  private isCustomFixture(fixtureId: string): boolean {
    return this.loadCustomFixtures().some((fixture) => fixture.id === fixtureId);
  }

  private loadCustomFixtures(): HarnessFixture[] {
    try {
      const raw = window.localStorage.getItem(this.customFixtureIndexKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as HarnessFixture[];
      return Array.isArray(parsed)
        ? parsed
          .filter((fixture) => fixture?.id && fixture?.name)
          .map((fixture) => ({ ...fixture, kind: 'saved' as const }))
        : [];
    } catch {
      return [];
    }
  }

  private saveCustomFixtures(fixtures: HarnessFixture[]): void {
    window.localStorage.setItem(this.customFixtureIndexKey, JSON.stringify(fixtures.map((fixture) => ({
      id: fixture.id,
      kind: 'saved',
      name: fixture.name
    }))));
  }

  private loadSavedState(fixtureId: string): Pick<WebviewState, 'mapperText' | 'topologyText' | 'stylesheetText'> | undefined {
    try {
      const raw = window.localStorage.getItem(this.storageKey(fixtureId));
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as Partial<WebviewState>;
      if (typeof parsed.topologyText !== 'string' || typeof parsed.stylesheetText !== 'string') return undefined;
      return {
        topologyText: parsed.topologyText,
        stylesheetText: parsed.stylesheetText,
        mapperText: typeof parsed.mapperText === 'string' ? parsed.mapperText : defaultMapperText(fixtureId)
      };
    } catch {
      return undefined;
    }
  }

  async validate(state: WebviewState): Promise<ValidationResult> {
    return Promise.resolve(validateSources(state));
  }

  openDocs(target: string): Promise<void> {
    window.open(new URL(`../${target.replace(/^\/+/, '')}`, this.pageBaseUrl()).toString(), '_blank', 'noopener,noreferrer');
    return Promise.resolve();
  }

  exportImage(_payload: ExportImagePayload): Promise<void> {
    return Promise.resolve();
  }

  private assetUrl(path: string): string {
    return new URL(path.replace(/^\/+/, ''), this.pageBaseUrl()).toString();
  }

  private pageBaseUrl(): URL {
    const base = new URL(window.location.href);
    base.search = '';
    base.hash = '';
    if (base.pathname.endsWith('/index.html')) {
      base.pathname = base.pathname.slice(0, -'index.html'.length);
    } else if (!base.pathname.endsWith('/')) {
      base.pathname = `${base.pathname}/`;
    }
    return base;
  }
}
