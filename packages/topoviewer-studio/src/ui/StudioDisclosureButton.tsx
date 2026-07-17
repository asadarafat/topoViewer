import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { StudioButton } from './controls';

interface StudioDisclosureButtonProps {
  className?: string;
  collapsedLabel: string;
  controls: string;
  expanded: boolean;
  expandedLabel: string;
  onClick(): void;
}

export function StudioDisclosureButton({ className, collapsedLabel, controls, expanded, expandedLabel, onClick }: StudioDisclosureButtonProps) {
  return (
    <StudioButton
      aria-controls={controls}
      aria-expanded={expanded}
      className={['studio-panel-disclosure', className].filter(Boolean).join(' ')}
      endIcon={expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      onClick={onClick}
      sx={{ justifyContent: 'space-between', width: '100%' }}
      type="button"
      variant="text"
    >
      {expanded ? expandedLabel : collapsedLabel}
    </StudioButton>
  );
}
