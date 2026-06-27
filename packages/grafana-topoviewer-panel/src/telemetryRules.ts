export type TelemetrySeverity = 'none' | 'success' | 'info' | 'warning' | 'error';

export interface TelemetrySeverityThresholds {
  infoPercent: number;
  warningPercent: number;
  errorPercent: number;
}

export const defaultTelemetryThresholds: TelemetrySeverityThresholds = {
  infoPercent: 50,
  warningPercent: 80,
  errorPercent: 90
};

export const telemetrySeverityRank: Record<TelemetrySeverity, number> = {
  none: 0,
  success: 1,
  info: 2,
  warning: 3,
  error: 4
};

const severityColors: Record<Exclude<TelemetrySeverity, 'none'>, { color: string; accent: string }> = {
  success: { color: '#4caf50', accent: '#2e7d32' },
  info: { color: '#42a5f5', accent: '#1976d2' },
  warning: { color: '#ff9800', accent: '#ed6c02' },
  error: { color: '#d32f2f', accent: '#c62828' }
};

export interface TelemetrySeverityInput {
  up?: boolean;
  utilizationPercent?: number;
}

export function normalizeUtilizationPercent(value: number | undefined): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(100, Number(value)));
}

export function severityForTelemetry(
  input: TelemetrySeverityInput,
  thresholds: TelemetrySeverityThresholds = defaultTelemetryThresholds
): TelemetrySeverity {
  if (input.up === false) return 'error';
  const utilization = normalizeUtilizationPercent(input.utilizationPercent);
  if (utilization === undefined) return input.up === true ? 'success' : 'none';
  if (utilization >= thresholds.errorPercent) return 'error';
  if (utilization >= thresholds.warningPercent) return 'warning';
  if (utilization >= thresholds.infoPercent) return 'info';
  return 'success';
}

export function colorForTelemetrySeverity(severity: TelemetrySeverity): string | undefined {
  if (severity === 'none') return undefined;
  return severityColors[severity].color;
}

export function accentColorForTelemetrySeverity(severity: TelemetrySeverity): string | undefined {
  if (severity === 'none') return undefined;
  return severityColors[severity].accent;
}

export function isBlockingTelemetrySeverity(severity: TelemetrySeverity): boolean {
  return severity === 'error';
}

export function compareTelemetrySeverity(left: TelemetrySeverity, right: TelemetrySeverity): number {
  return telemetrySeverityRank[left] - telemetrySeverityRank[right];
}
