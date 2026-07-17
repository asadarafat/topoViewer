export const studioWorkspaceDefaultRatio = 1 / 4;
export const studioWorkspaceMinimumRatio = 1 / 4;
export const studioWorkspaceMaximumRatio = 1 / 2;

export function normalizeStudioWorkspaceRatio(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return studioWorkspaceDefaultRatio;
  return Math.min(studioWorkspaceMaximumRatio, Math.max(studioWorkspaceMinimumRatio, value));
}

export function studioWorkspaceRatioFromPointer(clientX: number, shellLeft: number, shellWidth: number): number {
  if (!Number.isFinite(shellWidth) || shellWidth <= 0) return studioWorkspaceDefaultRatio;
  return normalizeStudioWorkspaceRatio((clientX - shellLeft) / shellWidth);
}
