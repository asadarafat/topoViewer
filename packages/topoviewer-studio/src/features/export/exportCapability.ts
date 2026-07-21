import type { StudioHost } from '../../contracts/host';
import type { StudioDocumentSession } from '../../session';

interface StudioExportCapabilityOptions {
  announce(message: string): void;
  applyStylesheetCandidate(): boolean;
  host: StudioHost;
  session: StudioDocumentSession;
  setError(message?: string): void;
}

export function createStudioExportCapability({
  announce,
  applyStylesheetCandidate,
  host,
  session,
  setError
}: StudioExportCapabilityOptions) {
  return {
    async exportMapper() {
      if (!applyStylesheetCandidate()) return false;
      const mapper = session.snapshot().project.documents.mapper;
      if (!mapper) return false;
      const result = await host.exportArtifact({
        artifact: {
          bytes: new TextEncoder().encode(mapper.text),
          mediaType: 'application/yaml',
          name: mapper.path.split('/').at(-1) || 'mapper.yaml'
        },
        kind: 'files',
        suggestedName: mapper.path.split('/').at(-1) || 'mapper.yaml'
      });
      if (!result.ok) {
        const message = `Mapper export failed: ${result.error.message}`;
        setError(message);
        announce(message);
        return false;
      }
      setError(undefined);
      announce('Mapper exported');
      return true;
    }
  };
}
