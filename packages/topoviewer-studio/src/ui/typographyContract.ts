export interface StudioTypographyRole {
  lineHeight: number;
  size: number;
  weight: 400 | 500 | 600;
}

function role(size: number, lineHeight: number, weight: StudioTypographyRole['weight']): Readonly<StudioTypographyRole> {
  return Object.freeze({ lineHeight, size, weight });
}

/**
 * Workbench type: a dense instrument scale on the system stacks. UI text sits
 * at 13px with an 11px metadata floor, so panels read like a precision tool
 * rather than a document, and no webfont payload ships with Studio.
 */
export const studioTypography = Object.freeze({
  buttonTextTransform: 'none' as const,
  family: Object.freeze({
    code: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    interface: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  }),
  iconSize: Object.freeze({
    compact: 14,
    inline: 16
  }),
  letterSpacing: 0,
  roles: Object.freeze({
    appTitle: role(17, 24, 600),
    body: role(13, 18, 400),
    code: role(12, 18, 400),
    label: role(13, 18, 600),
    metadata: role(11, 16, 400),
    panelTitle: role(15, 22, 600),
    sectionLabel: role(11, 16, 600),
    sectionTitle: role(13, 18, 600)
  }),
  rootSize: 16,
  sectionLabelTracking: 0.8,
  sectionLabelTransform: 'uppercase' as const
});
