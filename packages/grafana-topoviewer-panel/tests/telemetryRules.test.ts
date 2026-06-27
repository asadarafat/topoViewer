import { describe, expect, it } from 'vitest';
import { colorForTelemetrySeverity, severityForTelemetry } from '../src/telemetryRules';

describe('telemetry rules', () => {
  it('maps utilization and link state into deterministic severities', () => {
    expect(severityForTelemetry({ up: true, utilizationPercent: 22 })).toBe('success');
    expect(severityForTelemetry({ up: true, utilizationPercent: 55 })).toBe('info');
    expect(severityForTelemetry({ up: true, utilizationPercent: 84 })).toBe('warning');
    expect(severityForTelemetry({ up: true, utilizationPercent: 95 })).toBe('error');
    expect(severityForTelemetry({ up: false, utilizationPercent: 12 })).toBe('error');
  });

  it('uses Material UI semantic colors for overlay states', () => {
    expect(colorForTelemetrySeverity('success')).toBe('#4caf50');
    expect(colorForTelemetrySeverity('info')).toBe('#42a5f5');
    expect(colorForTelemetrySeverity('warning')).toBe('#ff9800');
    expect(colorForTelemetrySeverity('error')).toBe('#d32f2f');
  });
});
