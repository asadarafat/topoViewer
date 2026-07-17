export const studioGeometry = Object.freeze({
  canvasMinimumWidth: 420,
  compactHeaderHeight: 80,
  footerHeight: 36,
  headerHeight: 48,
  railWidth: 48,
  toolbarControlSize: 30,
  workspaceMinimumWidth: 316
});

export const studioCssGeometry = Object.freeze({
  '--studio-canvas-min-width': `${studioGeometry.canvasMinimumWidth}px`,
  '--studio-compact-header-height': `${studioGeometry.compactHeaderHeight}px`,
  '--studio-footer-height': `${studioGeometry.footerHeight}px`,
  '--studio-header-height': `${studioGeometry.headerHeight}px`,
  '--studio-rail-width': `${studioGeometry.railWidth}px`,
  '--studio-toolbar-control-size': `${studioGeometry.toolbarControlSize}px`,
  '--studio-workspace-min-width': `${studioGeometry.workspaceMinimumWidth}px`
});
