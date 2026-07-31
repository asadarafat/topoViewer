import { Component, type ErrorInfo, type ReactNode } from 'react';
import { topoDiagnosticFromError } from '../core/renderContract';
import { topoViewerThemeClassName, topoViewerThemeStyle } from '../core/theme';
import type { TopoViewerDiagnostic, TopoViewerProps } from '../core/types';

export function renderTopoEmptyFallback(props: Pick<TopoViewerProps, 'emptyFallback'>, state: 'empty' | 'filtered-empty'): ReactNode {
  if (typeof props.emptyFallback === 'function') return props.emptyFallback(state);
  if (props.emptyFallback !== undefined) return props.emptyFallback;
  const filtered = state === 'filtered-empty';
  return (
    <div className="topoviewer-state topoviewer-state--empty" role="status" aria-live="polite">
      <strong>{filtered ? 'No objects match the active layers' : 'No topology objects'}</strong>
      <span>{filtered ? 'Choose another layer or clear the active filters.' : 'Add a node, shape, callout, or text object to begin.'}</span>
    </div>
  );
}

export function renderTopoErrorFallback(errorFallback: TopoViewerProps['errorFallback'], diagnostics: readonly TopoViewerDiagnostic[]): ReactNode {
  if (typeof errorFallback === 'function') return errorFallback(diagnostics);
  if (errorFallback !== undefined) return errorFallback;
  return (
    <div className="topoviewer-state topoviewer-state--error" role="alert" aria-live="assertive">
      <strong>Topology could not be rendered</strong>
      <span>{diagnostics[0]?.message || 'An unexpected renderer error occurred.'}</span>
    </div>
  );
}

interface BoundaryProps extends Pick<TopoViewerProps, 'className' | 'colorMode' | 'document' | 'errorFallback' | 'onDiagnostics' | 'style' | 'theme'> {
  children: ReactNode;
}

interface BoundaryState {
  diagnostics?: readonly TopoViewerDiagnostic[];
}

export class TopoViewerRenderBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = {};

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { diagnostics: [topoDiagnosticFromError(error, 'render-error')] };
  }

  componentDidCatch(_error: unknown, _info: ErrorInfo): void {
    if (this.state.diagnostics) this.props.onDiagnostics?.(this.state.diagnostics);
  }

  componentDidUpdate(previous: BoundaryProps): void {
    if (this.state.diagnostics && previous.document !== this.props.document) {
      this.setState({ diagnostics: undefined });
    }
  }

  render(): ReactNode {
    if (!this.state.diagnostics) return this.props.children;
    const colorMode = this.props.colorMode || 'dark';
    const className = ['topoviewer', topoViewerThemeClassName(colorMode), this.props.className || ''].filter(Boolean).join(' ');
    const style = { ...topoViewerThemeStyle(colorMode, this.props.theme), ...this.props.style };
    return (
      <div
        className={className}
        style={style}
        role="region"
        aria-label={this.props.document.graph?.id || 'TopoViewer diagram'}
      >
        {renderTopoErrorFallback(this.props.errorFallback, this.state.diagnostics)}
      </div>
    );
  }
}

export function renderTopoViewerBoundary(props: TopoViewerProps, children: ReactNode): ReactNode {
  return (
    <TopoViewerRenderBoundary
      className={props.className}
      colorMode={props.colorMode}
      document={props.document}
      errorFallback={props.errorFallback}
      onDiagnostics={props.onDiagnostics}
      style={props.style}
      theme={props.theme}
    >
      {children}
    </TopoViewerRenderBoundary>
  );
}
