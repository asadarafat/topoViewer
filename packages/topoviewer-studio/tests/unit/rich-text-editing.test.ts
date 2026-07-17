import { describe, expect, it } from 'vitest';
import { safeMarkdownToHtml } from 'topoviewer';
import { prefixRichTextLines, wrapRichTextSelection } from '../../src/features/canvas/richTextEditing';

describe('Studio rich text editing', () => {
  it('wraps selected text while preserving an editable selection', () => {
    expect(wrapRichTextSelection('Mission ready', 0, 7, '**', '**', 'bold text')).toEqual({
      selectionEnd: 9,
      selectionStart: 2,
      text: '**Mission** ready'
    });
  });

  it('prefixes every selected line for list and heading commands', () => {
    expect(prefixRichTextLines('Router A\nRouter B', 0, 17, '- ')).toEqual({
      selectionEnd: 21,
      selectionStart: 0,
      text: '- Router A\n- Router B'
    });
  });

  it('renders formatting while escaping hostile HTML', () => {
    const html = safeMarkdownToHtml('**Ready**\n\n<script>alert(1)</script>');
    expect(html).toContain('<strong>Ready</strong>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
  });
});
