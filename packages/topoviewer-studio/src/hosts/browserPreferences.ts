import type { StudioResult } from '../contracts/host';

const preferenceVersion = 1;
const maximumPreferenceBytes = 16 * 1024;
const keyPrefix = `topoviewer-studio:preference:v${preferenceVersion}:`;
const forbiddenPreferenceKey = /(project|topology|stylesheet|mapper|telemetry|sample|source)/i;

interface PreferenceEnvelope<T> {
  value: T;
  version: number;
}

function failure<T>(code: 'invalid-request' | 'quota-exceeded' | 'unavailable', message: string): StudioResult<T> {
  return {
    error: { code, message, retryable: code !== 'invalid-request' },
    ok: false
  };
}

function storageKey(key: string): StudioResult<string> {
  const normalized = key.trim();
  if (!normalized || normalized.length > 160 || forbiddenPreferenceKey.test(normalized)) {
    return failure('invalid-request', 'Only small non-project UI preferences may use browser local storage.');
  }
  return { ok: true, value: `${keyPrefix}${normalized}` };
}

export function safeReadBrowserPreference<T>(storage: Storage | undefined, key: string): StudioResult<T | undefined> {
  if (!storage) return failure('unavailable', 'Browser preference storage is unavailable.');
  const resolved = storageKey(key);
  if (!resolved.ok) return resolved;
  try {
    const raw = storage.getItem(resolved.value);
    if (raw === null) return { ok: true, value: undefined };
    if (new TextEncoder().encode(raw).byteLength > maximumPreferenceBytes) {
      storage.removeItem(resolved.value);
      return failure('invalid-request', 'The stored preference exceeded the supported size and was removed.');
    }
    const envelope = JSON.parse(raw) as PreferenceEnvelope<T>;
    if (envelope.version !== preferenceVersion || !Object.hasOwn(envelope, 'value')) {
      return failure('invalid-request', 'The stored preference uses an unsupported format.');
    }
    return { ok: true, value: envelope.value };
  } catch (error) {
    return failure('unavailable', `Cannot read browser preference: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function safeWriteBrowserPreference<T>(storage: Storage | undefined, key: string, value: T): StudioResult<void> {
  if (!storage) return failure('unavailable', 'Browser preference storage is unavailable.');
  const resolved = storageKey(key);
  if (!resolved.ok) return resolved;
  try {
    const raw = JSON.stringify({
      value,
      version: preferenceVersion
    } satisfies PreferenceEnvelope<T>);
    if (new TextEncoder().encode(raw).byteLength > maximumPreferenceBytes) {
      return failure('invalid-request', `Browser preferences must remain below ${maximumPreferenceBytes} bytes.`);
    }
    storage.setItem(resolved.value, raw);
    return { ok: true, value: undefined };
  } catch (error) {
    const quota = error instanceof DOMException && error.name === 'QuotaExceededError';
    return failure(quota ? 'quota-exceeded' : 'unavailable', quota ? 'Browser preference quota is exhausted.' : `Cannot write browser preference: ${error instanceof Error ? error.message : String(error)}`);
  }
}
