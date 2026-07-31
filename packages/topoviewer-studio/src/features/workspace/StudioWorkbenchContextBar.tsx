import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { StudioToggleButton, StudioToggleButtonGroup } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';
import { studioMuiCodeTypography } from '../../ui/createStudioTheme';
import type { StudioWorkbenchLayout } from './workbenchLayout';

interface StudioWorkbenchContextBarProps {
  breadcrumb: string;
  errorCount: number;
  layout: StudioWorkbenchLayout;
  onLayoutChange(layout: StudioWorkbenchLayout): void;
}

export function StudioWorkbenchContextBar({
  breadcrumb,
  errorCount,
  layout,
  onLayoutChange
}: StudioWorkbenchContextBarProps) {
  return (
    <Box
      aria-label="Workbench context"
      sx={{
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        columnGap: studioSpace.space6,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto auto',
        minHeight: 'var(--studio-context-bar-height)',
        minWidth: 0
      }}
    >
      <Typography
        noWrap
        sx={{
          ...studioMuiCodeTypography,
          color: 'text.secondary',
          minWidth: 0,
          px: studioSpace.space10
        }}
        title={breadcrumb}
      >
        {breadcrumb}
      </Typography>
      <StudioToggleButtonGroup
        aria-label="Workbench layout"
        exclusive
        onChange={(_event, value: StudioWorkbenchLayout | null) => {
          if (value) onLayoutChange(value);
        }}
        size="small"
        sx={{
          bgcolor: 'background.default',
          justifySelf: 'end',
          '& .MuiToggleButton-root': {
            color: 'text.primary',
            minHeight: 24,
            minWidth: 56,
            py: 0
          },
          '& .MuiToggleButton-root.Mui-selected': {
            bgcolor: 'primary.dark',
            color: 'primary.contrastText'
          },
          '& .MuiToggleButton-root.Mui-selected:hover': {
            bgcolor: 'primary.main'
          }
        }}
        value={layout}
      >
        <StudioToggleButton aria-pressed={layout === 'source'} value="source">
          Source
        </StudioToggleButton>
        <StudioToggleButton aria-pressed={layout === 'split'} value="split">
          Split
        </StudioToggleButton>
        <StudioToggleButton aria-pressed={layout === 'preview'} value="preview">
          Preview
        </StudioToggleButton>
      </StudioToggleButtonGroup>
      <Box
        sx={{
          alignItems: 'center',
          color: errorCount ? 'error.main' : 'success.main',
          display: 'flex',
          gap: studioSpace.space6,
          justifySelf: 'end',
          minWidth: 0,
          px: studioSpace.space8
        }}
      >
        {errorCount ? <ReportProblemOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
        <Typography component="span" noWrap variant="caption">
          {errorCount ? `${errorCount} invalid` : 'Valid'}
        </Typography>
      </Box>
    </Box>
  );
}
