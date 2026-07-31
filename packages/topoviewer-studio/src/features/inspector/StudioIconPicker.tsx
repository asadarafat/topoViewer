import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { IconSpec } from 'topoviewer';
import { StudioInputLabel, StudioOption, StudioSelect } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';
import { studioIconPreviewGlyph, studioIconPreviewSource } from './iconPreview';

interface StudioIconThumbnailProps {
  icon: IconSpec | undefined;
  iconId: string;
  size: number;
}

function StudioIconThumbnail({ icon, iconId, size }: StudioIconThumbnailProps) {
  const source = useMemo(() => studioIconPreviewSource(icon), [icon]);
  return (
    <Box
      aria-hidden="true"
      data-studio-icon-preview={iconId}
      sx={{
        alignItems: 'center',
        bgcolor: 'background.default',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        display: 'flex',
        flex: '0 0 auto',
        height: size,
        justifyContent: 'center',
        overflow: 'hidden',
        width: size
      }}
    >
      {source ? (
        <Box alt="" component="img" draggable={false} src={source} sx={{ display: 'block', height: '100%', objectFit: 'contain', width: '100%' }} />
      ) : (
        <Typography component="span" variant="caption">
          {studioIconPreviewGlyph(iconId, icon)}
        </Typography>
      )}
    </Box>
  );
}

function StudioIconOptionContent({ compact, icon, iconId }: { compact: boolean; icon: IconSpec | undefined; iconId: string }) {
  return (
    <Stack direction="row" spacing={studioSpace.space8} sx={{ alignItems: 'center', minWidth: 0, width: '100%' }}>
      <StudioIconThumbnail icon={icon} iconId={iconId} size={compact ? 24 : 36} />
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap variant="body2">
          {iconId}
        </Typography>
        {!compact ? (
          <Typography color="text.secondary" noWrap variant="caption">
            {icon?.alt || icon?.glyph || (icon?.svg ? 'Inline SVG' : 'Icon')}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}

interface StudioIconPickerProps {
  ariaDescribedBy?: string;
  disabled?: boolean;
  icons: Record<string, IconSpec>;
  id: string;
  label?: string;
  mixed?: boolean;
  onChange(value: string): void;
  options: string[];
  value: string;
}

export function StudioIconPicker({ ariaDescribedBy, disabled = false, icons, id, label, mixed = false, onChange, options, value }: StudioIconPickerProps) {
  const labelId = label ? `${id}-label` : undefined;
  return (
    <>
      {label ? <StudioInputLabel id={labelId}>{label}</StudioInputLabel> : null}
      <StudioSelect
        aria-describedby={ariaDescribedBy}
        aria-label={label || 'Icon'}
        disabled={disabled}
        id={id}
        label={label}
        labelId={labelId}
        MenuProps={{
          slotProps: {
            paper: {
              style: {
                maxHeight: 360,
                minWidth: 280
              }
            }
          }
        }}
        onChange={(event) => onChange(event.target.value)}
        renderValue={(selected) => {
          const iconId = String(selected || '');
          return iconId ? <StudioIconOptionContent compact icon={icons[iconId]} iconId={iconId} /> : mixed ? 'Mixed' : 'Not set';
        }}
        value={value}
      >
        {!value ? <StudioOption value="">{mixed ? 'Mixed' : 'Not set'}</StudioOption> : null}
        {options.map((iconId) => (
          <StudioOption data-icon-id={iconId} key={iconId} value={iconId}>
            <StudioIconOptionContent compact={false} icon={icons[iconId]} iconId={iconId} />
          </StudioOption>
        ))}
      </StudioSelect>
    </>
  );
}
