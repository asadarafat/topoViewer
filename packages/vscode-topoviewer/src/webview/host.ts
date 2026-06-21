import { validateSources } from '../shared/validation';
import type { HarnessFixture, TopoViewerWebviewHost, ValidationResult, WebviewState } from '../shared/types';

declare global {
  interface Window {
    acquireVsCodeApi?: () => {
      postMessage(message: unknown): void;
    };
  }
}

type PendingResolver = (state: WebviewState) => void;

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
          resolve({ topologyText: 'graph:\n  nodes: []\n', stylesheetText: 'stylesheet: []\n' });
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

  exportImage(): Promise<void> {
    this.vscode?.postMessage({ type: 'exportImage' });
    return Promise.resolve();
  }
}

export class BrowserHarnessHostAdapter implements TopoViewerWebviewHost {
  readonly kind = 'browser' as const;
  private readonly customFixtureIndexKey = 'topoviewer.vscodeHarness.customFixtures.v1';
  private readonly activeFixtureKey = 'topoviewer.vscodeHarness.activeFixture.v1';
  private readonly stateStoragePrefix = 'topoviewer.vscodeHarness.fixtureState.v1:';

  async loadInitialState(): Promise<WebviewState> {
    const fixtures = await this.listFixtures();
    const activeFixtureId = window.localStorage.getItem(this.activeFixtureKey);
    const fixtureId = activeFixtureId && fixtures.some((fixture) => fixture.id === activeFixtureId)
      ? activeFixtureId
      : fixtures[0]?.id || 'layered-network';
    return this.loadFixture(fixtureId);
  }

  async listFixtures(): Promise<HarnessFixture[]> {
    const response = await fetch('/fixtures');
    if (!response.ok) throw new Error(`Failed to load fixtures: ${response.status}`);
    const templates = await response.json() as HarnessFixture[];
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
        topologyText: savedState.topologyText,
        stylesheetText: savedState.stylesheetText
      };
    }

    const [topology, stylesheet] = await Promise.all([
      fetch(`/fixtures/${id}/topology.yaml`),
      fetch(`/fixtures/${id}/stylesheet.yaml`)
    ]);
    if (!topology.ok || !stylesheet.ok) {
      throw new Error(`Failed to load fixture "${id}".`);
    }
    const baseState = {
      fixtureId: id,
      topologyPath: `/fixtures/${id}/topology.yaml`,
      stylesheetPath: `/fixtures/${id}/stylesheet.yaml`,
      topologyText: await topology.text(),
      stylesheetText: await stylesheet.text()
    };
    const savedState = this.loadSavedState(id);
    window.localStorage.setItem(this.activeFixtureKey, id);
    return savedState
      ? {
        ...baseState,
        topologyText: savedState.topologyText,
        stylesheetText: savedState.stylesheetText
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
      stylesheetText: 'stylesheet: []\n'
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
    const fixtureId = state.fixtureId;
    if (!fixtureId) return;
    try {
      window.localStorage.setItem(this.activeFixtureKey, fixtureId);
      window.localStorage.setItem(this.storageKey(fixtureId), JSON.stringify({
        fixtureId,
        topologyText: state.topologyText,
        stylesheetText: state.stylesheetText
      }));
    } catch {
      // Local browser persistence is best effort for the harness.
    }
  }

  private storageKey(fixtureId: string): string {
    return `${this.stateStoragePrefix}${fixtureId}`;
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

  private loadSavedState(fixtureId: string): Pick<WebviewState, 'topologyText' | 'stylesheetText'> | undefined {
    try {
      const raw = window.localStorage.getItem(this.storageKey(fixtureId));
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as Partial<WebviewState>;
      if (typeof parsed.topologyText !== 'string' || typeof parsed.stylesheetText !== 'string') return undefined;
      return {
        topologyText: parsed.topologyText,
        stylesheetText: parsed.stylesheetText
      };
    } catch {
      return undefined;
    }
  }

  async validate(state: WebviewState): Promise<ValidationResult> {
    const response = await fetch('/validate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(state)
    });
    if (!response.ok) throw new Error(`Validation failed: ${response.status}`);
    return response.json();
  }

  openDocs(target: string): Promise<void> {
    window.open(`/${target}`, '_blank', 'noopener,noreferrer');
    return Promise.resolve();
  }

  exportImage(): Promise<void> {
    window.dispatchEvent(new CustomEvent('topoviewer-export-mock'));
    return Promise.resolve();
  }
}
