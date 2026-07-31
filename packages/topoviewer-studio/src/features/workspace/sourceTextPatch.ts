export interface StudioSourceTextPatch {
  endOffset: number;
  startOffset: number;
  text: string;
}

const sourceTokenCharacter = /[\p{L}\p{N}_.-]/u;

/**
 * Finds one deterministic replacement spanning every changed character.
 * Direct-manipulation commands normally produce a small scalar patch, while
 * structural edits safely fall back to the smallest shared-prefix/suffix span.
 */
export function createStudioSourceTextPatch(
  current: string,
  next: string
): StudioSourceTextPatch | undefined {
  if (current === next) return undefined;

  const sharedLimit = Math.min(current.length, next.length);
  let startOffset = 0;
  while (startOffset < sharedLimit && current[startOffset] === next[startOffset]) {
    startOffset += 1;
  }

  let currentEnd = current.length;
  let nextEnd = next.length;
  while (
    currentEnd > startOffset &&
    nextEnd > startOffset &&
    current[currentEnd - 1] === next[nextEnd - 1]
  ) {
    currentEnd -= 1;
    nextEnd -= 1;
  }

  while (
    startOffset > 0 &&
    sourceTokenCharacter.test(current[startOffset - 1] || '') &&
    sourceTokenCharacter.test(next[startOffset - 1] || '')
  ) {
    startOffset -= 1;
  }
  while (currentEnd < current.length && sourceTokenCharacter.test(current[currentEnd] || '')) {
    currentEnd += 1;
  }
  while (nextEnd < next.length && sourceTokenCharacter.test(next[nextEnd] || '')) {
    nextEnd += 1;
  }

  return {
    endOffset: currentEnd,
    startOffset,
    text: next.slice(startOffset, nextEnd)
  };
}

export function applyStudioSourceTextPatch(
  current: string,
  patch?: StudioSourceTextPatch
): string {
  return patch
    ? current.slice(0, patch.startOffset) + patch.text + current.slice(patch.endOffset)
    : current;
}
