import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import { StudioIconButton } from '../../ui/controls';

interface YamlContextHelpButtonProps {
  onClick(): void;
}

export function YamlContextHelpButton({ onClick }: YamlContextHelpButtonProps) {
  return (
    <StudioIconButton aria-label="Show YAML context help" onClick={onClick} title="YAML context help">
      <HelpOutlinedIcon fontSize="small" />
    </StudioIconButton>
  );
}
