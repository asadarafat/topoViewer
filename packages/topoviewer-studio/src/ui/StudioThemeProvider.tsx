import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { PropsWithChildren } from 'react';
import { createStudioTheme } from './createStudioTheme';

const studioTheme = createStudioTheme();

export function StudioThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={studioTheme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
