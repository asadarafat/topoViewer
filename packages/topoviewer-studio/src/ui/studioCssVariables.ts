import { studioCssSpacing } from './cssSpacing';
import { studioCssGeometry } from './studioTokens';

export const studioCssVariables = Object.freeze({
  ...studioCssGeometry,
  ...studioCssSpacing
});
