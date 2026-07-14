import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourceRoot = fileURLToPath(new URL('../../src/', import.meta.url));

function sourceFiles(directory = sourceRoot): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.tsx') ? [path] : [];
  });
}

function relative(path: string) {
  return path.slice(sourceRoot.length);
}

describe('Studio MUI surface ownership', () => {
  it('does not hand-build controls, form fields, tables, or overlays', () => {
    const violations = sourceFiles().flatMap((path) => {
      const source = readFileSync(path, 'utf8');
      const rawElements = [...source.matchAll(/<(a|article|aside|button|canvas|dd|details|dialog|div|dl|dt|fieldset|figure|footer|form|h[1-6]|header|img|input|label|legend|li|main|nav|ol|option|p|pre|section|select|small|span|strong|summary|svg|table|tbody|td|textarea|tfoot|th|thead|time|tr|ul)\b/g)]
        .map((match) => `raw <${match[1]}>`);
      const customOverlays = [...source.matchAll(/<[^>]+\srole=["'](dialog|alertdialog|menu|menuitem|listbox)["']/g)]
        .map((match) => `custom role=${match[1]}`);
      const materialBarrel = source.includes("from '@mui/material'") ? ['MUI barrel import'] : [];
      return [...rawElements, ...customOverlays, ...materialBarrel]
        .map((message) => `${relative(path)}: ${message}`);
    });

    expect(violations).toEqual([]);
  });

  it('uses the composed MUI select instead of native select mode', () => {
    const controls = readFileSync(`${sourceRoot}ui/controls.tsx`, 'utf8');
    expect(controls).not.toMatch(/<Select[\s\S]*?\bnative(?:=|\s|>)/);
  });
});
