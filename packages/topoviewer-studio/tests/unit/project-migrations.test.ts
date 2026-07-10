import { describe, expect, it } from 'vitest';
import { createStarterProject } from '../../src/hosts/starterProject';
import { migrateStudioProject } from '../../src/hosts/projectMigrations';

describe('Studio project migrations', () => {
  it('applies the reviewed forward migration chain', () => {
    const project = createStarterProject();
    project.metadata.schemaVersion = 0;
    project.metadata.profileVersion = 0;
    const result = migrateStudioProject(project);
    expect(result.applied).toEqual(['initialize-versioned-project-metadata']);
    expect(result.project.metadata).toMatchObject({ profileVersion: 1, schemaVersion: 1 });
    expect(project.metadata.schemaVersion).toBe(0);
  });

  it('does not invent a downgrade path for future projects', () => {
    const project = createStarterProject();
    project.metadata.schemaVersion = 2;
    expect(() => migrateStudioProject(project)).toThrow(/newer than supported/);
  });
});
