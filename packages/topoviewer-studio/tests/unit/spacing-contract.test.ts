import { describe, expect, it } from 'vitest';
import { studioMonacoSpacing } from '../../src/features/workspace/monacoSpacing';
import { createStudioTheme } from '../../src/ui/createStudioTheme';
import { studioCssSpacing } from '../../src/ui/cssSpacing';
import { studioLayoutSpacing, studioMuiSpacingBase, studioSpace } from '../../src/ui/muiSpacing';
import { studioSpacing } from '../../src/ui/spacingContract';

describe('Studio spacing ownership', () => {
  it('keeps one immutable scale and constrains every semantic role to it', () => {
    expect(Object.isFrozen(studioSpacing)).toBe(true);
    expect(Object.isFrozen(studioSpacing.scale)).toBe(true);
    expect(Object.isFrozen(studioSpacing.roles)).toBe(true);
    expect(Object.values(studioSpacing.scale)).toEqual([0, 2, 4, 6, 8, 10, 12, 16, 24]);

    const approved = new Set(Object.values(studioSpacing.scale));
    for (const value of Object.values(studioSpacing.roles)) expect(approved.has(value)).toBe(true);
  });

  it('maps canonical pixels exactly into MUI factors and the theme spacing function', () => {
    const theme = createStudioTheme();
    expect(studioMuiSpacingBase).toBe(studioSpacing.baseUnit);

    for (const [name, pixels] of Object.entries(studioSpacing.scale) as Array<[keyof typeof studioSpacing.scale, number]>) {
      expect(studioSpace[name] * studioMuiSpacingBase).toBe(pixels);
    }

    for (const [name, pixels] of Object.entries(studioSpacing.roles) as Array<[keyof typeof studioSpacing.roles, number]>) {
      expect(studioLayoutSpacing[name] * studioMuiSpacingBase).toBe(pixels);
    }
    expect(theme.spacing(studioSpace.space8)).toContain(`--mui-spacing, ${studioSpacing.baseUnit}px`);
  });

  it('derives CSS and Monaco boundary values without redefining spacing', () => {
    expect(studioCssSpacing).toMatchObject({
      '--studio-space-2': `${studioSpacing.scale.space2}px`,
      '--studio-space-24': `${studioSpacing.scale.space24}px`,
      '--studio-space-editor-inset': `${studioSpacing.roles.editorInset}px`,
      '--studio-space-panel-inline': `${studioSpacing.roles.panelInline}px`
    });
    expect(studioMonacoSpacing).toEqual({ paddingTop: studioSpacing.roles.editorInset });
  });
});
