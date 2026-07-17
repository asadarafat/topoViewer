import { Component, type ErrorInfo, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { StudioDocumentKind } from '../../contracts/project';
import { StudioTextarea } from '../../ui/controls';
import { studioMuiCodeTypography } from '../../ui/createStudioTheme';

interface YamlEditorBoundaryProps {
  children: ReactNode;
  document: StudioDocumentKind;
  onChange(value: string): void;
  value: string;
}

interface YamlEditorBoundaryState {
  failed: boolean;
}

export class YamlEditorBoundary extends Component<YamlEditorBoundaryProps, YamlEditorBoundaryState> {
  state = { failed: false };

  static getDerivedStateFromError(): YamlEditorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Box className="studio-editor-fallback" role="alert">
        <Typography variant="body2">Enhanced YAML editing is unavailable. Raw source editing remains available.</Typography>
        <StudioTextarea
          aria-label={`${this.props.document} YAML editor`}
          onChange={(event) => this.props.onChange(event.target.value)}
          rows={12}
          slotProps={{ input: { sx: studioMuiCodeTypography } }}
          spellCheck={false}
          value={this.props.value}
        />
      </Box>
    );
  }
}
