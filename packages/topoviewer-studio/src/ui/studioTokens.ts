/**
 * Studio shell geometry. The frame is one command bar, persistent project
 * source, a resizable source/preview workbench, one contextual drawer, one
 * session dock, and one quiet status bar.
 */
export const studioGeometry = Object.freeze({
  canvasMinimumWidth: 420,
  commandBarHeight: 42,
  contextBarHeight: 36,
  dockCollapsedHeight: 30,
  dockHeight: 142,
  navigatorWidth: 246,
  objectDrawerWidth: 234,
  panelMaximumWidth: 560,
  panelMinimumWidth: 292,
  /** Both desktop drawers coexist only when this much preview width remains. */
  independentDrawerMinimumPreviewWidth: 234 + 292 + 420,
  previewBarHeight: 36,
  projectNameMaximumWidth: 320,
  readoutHeight: 24,
  resizerWidth: 5,
  /** Canvas-attached controls keep their own touch-friendly size. */
  toolbarControlSize: 30
});

/**
 * Corner radii. Controls are crisp instruments; docked chrome keeps square
 * edges because it is architecture rather than a floating card.
 */
export const studioRadius = Object.freeze({
  control: 3,
  round: 999,
  surface: 6
});

/** Stacking order shared by every Studio surface. Keep the scale sparse so new layers slot between existing ones. */
export const studioLayer = Object.freeze({
  workspaceContent: 1,
  inlineAction: 2,
  panel: 20,
  panelResizer: 24,
  drawer: 80,
  scrim: 100
});

export const studioCssGeometry = Object.freeze({
  '--studio-canvas-min-width': `${studioGeometry.canvasMinimumWidth}px`,
  '--studio-command-bar-height': `${studioGeometry.commandBarHeight}px`,
  '--studio-context-bar-height': `${studioGeometry.contextBarHeight}px`,
  '--studio-dock-collapsed-height': `${studioGeometry.dockCollapsedHeight}px`,
  '--studio-dock-height': `${studioGeometry.dockHeight}px`,
  '--studio-navigator-width': `${studioGeometry.navigatorWidth}px`,
  '--studio-object-drawer-width': `${studioGeometry.objectDrawerWidth}px`,
  '--studio-panel-max-width': `${studioGeometry.panelMaximumWidth}px`,
  '--studio-panel-min-width': `${studioGeometry.panelMinimumWidth}px`,
  '--studio-preview-bar-height': `${studioGeometry.previewBarHeight}px`,
  '--studio-readout-height': `${studioGeometry.readoutHeight}px`,
  '--studio-resizer-width': `${studioGeometry.resizerWidth}px`,
  '--studio-toolbar-control-size': `${studioGeometry.toolbarControlSize}px`
});
