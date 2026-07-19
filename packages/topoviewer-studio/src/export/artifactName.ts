export function studioArtifactSlug(name: string, fallback = 'topoviewer'): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-|-$/g, '') || fallback
  );
}
