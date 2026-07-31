import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
) as {
  scripts: Record<string, string>;
};
const rootPackageJson = JSON.parse(
  readFileSync(new URL('../../../../package.json', import.meta.url), 'utf8')
) as {
  scripts: Record<string, string>;
};
const repeatSuiteSource = readFileSync(
  new URL('../../../../scripts/run-studio-performance-suite.mjs', import.meta.url),
  'utf8'
);
const performanceWorkflowSource = readFileSync(
  new URL('../../../../.github/workflows/studio-performance.yml', import.meta.url),
  'utf8'
);

describe('Studio build artifact ownership', () => {
  it('keeps browser test builds outside the deployable Pages artifact', () => {
    const testOutput = 'TOPOVIEWER_STUDIO_OUT_DIR=../../.artifacts/topoviewer-studio/performance-site';

    expect(packageJson.scripts.build).toBe('vite build');
    expect(packageJson.scripts['build:performance']).toContain(testOutput);
    expect(packageJson.scripts['preview:performance']).toContain(testOutput);
  });

  it('prepares workspace dependencies and evidence before repeated performance runs', () => {
    const coreBuild = repeatSuiteSource.indexOf("['--workspace', 'topoviewer', 'run', 'build:lib']");
    const firstBenchmark = repeatSuiteSource.indexOf("['--workspace', 'topoviewer-studio', 'run', 'benchmark:unit']");

    expect(coreBuild).toBeGreaterThanOrEqual(0);
    expect(coreBuild).toBeLessThan(firstBenchmark);
    expect(repeatSuiteSource).toContain('fs.mkdirSync(outputRoot, { recursive: true })');
    expect(performanceWorkflowSource).toContain('if-no-files-found: warn');
  });

  it('builds the embedded desktop frontend before Wails binding generation', () => {
    expect(rootPackageJson.scripts['desktop:bindings:check']).toMatch(
      /^npm run desktop:frontend:build && /
    );
    expect(rootPackageJson.scripts['desktop:bindings:generate']).toMatch(
      /^npm run desktop:frontend:build && /
    );
  });
});
