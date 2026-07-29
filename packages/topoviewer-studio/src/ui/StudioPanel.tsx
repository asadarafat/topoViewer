import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { StudioIconButton } from './controls';
import { studioLayoutSpacing } from './muiSpacing';
import { studioGeometry } from './studioTokens';

/** Panel headers share the command bar's height so the frame keeps one horizontal rhythm. */
export function StudioPanelHeader({ actions, onCollapse, title }: { actions?: ReactNode; onCollapse?(): void; title: string }) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        gap: studioLayoutSpacing.contentGap,
        justifyContent: 'space-between',
        minHeight: studioGeometry.commandBarHeight,
        px: studioLayoutSpacing.panelInline,
        '@container studio-workspace (max-width: 280px)': {
          px: studioLayoutSpacing.contentGap
        }
      }}
    >
      <Typography component="h2" noWrap sx={{ minWidth: 0 }} variant="subtitle2">
        {title}
      </Typography>
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexShrink: 0,
          gap: studioLayoutSpacing.controlGap
        }}
      >
        {actions}
        {onCollapse ? (
          <StudioIconButton aria-label="Collapse workspace panel" onClick={onCollapse} title="Collapse workspace panel">
            <CloseIcon fontSize="small" />
          </StudioIconButton>
        ) : null}
      </Box>
    </Box>
  );
}

export function StudioPanelEmpty({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        color: 'text.secondary',
        display: 'grid',
        gap: studioLayoutSpacing.contentGap,
        p: studioLayoutSpacing.panelEmptyInset
      }}
    >
      {children}
    </Box>
  );
}
