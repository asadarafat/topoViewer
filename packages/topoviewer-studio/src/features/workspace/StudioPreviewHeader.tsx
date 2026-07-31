import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import { StudioTextField, StudioToggleButton, StudioToggleButtonGroup } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';
import type { StudioPreviewMode } from './workbenchLayout';

interface StudioPreviewHeaderProps {
  editDisabled?: boolean;
  linkCount: number;
  mode: StudioPreviewMode;
  nodeCount: number;
  onModeChange(mode: StudioPreviewMode): void;
  onSearch(query: string): void;
}

export function StudioPreviewHeader({
  editDisabled = false,
  linkCount,
  mode,
  nodeCount,
  onModeChange,
  onSearch
}: StudioPreviewHeaderProps) {
  return (
    <Box
      aria-label="Preview controls"
      sx={{
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        gap: studioSpace.space6,
        minHeight: 'var(--studio-preview-bar-height)',
        minWidth: 0,
        px: studioSpace.space6
      }}
    >
      <StudioToggleButtonGroup
        aria-label="Topology interaction mode"
        exclusive
        onChange={(_event, value: StudioPreviewMode | null) => {
          if (value) onModeChange(value);
        }}
        size="small"
        sx={{
          bgcolor: 'background.default',
          flexShrink: 0,
          '& .MuiToggleButton-root': {
            color: 'text.secondary',
            minHeight: 24,
            minWidth: 48,
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
        value={mode}
      >
        <StudioToggleButton
          aria-pressed={mode === 'edit'}
          disabled={editDisabled}
          title={editDisabled ? 'Correct or revert the invalid topology draft to edit the preview' : undefined}
          value="edit"
        >
          Edit
        </StudioToggleButton>
        <StudioToggleButton aria-pressed={mode === 'inspect'} value="inspect">
          Inspect
        </StudioToggleButton>
      </StudioToggleButtonGroup>
      <StudioTextField
        aria-label="Find topology object"
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          onSearch((event.target as HTMLInputElement).value);
        }}
        placeholder="Find object"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon fontSize="small" />
              </InputAdornment>
            )
          }
        }}
        sx={{
          maxWidth: 260,
          minWidth: 100,
          width: 'min(34%, 260px)',
          '& .MuiInputBase-root': { height: 28 }
        }}
        type="search"
      />
      <Typography
        color="text.secondary"
        noWrap
        sx={{ ml: 'auto' }}
        variant="caption"
      >
        {editDisabled ? 'last valid preview · source draft invalid' : 'source-linked'} · {nodeCount} nodes · {linkCount} links
      </Typography>
    </Box>
  );
}
