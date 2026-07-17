import { describe, expect, it } from 'vitest';
import { studioMonacoTypography } from '../../src/features/workspace/monacoTypography';
import { createStudioTheme, studioMuiCodeTypography } from '../../src/ui/createStudioTheme';
import { studioTypography } from '../../src/ui/typographyContract';

function rem(size: number): string {
  return `${size / studioTypography.rootSize}rem`;
}

describe('Studio typography ownership', () => {
  it('keeps the canonical contract immutable and above its metadata floor', () => {
    expect(Object.isFrozen(studioTypography)).toBe(true);
    expect(Object.isFrozen(studioTypography.family)).toBe(true);
    expect(Object.isFrozen(studioTypography.roles)).toBe(true);

    for (const role of Object.values(studioTypography.roles)) {
      expect(Object.isFrozen(role)).toBe(true);
      expect(role.size).toBeGreaterThanOrEqual(studioTypography.roles.metadata.size);
      expect(role.lineHeight).toBeGreaterThanOrEqual(role.size);
    }
  });

  it('maps the canonical roles into the MUI theme without redefining values', () => {
    const theme = createStudioTheme();

    expect(theme.typography.fontFamily).toBe(studioTypography.family.interface);
    expect(theme.typography.fontSize).toBe(studioTypography.roles.body.size);
    expect(theme.typography.htmlFontSize).toBe(studioTypography.rootSize);
    expect(theme.typography.h6).toMatchObject({
      fontSize: rem(studioTypography.roles.appTitle.size),
      fontWeight: studioTypography.roles.appTitle.weight,
      lineHeight: studioTypography.roles.appTitle.lineHeight / studioTypography.roles.appTitle.size
    });
    expect(theme.typography.subtitle1).toMatchObject({
      fontSize: rem(studioTypography.roles.panelTitle.size),
      fontWeight: studioTypography.roles.panelTitle.weight
    });
    expect(theme.typography.subtitle2).toMatchObject({
      fontSize: rem(studioTypography.roles.sectionTitle.size),
      fontWeight: studioTypography.roles.sectionTitle.weight
    });
    expect(theme.typography.body1).toMatchObject({
      fontSize: rem(studioTypography.roles.body.size),
      fontWeight: studioTypography.roles.body.weight
    });
    expect(theme.typography.body2).toMatchObject({
      fontSize: rem(studioTypography.roles.body.size),
      fontWeight: studioTypography.roles.body.weight
    });
    expect(theme.typography.caption).toMatchObject({
      fontSize: rem(studioTypography.roles.metadata.size),
      fontWeight: studioTypography.roles.metadata.weight
    });
  });

  it('derives MUI code text and Monaco options from the same code role', () => {
    expect(studioMuiCodeTypography).toMatchObject({
      fontFamily: studioTypography.family.code,
      fontSize: rem(studioTypography.roles.code.size),
      fontWeight: studioTypography.roles.code.weight,
      lineHeight: studioTypography.roles.code.lineHeight / studioTypography.roles.code.size
    });
    expect(studioMonacoTypography).toEqual({
      fontFamily: studioTypography.family.code,
      fontSize: studioTypography.roles.code.size,
      lineHeight: studioTypography.roles.code.lineHeight
    });
  });
});
