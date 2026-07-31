import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
) as {
  scripts: Record<string, string>;
};

describe('Studio build artifact ownership', () => {
  it('keeps browser test builds outside the deployable Pages artifact', () => {
    const testOutput = 'TOPOVIEWER_STUDIO_OUT_DIR=../../.artifacts/topoviewer-studio/performance-site';

    expect(packageJson.scripts.build).toBe('vite build');
    expect(packageJson.scripts['build:performance']).toContain(testOutput);
    expect(packageJson.scripts['preview:performance']).toContain(testOutput);
  });
});
