import type { StudioProject, StudioProjectMigration } from '../contracts/project';

export const currentStudioProjectSchemaVersion = 1;

const projectMigrations: StudioProjectMigration[] = [
  {
    fromVersion: 0,
    id: 'initialize-versioned-project-metadata',
    migrate(project) {
      const migrated = structuredClone(project);
      migrated.assets ||= [];
      migrated.metadata.profileVersion = Math.max(1, Number(migrated.metadata.profileVersion) || 1);
      migrated.metadata.schemaVersion = 1;
      return migrated;
    },
    toVersion: 1
  }
];

export interface StudioProjectMigrationResult {
  applied: string[];
  project: StudioProject;
}

export function migrateStudioProject(project: StudioProject): StudioProjectMigrationResult {
  const fromVersion = Number(project.metadata.schemaVersion);
  if (!Number.isInteger(fromVersion) || fromVersion < 0) throw new Error('Project schema version is invalid.');
  if (fromVersion > currentStudioProjectSchemaVersion) {
    throw new Error(`Project schema ${fromVersion} is newer than supported schema ${currentStudioProjectSchemaVersion}.`);
  }
  let current = structuredClone(project);
  const applied: string[] = [];
  while (current.metadata.schemaVersion < currentStudioProjectSchemaVersion) {
    const migration = projectMigrations.find((candidate) => candidate.fromVersion === current.metadata.schemaVersion);
    if (!migration || migration.toVersion <= migration.fromVersion) {
      throw new Error(`No reviewed forward migration exists from project schema ${current.metadata.schemaVersion}.`);
    }
    current = migration.migrate(current);
    if (current.metadata.schemaVersion !== migration.toVersion) {
      throw new Error(`Migration "${migration.id}" did not produce schema ${migration.toVersion}.`);
    }
    applied.push(migration.id);
  }
  return { applied, project: current };
}
