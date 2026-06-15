export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function mergePlainObjects<T extends Record<string, unknown>>(base: T, overlay: Record<string, unknown> = {}): T {
  return Object.entries(overlay).reduce<Record<string, unknown>>((result, [key, value]) => {
    if (isPlainObject(result[key]) && isPlainObject(value)) {
      return { ...result, [key]: mergePlainObjects(result[key] as Record<string, unknown>, value) };
    }
    return { ...result, [key]: value };
  }, { ...base }) as T;
}

export function withoutUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>;
}

export function valueOrDefault<T>(value: T | undefined | null, fallback: T): T {
  return value === undefined || value === null ? fallback : value;
}
