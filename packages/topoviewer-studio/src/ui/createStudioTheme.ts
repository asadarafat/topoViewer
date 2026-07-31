import { createTheme, type TypographyStyle } from '@mui/material/styles';
import { studioColors, type StudioColorScheme } from './colorContract';
import { studioMuiSpacingBase, studioSpace } from './muiSpacing';
import { studioGeometry, studioRadius } from './studioTokens';
import { studioTypography, type StudioTypographyRole } from './typographyContract';

function toRem(size: number): string {
  return `${size / studioTypography.rootSize}rem`;
}

/** Canonical spacing expressed in pixels for the few component defaults that cannot use `sx`. */
function inset(factor: number): number {
  return factor * studioMuiSpacingBase;
}

function toMuiTypography(role: StudioTypographyRole): TypographyStyle {
  return {
    fontSize: toRem(role.size),
    fontWeight: role.weight,
    letterSpacing: studioTypography.letterSpacing,
    lineHeight: role.lineHeight / role.size
  };
}

export const studioMuiCodeTypography: TypographyStyle = Object.freeze({
  ...toMuiTypography(studioTypography.roles.code),
  fontFamily: studioTypography.family.code
});

export const studioMuiIconSize = studioTypography.iconSize;

function toMuiPalette(scheme: StudioColorScheme) {
  return {
    palette: {
      action: scheme.action,
      background: scheme.background,
      divider: scheme.divider,
      error: scheme.error,
      info: scheme.info,
      primary: scheme.primary,
      success: scheme.success,
      text: scheme.text,
      warning: scheme.warning
    }
  };
}

export function createStudioTheme() {
  const bodyTypography = toMuiTypography(studioTypography.roles.body);
  const labelTypography = toMuiTypography(studioTypography.roles.label);
  const metadataTypography = toMuiTypography(studioTypography.roles.metadata);

  return createTheme({
    cssVariables: {
      colorSchemeSelector: 'data-mui-color-scheme'
    },
    colorSchemes: {
      dark: toMuiPalette(studioColors.dark),
      light: toMuiPalette(studioColors.light)
    },
    shape: {
      borderRadius: studioRadius.control
    },
    spacing: studioMuiSpacingBase,
    typography: {
      body1: toMuiTypography(studioTypography.roles.body),
      body2: toMuiTypography(studioTypography.roles.body),
      button: {
        ...labelTypography,
        textTransform: studioTypography.buttonTextTransform
      },
      caption: toMuiTypography(studioTypography.roles.metadata),
      fontFamily: studioTypography.family.interface,
      fontSize: studioTypography.roles.body.size,
      h6: toMuiTypography(studioTypography.roles.appTitle),
      htmlFontSize: studioTypography.rootSize,
      overline: {
        ...toMuiTypography(studioTypography.roles.sectionLabel),
        letterSpacing: studioTypography.sectionLabelTracking,
        textTransform: studioTypography.sectionLabelTransform
      },
      subtitle1: toMuiTypography(studioTypography.roles.panelTitle),
      subtitle2: toMuiTypography(studioTypography.roles.sectionTitle)
    },
    components: {
      MuiAccordion: {
        defaultProps: { disableGutters: true, elevation: 0 }
      },
      MuiButton: {
        defaultProps: { disableElevation: true, size: 'small' },
        styleOverrides: {
          root: { minHeight: studioGeometry.toolbarControlSize, paddingInline: inset(studioSpace.space8) }
        }
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
      MuiInputLabel: {
        styleOverrides: { root: bodyTypography }
      },
      MuiListItemButton: {
        defaultProps: { dense: true }
      },
      MuiIconButton: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            borderRadius: studioRadius.control,
            height: studioGeometry.toolbarControlSize,
            width: studioGeometry.toolbarControlSize
          }
        }
      },
      MuiSelect: {
        defaultProps: { size: 'small' }
      },
      MuiSwitch: {
        defaultProps: { size: 'small' }
      },
      MuiTab: {
        styleOverrides: {
          root: {
            ...labelTypography,
            textTransform: studioTypography.buttonTextTransform
          }
        }
      },
      MuiTooltip: {
        defaultProps: { arrow: true, enterDelay: 450 },
        styleOverrides: { tooltip: metadataTypography }
      },
      MuiToggleButton: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            ...labelTypography,
            minHeight: studioGeometry.toolbarControlSize,
            paddingInline: inset(studioSpace.space8),
            textTransform: studioTypography.buttonTextTransform
          }
        }
      }
    }
  });
}
