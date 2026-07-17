import { studioSpacing } from './spacingContract';

export const studioCssSpacing = Object.freeze({
  '--studio-space-2': `${studioSpacing.scale.space2}px`,
  '--studio-space-4': `${studioSpacing.scale.space4}px`,
  '--studio-space-6': `${studioSpacing.scale.space6}px`,
  '--studio-space-8': `${studioSpacing.scale.space8}px`,
  '--studio-space-10': `${studioSpacing.scale.space10}px`,
  '--studio-space-12': `${studioSpacing.scale.space12}px`,
  '--studio-space-16': `${studioSpacing.scale.space16}px`,
  '--studio-space-24': `${studioSpacing.scale.space24}px`,
  '--studio-space-compact-gap': `${studioSpacing.roles.compactGap}px`,
  '--studio-space-content-gap': `${studioSpacing.roles.contentGap}px`,
  '--studio-space-control-gap': `${studioSpacing.roles.controlGap}px`,
  '--studio-space-editor-inset': `${studioSpacing.roles.editorInset}px`,
  '--studio-space-panel-inline': `${studioSpacing.roles.panelInline}px`,
  '--studio-space-section-gap': `${studioSpacing.roles.sectionGap}px`
});
