import { isColorStyleKey } from './styleDefaults';
import type { StyleRule } from './types';

interface TvdsLintIssue {
  severity: 'warning';
  code: string;
  message: string;
  path?: string;
}

interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

function parseOpaqueColor(value: unknown): RgbColor | undefined {
  if (typeof value !== 'string') return undefined;
  const source = value.trim();
  const hex = source.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (hex) {
    const expanded = hex.length === 3 ? hex.split('').map((part) => `${part}${part}`).join('') : hex;
    return {
      red: Number.parseInt(expanded.slice(0, 2), 16),
      green: Number.parseInt(expanded.slice(2, 4), 16),
      blue: Number.parseInt(expanded.slice(4, 6), 16)
    };
  }
  const rgb = source.match(/^rgb\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*\)$/i);
  if (!rgb) return undefined;
  return { red: Number(rgb[1]), green: Number(rgb[2]), blue: Number(rgb[3]) };
}

function relativeLuminance(color: RgbColor): number {
  const channel = [color.red, color.green, color.blue].map((value) => {
    const normalized = Math.max(0, Math.min(255, value)) / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
}

function contrastRatio(foreground: unknown, background: unknown): number | undefined {
  const foregroundColor = parseOpaqueColor(foreground);
  const backgroundColor = parseOpaqueColor(background);
  if (!foregroundColor || !backgroundColor) return undefined;
  const foregroundLuminance = relativeLuminance(foregroundColor);
  const backgroundLuminance = relativeLuminance(backgroundColor);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

export function tvdsStyleIssues(rule: StyleRule, path: string): TvdsLintIssue[] {
  const style = rule.style || {};
  const keys = Object.keys(style);
  const issues: TvdsLintIssue[] = [];
  if (/\b(?:status|severity)\b/i.test(rule.selector) && keys.length && keys.every((key) => isColorStyleKey(key))) {
    issues.push({
      severity: 'warning',
      code: 'tvds-status-color-only',
      message: `Status selector "${rule.selector}" relies only on color; add a badge, icon, line style, width, or another non-color cue.`,
      path
    });
  }
  const foreground = style.labelColor ?? style.color;
  const background = style.labelBackgroundColor ?? style.textBackgroundColor ?? style.backgroundColor;
  const ratio = contrastRatio(foreground, background);
  if (ratio !== undefined && ratio < 4.5) {
    issues.push({
      severity: 'warning',
      code: 'tvds-low-contrast',
      message: `Literal foreground/background colors in "${rule.selector}" have ${ratio.toFixed(2)}:1 contrast; TVDS requires at least 4.5:1 for normal text.`,
      path
    });
  }
  return issues;
}
