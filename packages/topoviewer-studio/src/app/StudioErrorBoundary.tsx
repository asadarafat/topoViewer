import { Component, type ErrorInfo, type ReactNode } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { StudioButton } from '../ui/controls';
import { studioLayoutSpacing, studioSpace } from '../ui/muiSpacing';

interface StudioErrorBoundaryProps {
  children: ReactNode;
}

interface StudioErrorBoundaryState {
  error?: Error;
}

export class StudioErrorBoundary extends Component<StudioErrorBoundaryProps, StudioErrorBoundaryState> {
  state: StudioErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): StudioErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('TopoViewer Studio failed to render.', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <Paper component="main" role="alert" sx={{ m: 'auto', maxWidth: 480, p: studioLayoutSpacing.pageInset }}>
          <Stack spacing={studioSpace.space12}>
            <Typography component="h1" variant="h6">
              Studio could not open
            </Typography>
            <Typography color="text.secondary" variant="body2">
              The project source has not been changed.
            </Typography>
            <Typography
              component="pre"
              sx={{
                maxWidth: '100%',
                overflow: 'auto',
                whiteSpace: 'pre-wrap'
              }}
              variant="body2"
            >
              {this.state.error.message}
            </Typography>
            <StudioButton onClick={() => this.setState({ error: undefined })}>Retry</StudioButton>
          </Stack>
        </Paper>
      );
    }
    return this.props.children;
  }
}
