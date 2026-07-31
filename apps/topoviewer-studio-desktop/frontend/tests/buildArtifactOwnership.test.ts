import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { desktopFrontendOutDir } from '../vite.config';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
) as {
  scripts: Record<string, string>;
};

describe('Desktop frontend build artifact ownership', () => {
  it('keeps golden test fixtures outside the production Wails frontend', () => {
    const production = desktopFrontendOutDir('production');
    const golden = desktopFrontendOutDir('golden');

    expect(path.basename(production)).toBe('dist');
    expect(golden).toContain(path.join('.artifacts', 'topoviewer-studio', 'desktop-golden-site'));
    expect(golden).not.toBe(production);
    expect(packageJson.scripts['preview:golden']).toContain('--mode golden');
  });

  it('uses the canonical TopoViewer artwork for the Wails application icon', () => {
    const canonical = readFileSync(
      new URL('../../../../docs/assets/logo/topoviewer-mark-1024.png', import.meta.url)
    );
    const appIcon = readFileSync(new URL('../../build/appicon.png', import.meta.url));

    expect(appIcon.equals(canonical)).toBe(true);
  });
});
