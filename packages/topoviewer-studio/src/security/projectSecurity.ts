import type { StudioAssetContent } from '../contracts/host';
import type { StudioProject } from '../contracts/project';
import { buildProjection } from '../session/projection';
import { validateStudioProjectEnvelope } from './projectEnvelopeSecurity';

export function validateStudioProjectContent(project: StudioProject, assets?: StudioAssetContent[]): StudioAssetContent[] {
  const validatedAssets = validateStudioProjectEnvelope(project, assets);
  const projection = buildProjection({
    topology: project.documents.topology.text,
    stylesheet: project.documents.stylesheet.text,
    ...(project.documents.mapper ? { mapper: project.documents.mapper.text } : {})
  });
  if (!projection.ok) throw new Error(`Studio project source is invalid: ${projection.diagnostics[0]?.message || 'validation failed'}`);
  return validatedAssets;
}
