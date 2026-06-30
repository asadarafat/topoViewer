import { describe, expect, it } from 'vitest';
import { sanitizeSvg, isSafeImageReference } from '../../src/core/security';
import { markdownToHtml } from '../../src/core/style';

describe('hostile content sanitization', () => {
  it('removes executable SVG payloads while preserving safe geometry', () => {
    const sanitized = sanitizeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg">
        <style>.ok { fill: #001135; }</style>
        <script>alert("x")</script>
        <foreignObject><body onload="alert(1)">bad</body></foreignObject>
        <a href="javascript:alert(1)"><rect width="10" height="10" onclick="alert(1)" /></a>
        <path d="M0 0h10" onmouseover=alert(2) style="background:url(javascript:alert(3))" />
        <circle cx="5" cy="5" r="4" fill="#fff" />
      </svg>
    `);

    expect(sanitized).toContain('<circle');
    expect(sanitized).toContain('<style>');
    expect(sanitized).not.toMatch(/<script/i);
    expect(sanitized).not.toMatch(/foreignObject/i);
    expect(sanitized).not.toMatch(/\son[a-z]+\s*=/i);
    expect(sanitized).not.toMatch(/javascript:/i);
  });

  it('accepts only inert image references for Markdown and icon URLs', () => {
    expect(isSafeImageReference('https://example.test/icon.png')).toBe(true);
    expect(isSafeImageReference('./icon.png')).toBe(true);
    expect(isSafeImageReference('data:image/png;base64,AAAA')).toBe(true);
    expect(isSafeImageReference('data:image/svg+xml,<svg onload=alert(1)>')).toBe(false);
    expect(isSafeImageReference('javascript:alert(1)')).toBe(false);
    expect(isSafeImageReference('https://example.test/icon.png\nonerror=alert(1)')).toBe(false);
  });

  it('keeps hostile Markdown and callout HTML inert', () => {
    const html = markdownToHtml([
      '# <script>alert(1)</script>',
      '![bad](javascript:alert(1))',
      '[bad](javascript:alert(2))',
      '<img src=x onerror=alert(3)>',
      '**safe emphasis**'
    ]);

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(3)&gt;');
    expect(html).toContain('<strong>safe emphasis</strong>');
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/href="javascript:/i);
    expect(html).not.toMatch(/src="javascript:/i);
    expect(html).not.toMatch(/<img src=x/i);
  });
});
