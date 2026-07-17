import { createTheme, type TypographyStyle } from '@mui/material/styles';
import { studioMuiSpacingBase } from './muiSpacing';
import { studioTypography, type StudioTypographyRole } from './typographyContract';

function toRem(size: number): string {
  return `${size / studioTypography.rootSize}rem`;
}

function toMuiTypography(role: StudioTypographyRole): TypographyStyle {
  return {
    fontSize: toRem(role.size),
    fontWeight: role.weight,
    letterSpacing: studioTypography.letterSpacing,
    lineHeight: role.lineHeight / role.size
  };
}

export const studioMuiCodeTypography = Object.freeze({
  ...toMuiTypography(studioTypography.roles.code),
  fontFamily: studioTypography.family.code
});

export function createStudioTheme() {
  const bodyTypography = toMuiTypography(studioTypography.roles.body);
  const metadataTypography = toMuiTypography(studioTypography.roles.metadata);

  return createTheme({
    cssVariables: true,
    palette: {
      mode: 'dark'
    },
    spacing: studioMuiSpacingBase,
    typography: {
      body1: toMuiTypography(studioTypography.roles.body),
      body2: toMuiTypography(studioTypography.roles.body),
      button: {
        ...toMuiTypography(studioTypography.roles.label),
        textTransform: studioTypography.buttonTextTransform
      },
      caption: toMuiTypography(studioTypography.roles.metadata),
      fontFamily: studioTypography.family.interface,
      fontSize: studioTypography.roles.body.size,
      h6: toMuiTypography(studioTypography.roles.appTitle),
      htmlFontSize: studioTypography.rootSize,
      subtitle1: toMuiTypography(studioTypography.roles.panelTitle),
      subtitle2: toMuiTypography(studioTypography.roles.sectionTitle)
    },
    components: {
      MuiAccordion: {
        defaultProps: { disableGutters: true, elevation: 0 }
      },
      MuiButton: {
        defaultProps: { disableElevation: true, size: 'small' }
      },
      MuiCheckbox: {
        defaultProps: { size: 'small' }
      },
      MuiChip: {
        styleOverrides: { root: metadataTypography }
      },
      MuiFormHelperText: {
        styleOverrides: { root: metadataTypography }
      },
      MuiInputBase: {
        styleOverrides: {
          input: bodyTypography,
          root: bodyTypography
        }
      },
      MuiListItemButton: {
        defaultProps: { dense: true }
      },
      MuiIconButton: {
        defaultProps: { size: 'small' }
      },
      MuiSelect: {
        defaultProps: { size: 'small' }
      },
      MuiSwitch: {
        defaultProps: { size: 'small' }
      },
      MuiTooltip: {
        defaultProps: { arrow: true, enterDelay: 450 },
        styleOverrides: { tooltip: metadataTypography }
      },
      MuiToggleButton: {
        defaultProps: { size: 'small' }
      }
    }
  });
}
