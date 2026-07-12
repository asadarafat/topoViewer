import type { KeyboardEvent } from 'react';
import { StudioNativeColorInput, StudioTextField } from './controls';

const hexColor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const rgbColor = /^rgba?\(\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?/i;

function channel(value: string) {
  const number = Number(value);
  return Math.max(0, Math.min(255, Math.round(number)));
}

function asHex(value: number) {
  return value.toString(16).padStart(2, '0');
}

export function colorPickerValue(value: string): string {
  const normalized = value.trim();
  const hex = normalized.match(hexColor);
  if (hex) {
    const digits = hex[1];
    return digits.length === 3
      ? `#${digits.split('').map((digit) => `${digit}${digit}`).join('')}`.toLowerCase()
      : `#${digits.toLowerCase()}`;
  }
  const rgb = normalized.match(rgbColor);
  if (rgb) return `#${asHex(channel(rgb[1]))}${asHex(channel(rgb[2]))}${asHex(channel(rgb[3]))}`;
  if (typeof document !== 'undefined') {
    const context = document.createElement('canvas').getContext('2d');
    if (context) {
      context.fillStyle = '#000000';
      context.fillStyle = normalized;
      const parsed = context.fillStyle;
      if (/^#[0-9a-f]{6}$/i.test(parsed)) return parsed.toLowerCase();
    }
  }
  return '#000000';
}

export function isValidCssColor(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return true;
  if (/^var\(\s*--[a-z0-9_-]+(?:\s*,.+)?\)$/i.test(normalized)) return true;
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    return CSS.supports('color', normalized);
  }
  return hexColor.test(normalized) || rgbColor.test(normalized) || /^[a-z]+$/i.test(normalized);
}

export function StudioColorField({
  ariaDescribedBy,
  error,
  id,
  label,
  onChange,
  onCommit,
  value
}: {
  ariaDescribedBy?: string;
  error?: string;
  id: string;
  label: string;
  onChange(value: string): void;
  onCommit(value?: string): void;
  value: string;
}) {
  const validationError = value.trim() && !isValidCssColor(value) ? 'Enter a valid CSS color.' : undefined;
  const visibleError = error || validationError;

  function commit(next = value) {
    if (!isValidCssColor(next)) return;
    onCommit(next);
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
      event.currentTarget.blur();
    }
    if (event.key === 'Escape') event.currentTarget.blur();
  }

  return (
    <div className="studio-color-field" data-color-representable={colorPickerValue(value) !== '#000000' || value.trim().toLowerCase() === '#000000'}>
      <StudioNativeColorInput
        ariaLabel={`${label} color picker`}
        onChange={(next) => {
          onChange(next);
          commit(next);
        }}
        value={colorPickerValue(value)}
      />
      <StudioTextField
        aria-describedby={ariaDescribedBy}
        aria-errormessage={visibleError ? `${id}-color-error` : undefined}
        aria-label={label}
        error={Boolean(visibleError)}
        id={id}
        onBlur={() => commit()}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={keyDown}
        placeholder="#1565c0, rgba(...), or var(--token)"
        value={value}
      />
      {visibleError ? <span className="studio-field-error" id={`${id}-color-error`} role="alert">{visibleError}</span> : null}
    </div>
  );
}
