import { type KeyboardEvent, type MouseEvent, useEffect, useRef, useState } from 'react';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import InputAdornment from '@mui/material/InputAdornment';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { StudioFormHelperText, StudioIconButton, StudioPopover, StudioTextField } from './controls';
import { studioLayoutSpacing, studioSpace } from './muiSpacing';

const hexColor = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const rgbColor = /^rgba?\(\s*([\d.]+)(%)?\s*(?:,\s*|\s+)([\d.]+)(%)?\s*(?:,\s*|\s+)([\d.]+)(%)?(?:\s*(?:,|\/)\s*([\d.]+)(%)?)?\s*\)$/i;
const opacityColorMix = /^color-mix\(\s*in\s+srgb\s*,\s*(.+)\s+([\d.]+)%\s*,\s*transparent\s*\)$/i;

type RgbaColor = {
  alpha: number;
  blue: number;
  green: number;
  red: number;
};

function channel(value: string, percentage = false) {
  const number = Number(value);
  const scaled = percentage ? number * 2.55 : number;
  return Math.max(0, Math.min(255, Math.round(scaled)));
}

function asHex(value: number) {
  return value.toString(16).padStart(2, '0');
}

function parseLiteralColor(value: string): RgbaColor | undefined {
  const normalized = value.trim();
  if (normalized.toLowerCase() === 'transparent') return { alpha: 0, blue: 0, green: 0, red: 0 };

  const hex = normalized.match(hexColor);
  if (hex) {
    const expanded =
      hex[1].length <= 4
        ? hex[1]
            .split('')
            .map((digit) => `${digit}${digit}`)
            .join('')
        : hex[1];
    return {
      alpha: expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
      blue: Number.parseInt(expanded.slice(4, 6), 16),
      green: Number.parseInt(expanded.slice(2, 4), 16),
      red: Number.parseInt(expanded.slice(0, 2), 16)
    };
  }

  const rgb = normalized.match(rgbColor);
  if (!rgb) return undefined;
  const rawAlpha = rgb[7] === undefined ? 1 : Number(rgb[7]) / (rgb[8] ? 100 : 1);
  return {
    alpha: Math.max(0, Math.min(1, rawAlpha)),
    blue: channel(rgb[5], Boolean(rgb[6])),
    green: channel(rgb[3], Boolean(rgb[4])),
    red: channel(rgb[1], Boolean(rgb[2]))
  };
}

function parseCssColor(value: string): RgbaColor | undefined {
  const literal = parseLiteralColor(value);
  if (literal) return literal;
  if (typeof document === 'undefined') return undefined;
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return undefined;
  const sentinel = 'rgba(1, 2, 3, 0.123)';
  context.fillStyle = sentinel;
  const unchanged = context.fillStyle;
  context.fillStyle = value.trim();
  if (context.fillStyle === unchanged) return undefined;
  return parseLiteralColor(context.fillStyle);
}

function serializeColor({ alpha, blue, green, red }: RgbaColor): string {
  if (alpha >= 0.9995) return `#${asHex(red)}${asHex(green)}${asHex(blue)}`;
  return `rgba(${red}, ${green}, ${blue}, ${Number(alpha.toFixed(3))})`;
}

function parseOpacityColorMix(value: string) {
  const match = value.trim().match(opacityColorMix);
  if (!match) return undefined;
  return {
    base: match[1].trim(),
    opacity: Math.max(0, Math.min(100, Number(match[2])))
  };
}

export function colorPickerValue(value: string): string {
  const parsed = parseCssColor(value);
  return parsed ? `#${asHex(parsed.red)}${asHex(parsed.green)}${asHex(parsed.blue)}` : '#000000';
}

export function colorOpacityPercent(value: string): number {
  const mixed = parseOpacityColorMix(value);
  if (mixed) return Math.round(mixed.opacity);
  return Math.round((parseCssColor(value)?.alpha ?? 1) * 100);
}

export function colorValueWithOpacity(value: string, opacityPercent: number): string {
  const opacity = Math.max(0, Math.min(100, opacityPercent));
  const mixed = parseOpacityColorMix(value);
  const base = mixed?.base ?? value.trim();
  const parsed = parseCssColor(base);
  if (parsed) return serializeColor({ ...parsed, alpha: opacity / 100 });
  if (!base || !isValidCssColor(base)) return value;
  return opacity >= 100 ? base : `color-mix(in srgb, ${base} ${opacity}%, transparent)`;
}

function colorValueWithBase(value: string, base: string): string {
  const next = parseCssColor(base);
  if (!next) return value;
  return serializeColor({ ...next, alpha: colorOpacityPercent(value) / 100 });
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
  disabled = false,
  error,
  id,
  label,
  onChange,
  onCommit,
  onReset,
  resetDisabled = false,
  resetLabel,
  value
}: {
  ariaDescribedBy?: string;
  disabled?: boolean;
  error?: string;
  id: string;
  label: string;
  onChange(value: string): void;
  onCommit(value?: string): void;
  onReset?(): void;
  resetDisabled?: boolean;
  resetLabel?: string;
  value: string;
}) {
  const validationError = value.trim() && !isValidCssColor(value) ? 'Enter a valid CSS color.' : undefined;
  const visibleError = error || validationError;
  const opacityAdjustable = Boolean(value.trim() && isValidCssColor(value));
  const opacity = colorOpacityPercent(value);
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);
  const latestValueRef = useRef(value);
  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  function commit(next = value) {
    if (!isValidCssColor(next)) return;
    onCommit(next);
  }

  function update(next: string) {
    latestValueRef.current = next;
    onChange(next);
  }

  function openPicker(event: MouseEvent<HTMLElement>) {
    setPickerAnchor(event.currentTarget);
  }

  function closePicker() {
    commit(latestValueRef.current);
    setPickerAnchor(null);
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
    <Box className="studio-color-field" data-color-representable={colorPickerValue(value) !== '#000000' || value.trim().toLowerCase() === '#000000'} sx={{ display: 'grid', gap: studioSpace.space4, minWidth: 0 }}>
      <StudioTextField
        aria-describedby={ariaDescribedBy}
        aria-errormessage={visibleError ? `${id}-color-error` : undefined}
        aria-label={label}
        disabled={disabled}
        error={Boolean(visibleError)}
        id={id}
        onBlur={() => commit()}
        onChange={(event) => update(event.target.value)}
        onKeyDown={keyDown}
        placeholder="#1565c0, rgba(...), or var(--token)"
        slotProps={{
          htmlInput: { title: value },
          input: {
            endAdornment: onReset ? (
              <InputAdornment position="end">
                <StudioIconButton aria-label={resetLabel || `Reset ${label} to default`} disabled={disabled || resetDisabled} edge="end" onClick={onReset} title={resetLabel || `Reset ${label} to default`} type="button">
                  <RestartAltIcon fontSize="small" />
                </StudioIconButton>
              </InputAdornment>
            ) : undefined,
            startAdornment: (
              <InputAdornment position="start">
                <ButtonBase
                  aria-controls={pickerAnchor ? `${id}-color-picker-popover` : undefined}
                  aria-expanded={Boolean(pickerAnchor)}
                  aria-haspopup="dialog"
                  aria-label={`${label} color picker`}
                  disabled={disabled}
                  onClick={openPicker}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    height: 28,
                    p: studioSpace.space4,
                    width: 28,
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  title={`Edit ${label} color and opacity`}
                  type="button"
                >
                  <Box
                    component="span"
                    sx={{
                      backgroundColor: 'common.white',
                      backgroundImage: (theme) =>
                        [
                          `linear-gradient(45deg, ${theme.palette.action.disabled} 25%, transparent 25%)`,
                          `linear-gradient(-45deg, ${theme.palette.action.disabled} 25%, transparent 25%)`,
                          `linear-gradient(45deg, transparent 75%, ${theme.palette.action.disabled} 75%)`,
                          `linear-gradient(-45deg, transparent 75%, ${theme.palette.action.disabled} 75%)`
                        ].join(','),
                      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
                      backgroundSize: '8px 8px',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 0.5,
                      display: 'block',
                      height: 18,
                      overflow: 'hidden',
                      position: 'relative',
                      width: 18
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        backgroundColor: isValidCssColor(value) && value.trim() ? value : 'common.black',
                        display: 'block',
                        inset: 0,
                        position: 'absolute'
                      }}
                    />
                  </Box>
                </ButtonBase>
              </InputAdornment>
            )
          }
        }}
        value={value}
      />
      <StudioPopover
        anchorEl={pickerAnchor}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        id={`${id}-color-picker-popover`}
        onClose={closePicker}
        open={Boolean(pickerAnchor)}
        slotProps={{ paper: { sx: { mt: studioLayoutSpacing.popoverOffset, width: 248 } } }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      >
        <Stack spacing={studioSpace.space12} sx={{ p: studioSpace.space12 }}>
          <Stack direction="row" spacing={studioSpace.space12} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography component="span" variant="subtitle2">
              {label}
            </Typography>
            <Typography color="text.secondary" component="span" variant="caption">
              {opacity}%
            </Typography>
          </Stack>
          <StudioTextField
            aria-label={`${label} base color`}
            disabled={disabled}
            onChange={(event) => {
              const next = colorValueWithBase(latestValueRef.current, event.target.value);
              update(next);
              commit(next);
            }}
            slotProps={{
              htmlInput: {
                sx: { cursor: 'pointer', height: 32, p: studioSpace.space2 }
              }
            }}
            type="color"
            value={colorPickerValue(value)}
          />
          <Stack spacing={studioSpace.space4}>
            <Stack direction="row" spacing={studioSpace.space12} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography component="span" variant="body2">
                Opacity
              </Typography>
              <Typography color="text.secondary" component="span" variant="caption">
                Transparent to opaque
              </Typography>
            </Stack>
            <Slider
              aria-label={`${label} opacity`}
              disabled={disabled || !opacityAdjustable}
              max={100}
              min={0}
              onChange={(_, nextValue) => update(colorValueWithOpacity(latestValueRef.current, Number(nextValue)))}
              onChangeCommitted={() => commit(latestValueRef.current)}
              size="small"
              step={1}
              value={opacity}
              valueLabelDisplay="auto"
            />
          </Stack>
        </Stack>
      </StudioPopover>
      {visibleError ? (
        <StudioFormHelperText className="studio-field-error" error id={`${id}-color-error`} role="alert">
          {visibleError}
        </StudioFormHelperText>
      ) : null}
    </Box>
  );
}
