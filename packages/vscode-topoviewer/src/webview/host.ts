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

  async loadInitialState(): Promise<WebviewState> {
    const fixtures = await this.listFixtures();
    return this.loadFixture(fixtures[0]?.id || 'layered-network');
  }

  async listFixtures(): Promise<HarnessFixture[]> {
    const response = await fetch('/fixtures');
    if (!response.ok) throw new Error(`Failed to load fixtures: ${response.status}`);
    return response.json();
  }

  async loadFixture(id: string): Promise<WebviewState> {
    const [topology, stylesheet] = await Promise.all([
      fetch(`/fixtures/${id}/topology.yaml`),
      fetch(`/fixtures/${id}/stylesheet.yaml`)
    ]);
    if (!topology.ok || !stylesheet.ok) {
      throw new Error(`Failed to load fixture "${id}".`);
    }
    return {
      fixtureId: id,
      topologyPath: `/fixtures/${id}/topology.yaml`,
      stylesheetPath: `/fixtures/${id}/stylesheet.yaml`,
      topologyText: await topology.text(),
      stylesheetText: await stylesheet.text()
    };
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
