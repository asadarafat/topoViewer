import Box, { type BoxProps } from '@mui/material/Box';
import { studioMuiCodeTypography } from './createStudioTheme';

export function StudioCodeBlock({ sx, ...props }: BoxProps) {
  return <Box component="pre" {...props} sx={[studioMuiCodeTypography, ...(Array.isArray(sx) ? sx : [sx])]} />;
}
