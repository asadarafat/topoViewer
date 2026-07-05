type StorageMode = 'local' | 'session';
type StorageLike = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

export function browserStorage(mode: StorageMode = 'local'): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return mode === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function safeGetString(key: string, fallback = '', mode: StorageMode = 'local'): string {
  const storage = browserStorage(mode);
  if (!storage) return fallback;
  try {
    return storage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function safeSetString(key: string, value: string, mode: StorageMode = 'local'): boolean {
  const storage = browserStorage(mode);
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string, mode: StorageMode = 'local'): boolean {
  const storage = browserStorage(mode);
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function safeGetJson<T>(key: string, fallback: T, mode: StorageMode = 'local', guard?: (value: unknown) => value is T): T {
  const raw = safeGetString(key, '', mode);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return guard && !guard(parsed) ? fallback : parsed as T;
  } catch {
    return fallback;
  }
}

export function safeSetJson(key: string, value: unknown, mode: StorageMode = 'local'): boolean {
  try {
    return safeSetString(key, JSON.stringify(value), mode);
  } catch {
    return false;
  }
}
