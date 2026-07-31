import { Component, type ErrorInfo, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { StudioButton, StudioDialog, StudioDialogContent } from '../ui/controls';
import { studioSpace } from '../ui/muiSpacing';

export type StudioOptionalSurface = 'asset' | 'export' | 'mapper';

interface StudioOptionalSurfaceBoundaryProps {
  children: ReactNode;
  message: string;
  modalLabel?: string;
  onClose(): void;
  onRetry?(): void;
  panelLabel?: string;
  resetKey?: string | number;
  surfaceLabel: string;
}

interface StudioOptionalSurfaceBoundaryState {
  error?: Error;
}

export class StudioOptionalSurfaceBoundary extends Component<
  StudioOptionalSurfaceBoundaryProps,
  StudioOptionalSurfaceBoundaryState
> {
  state: StudioOptionalSurfaceBoundaryState = {};

  static getDerivedStateFromError(error: Error): StudioOptionalSurfaceBoundaryState {
    return { error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  componentDidUpdate(previous: StudioOptionalSurfaceBoundaryProps) {
    if (
      this.state.error &&
      previous.resetKey !== this.props.resetKey
    ) {
      this.setState({ error: undefined });
    }
  }

  private retry = () => {
    this.props.onRetry?.();
    this.setState({ error: undefined });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const content = (
      <Box
        sx={{
          display: 'grid',
          gap: studioSpace.space12
        }}
      >
        <Typography role="alert" variant="subtitle2">
          {this.props.message}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Source and preview remain available.
        </Typography>
        <Box sx={{ display: 'flex', gap: studioSpace.space8 }}>
          <StudioButton
            onClick={this.retry}
            variant="contained"
          >
            Retry {this.props.surfaceLabel.toLowerCase()}
          </StudioButton>
          <StudioButton onClick={this.props.onClose} variant="outlined">
            Close {this.props.surfaceLabel.toLowerCase()}
          </StudioButton>
        </Box>
      </Box>
    );

    if (!this.props.modalLabel) {
      return (
        <Box
          aria-label={this.props.panelLabel}
          role={this.props.panelLabel ? 'region' : undefined}
          sx={{
            display: 'grid',
            height: '100%',
            minHeight: 0,
            p: studioSpace.space16,
            placeContent: 'start'
          }}
        >
          {content}
        </Box>
      );
    }

    return (
      <StudioDialog
        onClose={this.props.onClose}
        open
        slotProps={{
          paper: {
            'aria-label': this.props.modalLabel
          }
        }}
      >
        <StudioDialogContent dividers={false} sx={{ p: studioSpace.space24 }}>
          {content}
        </StudioDialogContent>
      </StudioDialog>
    );
  }
}

export function StudioOptionalSurfaceFailureProbe({
  surface
}: {
  surface: StudioOptionalSurface;
}): never {
  throw new Error(`Intentional ${surface} surface failure.`);
}
