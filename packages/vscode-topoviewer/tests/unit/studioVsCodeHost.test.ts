import { describe, expect, it } from 'vitest';
import type { StudioExternalChange } from 'topoviewer-studio/host';
import { VsCodeStudioHost, type StudioMessageTransport } from '../../src/webview/studioVsCodeHost';

class MemoryTransport implements StudioMessageTransport {
  readonly posted: unknown[] = [];
  private listeners = new Set<(message: unknown) => void>();

  listen(listener: (message: unknown) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  post(message: unknown): void { this.posted.push(message); }
  emit(message: unknown): void { this.listeners.forEach((listener) => listener(message)); }
}

describe('VsCodeStudioHost webview proxy', () => {
  it('correlates typed requests and responses', async () => {
    const transport = new MemoryTransport();
    const host = new VsCodeStudioHost(transport);
    const promise = host.readPreference<string>('studio.theme');
    const request = transport.posted[0] as { id: string; method: string };
    expect(request).toMatchObject({ method: 'readPreference' });
    transport.emit({
      id: request.id,
      result: { ok: true, value: 'dark' },
      type: 'studio:host-response'
    });
    await expect(promise).resolves.toEqual({ ok: true, value: 'dark' });
    host.dispose();
  });

  it('delivers validated watch events and ignores malformed event kinds', () => {
    const transport = new MemoryTransport();
    const host = new VsCodeStudioHost(transport);
    const events: StudioExternalChange[] = [];
    host.watchProject?.((event) => events.push(event));
    transport.emit({
      event: { kind: 'changed', reference: { id: 'workspace' }, revision: 'revision-2' },
      type: 'studio:host-watch'
    });
    transport.emit({ event: { kind: 'execute', reference: { id: 'workspace' } }, type: 'studio:host-watch' });
    expect(events).toEqual([{ kind: 'changed', reference: { id: 'workspace' }, revision: 'revision-2' }]);
    host.dispose();
  });

  it('resolves pending requests as retryable failures when disposed', async () => {
    const transport = new MemoryTransport();
    const host = new VsCodeStudioHost(transport);
    const pending = host.listProjects();
    host.dispose();
    await expect(pending).resolves.toMatchObject({ error: { code: 'unavailable', retryable: true }, ok: false });
  });
});
