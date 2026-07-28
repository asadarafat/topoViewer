export const studioColorModePreferenceKey = 'studio.color-mode';

export type StudioColorModePreference = 'dark' | 'light' | 'system';
export type StudioEffectiveColorMode = Exclude<StudioColorModePreference, 'system'>;

export function normalizeStudioColorModePreference(value: unknown): StudioColorModePreference {
  return value === 'dark' || value === 'light' || value === 'system' ? value : 'system';
}

export function resolveStudioEffectiveColorMode(
  preference: StudioColorModePreference,
  systemMode: StudioEffectiveColorMode
): StudioEffectiveColorMode {
  return preference === 'system' ? systemMode : preference;
}
