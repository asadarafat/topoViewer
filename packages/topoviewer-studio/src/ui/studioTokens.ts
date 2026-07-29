/**
 * Studio shell geometry. The frame is a workbench: one thin command bar, one
 * dominant canvas, one docked authoring panel selected by an inboard rail, and
 * one quiet readout. Every measurement that shapes that frame lives here.
 */
export const studioGeometry = Object.freeze({
  canvasMinimumWidth: 420,
  commandBarHeight: 40,
  panelMaximumWidth: 560,
  panelMinimumWidth: 320,
  projectNameMaximumWidth: 320,
  railWidth: 44,
  readoutHeight: 24,
  resizerWidth: 8,
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
  '--studio-panel-max-width': `${studioGeometry.panelMaximumWidth}px`,
  '--studio-panel-min-width': `${studioGeometry.panelMinimumWidth}px`,
  '--studio-rail-width': `${studioGeometry.railWidth}px`,
  '--studio-readout-height': `${studioGeometry.readoutHeight}px`,
  '--studio-resizer-width': `${studioGeometry.resizerWidth}px`,
  '--studio-toolbar-control-size': `${studioGeometry.toolbarControlSize}px`
});
