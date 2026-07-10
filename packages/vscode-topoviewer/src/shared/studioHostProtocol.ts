import type {
  StudioHost,
  StudioHostEvent,
  StudioResult
} from 'topoviewer-studio/host';

export const studioHostMethods = [
  'chooseAssets',
  'copyText',
  'createProject',
  'deleteProject',
  'duplicateProject',
  'exportArtifact',
  'listProjects',
  'loadProject',
  'openProjectFolder',
  'readProjectAssets',
  'readPreference',
  'renameProject',
  'resetStorage',
  'saveRecovery',
  'saveProject',
  'writePreference'
] as const;

export type StudioHostMethod = typeof studioHostMethods[number];

export interface StudioHostRequestMessage {
  args: unknown[];
  id: string;
  method: StudioHostMethod;
  type: 'studio:host-request';
}

export interface StudioHostResponseMessage {
  id: string;
  result: StudioResult<unknown>;
  type: 'studio:host-response';
}

export interface StudioHostWatchMessage {
  event: Parameters<NonNullable<StudioHost['watchProject']>>[0] extends (event: infer Event) => void ? Event : never;
  type: 'studio:host-watch';
}

export interface StudioHostReportMessage {
  event: StudioHostEvent;
  type: 'studio:host-report';
}

const methods = new Set<string>(studioHostMethods);
const MAX_MESSAGE_BYTES = 32 * 1024 * 1024;
const MAX_MESSAGE_DEPTH = 32;
const MAX_OBJECT_KEYS = 10_000;

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Uint8Array);
}

function bounded(value: unknown, depth = 0, seen = new Set<object>()): number {
  if (depth > MAX_MESSAGE_DEPTH) return Number.POSITIVE_INFINITY;
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') return 8;
  if (typeof value === 'string') return value.length * 2;
  if (value instanceof Uint8Array) return value.byteLength;
  if (typeof value !== 'object') return Number.POSITIVE_INFINITY;
  if (seen.has(value)) return Number.POSITIVE_INFINITY;
  seen.add(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_OBJECT_KEYS) return Number.POSITIVE_INFINITY;
    return value.reduce((total, item) => total + bounded(item, depth + 1, seen), 0);
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > MAX_OBJECT_KEYS) return Number.POSITIVE_INFINITY;
  return entries.reduce((total, [key, item]) => total + key.length * 2 + bounded(item, depth + 1, seen), 0);
}

function reference(value: unknown): boolean {
  if (!record(value)) return false;
  return ['id', 'path', 'revision'].every((key) => value[key] === undefined || typeof value[key] === 'string');
}

function oneRecord(args: unknown[]): boolean {
  return args.length === 1 && record(args[0]);
}

function validArgs(method: StudioHostMethod, args: unknown[]): boolean {
  switch (method) {
    case 'listProjects':
    case 'openProjectFolder':
    case 'resetStorage':
      return args.length === 0;
    case 'loadProject':
      return args.length === 0 || (args.length === 1 && reference(args[0]));
    case 'copyText':
      return args.length === 1 && typeof args[0] === 'string';
    case 'readPreference':
      return args.length === 1 && typeof args[0] === 'string' && args[0].length <= 256;
    case 'writePreference':
      return args.length === 2 && typeof args[0] === 'string' && args[0].length <= 256;
    case 'deleteProject':
    case 'readProjectAssets':
      return args.length === 1 && reference(args[0]);
    case 'chooseAssets': {
      if (!oneRecord(args)) return false;
      const request = args[0] as Record<string, unknown>;
      return Array.isArray(request.accept)
        && request.accept.every((item: unknown) => typeof item === 'string')
        && typeof request.maximumBytes === 'number'
        && Number.isSafeInteger(request.maximumBytes)
        && request.maximumBytes > 0
        && typeof request.multiple === 'boolean';
    }
    case 'createProject':
    case 'duplicateProject':
    case 'exportArtifact':
    case 'renameProject':
    case 'saveRecovery':
    case 'saveProject':
      return oneRecord(args);
  }
}

export function parseStudioHostRequest(value: unknown): StudioHostRequestMessage | undefined {
  if (!record(value) || value.type !== 'studio:host-request') return undefined;
  if (typeof value.id !== 'string' || !/^[a-zA-Z0-9._:-]{1,128}$/.test(value.id)) return undefined;
  if (typeof value.method !== 'string' || !methods.has(value.method)) return undefined;
  if (!Array.isArray(value.args) || bounded(value) > MAX_MESSAGE_BYTES) return undefined;
  const method = value.method as StudioHostMethod;
  if (!validArgs(method, value.args)) return undefined;
  return { args: value.args, id: value.id, method, type: 'studio:host-request' };
}

export function parseStudioHostResponse(value: unknown): StudioHostResponseMessage | undefined {
  if (!record(value) || value.type !== 'studio:host-response' || typeof value.id !== 'string' || !record(value.result)) return undefined;
  const result = value.result;
  const valid = result.ok === true && 'value' in result
    || result.ok === false
      && record(result.error)
      && typeof result.error.code === 'string'
      && typeof result.error.message === 'string'
      && typeof result.error.retryable === 'boolean';
  if (!valid || bounded(value) > MAX_MESSAGE_BYTES) return undefined;
  return value as unknown as StudioHostResponseMessage;
}

export function parseStudioHostReport(value: unknown): StudioHostReportMessage | undefined {
  if (!record(value) || value.type !== 'studio:host-report' || !record(value.event)) return undefined;
  const event = value.event;
  if (
    !['lifecycle', 'persistence', 'export', 'security', 'performance'].includes(String(event.category))
    || typeof event.name !== 'string'
    || event.name.length > 256
    || bounded(value) > 64 * 1024
  ) return undefined;
  return value as unknown as StudioHostReportMessage;
}

export function parseStudioHostWatch(value: unknown): StudioHostWatchMessage | undefined {
  if (!record(value) || value.type !== 'studio:host-watch' || !record(value.event)) return undefined;
  const event = value.event;
  if (!['changed', 'deleted', 'renamed'].includes(String(event.kind)) || !reference(event.reference)) return undefined;
  if (event.revision !== undefined && typeof event.revision !== 'string') return undefined;
  if (bounded(value) > 64 * 1024) return undefined;
  return value as unknown as StudioHostWatchMessage;
}

export async function dispatchStudioHostRequest(host: StudioHost, request: StudioHostRequestMessage): Promise<StudioResult<unknown>> {
  const [first, second] = request.args;
  switch (request.method) {
    case 'chooseAssets': return host.chooseAssets
      ? host.chooseAssets(first as Parameters<NonNullable<StudioHost['chooseAssets']>>[0])
      : { error: { code: 'unsupported', message: 'Asset selection is unavailable.', retryable: false }, ok: false };
    case 'copyText': return host.copyText(first as string);
    case 'createProject': return host.createProject(first as Parameters<StudioHost['createProject']>[0]);
    case 'deleteProject': return host.deleteProject(first as Parameters<StudioHost['deleteProject']>[0]);
    case 'duplicateProject': return host.duplicateProject(first as Parameters<StudioHost['duplicateProject']>[0]);
    case 'exportArtifact': return host.exportArtifact(first as Parameters<StudioHost['exportArtifact']>[0]);
    case 'listProjects': return host.listProjects();
    case 'loadProject': return host.loadProject(first as Parameters<StudioHost['loadProject']>[0]);
    case 'openProjectFolder': return host.openProjectFolder
      ? host.openProjectFolder()
      : { error: { code: 'unsupported', message: 'Folder selection is unavailable.', retryable: false }, ok: false };
    case 'readProjectAssets': return host.readProjectAssets(first as Parameters<StudioHost['readProjectAssets']>[0]);
    case 'readPreference': return host.readPreference(first as string);
    case 'renameProject': return host.renameProject(first as Parameters<StudioHost['renameProject']>[0]);
    case 'resetStorage': return host.resetStorage
      ? host.resetStorage()
      : { error: { code: 'unsupported', message: 'Storage reset is unavailable.', retryable: false }, ok: false };
    case 'saveRecovery': return host.saveRecovery(first as Parameters<StudioHost['saveRecovery']>[0]);
    case 'saveProject': return host.saveProject(first as Parameters<StudioHost['saveProject']>[0]);
    case 'writePreference': return host.writePreference(first as string, second);
  }
}
