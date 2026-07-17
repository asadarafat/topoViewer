export interface StudioTypographyRole {
  lineHeight: number;
  size: number;
  weight: 400 | 500 | 600;
}

function role(size: number, lineHeight: number, weight: StudioTypographyRole['weight']): Readonly<StudioTypographyRole> {
  return Object.freeze({ lineHeight, size, weight });
}

export const studioTypography = Object.freeze({
  buttonTextTransform: 'none' as const,
  family: Object.freeze({
    code: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    interface: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  }),
  letterSpacing: 0,
  roles: Object.freeze({
    appTitle: role(20, 28, 500),
    body: role(14, 20, 400),
    code: role(13, 20, 400),
    label: role(14, 20, 600),
    metadata: role(12, 16, 400),
    panelTitle: role(16, 24, 600),
    sectionTitle: role(14, 20, 600)
  }),
  rootSize: 16
});
