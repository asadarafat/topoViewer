import { describe, expect, it, vi } from 'vitest';
import type { StudioHost } from 'topoviewer-studio/host';
import {
  dispatchStudioHostRequest,
  parseStudioHostReport,
  parseStudioHostRequest,
  parseStudioHostResponse,
  parseStudioHostWatch
} from '../../src/shared/studioHostProtocol';

describe('Studio VS Code host protocol', () => {
  it('accepts only bounded requests with known methods and valid argument shapes', () => {
    expect(parseStudioHostRequest({
      args: [],
      id: 'request-1',
      method: 'listProjects',
      type: 'studio:host-request'
    })).toMatchObject({ id: 'request-1', method: 'listProjects' });
    expect(parseStudioHostRequest({
      args: [],
      id: 'request-2',
      method: 'executeCommand',
      type: 'studio:host-request'
    })).toBeUndefined();
    expect(parseStudioHostRequest({
      args: [{ accept: [], maximumBytes: -1, multiple: false }],
      id: 'request-3',
      method: 'chooseAssets',
      type: 'studio:host-request'
    })).toBeUndefined();
    expect(parseStudioHostRequest({
      args: [{ bytes: new Uint8Array(32 * 1024 * 1024 + 1) }],
      id: 'request-4',
      method: 'saveProject',
      type: 'studio:host-request'
    })).toBeUndefined();
  });

  it('rejects malformed responses and reports', () => {
    expect(parseStudioHostResponse({
      id: 'request-1',
      result: { ok: true, value: [] },
      type: 'studio:host-response'
    })).toBeDefined();
    expect(parseStudioHostResponse({ id: 'request-1', result: { ok: false }, type: 'studio:host-response' })).toBeUndefined();
    expect(parseStudioHostReport({
      event: { category: 'security', name: 'workspace-denied' },
      type: 'studio:host-report'
    })).toBeDefined();
    expect(parseStudioHostReport({
      event: { category: 'command-execution', name: 'run-shell' },
      type: 'studio:host-report'
    })).toBeUndefined();
    expect(parseStudioHostWatch({
      event: { kind: 'changed', reference: { id: 'workspace' }, revision: 'revision-2' },
      type: 'studio:host-watch'
    })).toBeDefined();
    expect(parseStudioHostWatch({
      event: { kind: 'execute', reference: { id: 'workspace' } },
      type: 'studio:host-watch'
    })).toBeUndefined();
  });

  it('dispatches only through the typed StudioHost surface', async () => {
    const listProjects = vi.fn().mockResolvedValue({ ok: true, value: [] });
    const host = { listProjects } as unknown as StudioHost;
    const request = parseStudioHostRequest({
      args: [],
      id: 'request-1',
      method: 'listProjects',
      type: 'studio:host-request'
    });
    expect(request).toBeDefined();
    if (!request) return;
    await expect(dispatchStudioHostRequest(host, request)).resolves.toEqual({ ok: true, value: [] });
    expect(listProjects).toHaveBeenCalledOnce();
  });
});
