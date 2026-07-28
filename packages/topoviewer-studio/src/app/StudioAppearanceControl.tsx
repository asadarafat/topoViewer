import { useState, type ReactNode } from 'react';
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { StudioIconButton, StudioMenu, StudioMenuItem, StudioMenuItemIcon, StudioMenuItemText } from '../ui/controls';
import type { useStudioColorScheme } from '../ui/StudioThemeProvider';
import type { StudioColorModePreference } from '../ui/themePreference';

interface StudioAppearanceControlProps {
  appearance: ReturnType<typeof useStudioColorScheme>;
}

const appearanceOptions: Array<[StudioColorModePreference, string, ReactNode]> = [
  ['system', 'System', <BrightnessAutoIcon fontSize="small" />],
  ['light', 'Light', <LightModeIcon fontSize="small" />],
  ['dark', 'Dark', <DarkModeIcon fontSize="small" />]
];

export function StudioAppearanceControl({ appearance }: StudioAppearanceControlProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <StudioIconButton
        aria-controls={anchor ? 'studio-appearance-menu' : undefined}
        aria-expanded={Boolean(anchor)}
        aria-haspopup="menu"
        aria-label="Appearance"
        onClick={(event) => setAnchor(event.currentTarget)}
        title={`Appearance: ${appearance.preference}`}
      >
        {appearance.effectiveMode === 'dark' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
      </StudioIconButton>
      <StudioMenu
        anchorEl={anchor}
        id="studio-appearance-menu"
        onClose={() => setAnchor(null)}
        open={Boolean(anchor)}
        slotProps={{ list: { 'aria-label': 'Appearance' } }}
      >
        {appearanceOptions.map(([value, label, icon]) => (
          <StudioMenuItem
            aria-checked={appearance.preference === value}
            key={value}
            onClick={() => {
              setAnchor(null);
              void appearance.setPreference(value);
            }}
            role="menuitemradio"
            selected={appearance.preference === value}
          >
            <StudioMenuItemIcon>{icon}</StudioMenuItemIcon>
            <StudioMenuItemText>{label}</StudioMenuItemText>
          </StudioMenuItem>
        ))}
      </StudioMenu>
    </>
  );
}
