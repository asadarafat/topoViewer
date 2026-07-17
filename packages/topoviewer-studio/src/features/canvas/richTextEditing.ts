export interface RichTextEditResult {
  selectionEnd: number;
  selectionStart: number;
  text: string;
}

function boundedSelection(text: string, start: number, end: number) {
  const selectionStart = Math.max(0, Math.min(text.length, start));
  const selectionEnd = Math.max(selectionStart, Math.min(text.length, end));
  return { selectionEnd, selectionStart };
}

export function wrapRichTextSelection(text: string, start: number, end: number, prefix: string, suffix: string, placeholder: string): RichTextEditResult {
  const selection = boundedSelection(text, start, end);
  const selected = text.slice(selection.selectionStart, selection.selectionEnd) || placeholder;
  const replacement = `${prefix}${selected}${suffix}`;
  return {
    selectionStart: selection.selectionStart + prefix.length,
    selectionEnd: selection.selectionStart + prefix.length + selected.length,
    text: `${text.slice(0, selection.selectionStart)}${replacement}${text.slice(selection.selectionEnd)}`
  };
}

export function prefixRichTextLines(text: string, start: number, end: number, prefix: string): RichTextEditResult {
  const selection = boundedSelection(text, start, end);
  const lineStart = text.lastIndexOf('\n', Math.max(0, selection.selectionStart - 1)) + 1;
  const nextLine = text.indexOf('\n', selection.selectionEnd);
  const lineEnd = nextLine < 0 ? text.length : nextLine;
  const block = text.slice(lineStart, lineEnd);
  const replacement = block
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
  return {
    selectionStart: lineStart,
    selectionEnd: lineStart + replacement.length,
    text: `${text.slice(0, lineStart)}${replacement}${text.slice(lineEnd)}`
  };
}
