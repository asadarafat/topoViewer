import { Component, type ErrorInfo, type ReactNode } from 'react';

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
        <main className="studio-fatal-error" role="alert">
          <h1>Studio could not open</h1>
          <p>The project source has not been changed.</p>
          <pre>{this.state.error.message}</pre>
          <button type="button" onClick={() => this.setState({ error: undefined })}>Retry</button>
        </main>
      );
    }
    return this.props.children;
  }
}

