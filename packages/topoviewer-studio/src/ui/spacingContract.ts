export interface StudioSpacingScale {
  none: 0;
  space2: 2;
  space4: 4;
  space6: 6;
  space8: 8;
  space10: 10;
  space12: 12;
  space16: 16;
  space24: 24;
}

const scale: Readonly<StudioSpacingScale> = Object.freeze({
  none: 0,
  space2: 2,
  space4: 4,
  space6: 6,
  space8: 8,
  space10: 10,
  space12: 12,
  space16: 16,
  space24: 24
});

export const studioSpacing = Object.freeze({
  baseUnit: scale.space8,
  roles: Object.freeze({
    compactGap: scale.space6,
    contentGap: scale.space8,
    controlGap: scale.space4,
    editorInset: scale.space8,
    pageInset: scale.space24,
    panelEmptyInset: scale.space16,
    panelInline: scale.space12,
    popoverOffset: scale.space6,
    propertyRowBlock: scale.space6,
    propertyRowInline: scale.space12,
    sectionGap: scale.space12
  }),
  scale
});

export type StudioSpacingRole = keyof typeof studioSpacing.roles;
export type StudioSpacingScaleName = keyof StudioSpacingScale;
