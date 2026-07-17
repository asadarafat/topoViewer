import { studioSpacing } from './spacingContract';

function toMuiFactor(pixels: number): number {
  return pixels / studioSpacing.baseUnit;
}

function mapValues<T extends Record<string, number>>(values: T): { readonly [Key in keyof T]: number } {
  return Object.freeze(Object.fromEntries(Object.entries(values).map(([name, pixels]) => [name, toMuiFactor(pixels)]))) as { readonly [Key in keyof T]: number };
}

export const studioMuiSpacingBase = studioSpacing.baseUnit;

export const studioLayoutSpacing = mapValues(studioSpacing.roles);
export const studioSpace = mapValues(studioSpacing.scale);
