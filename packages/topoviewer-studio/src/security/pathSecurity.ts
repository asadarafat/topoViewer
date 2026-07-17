const maximumPathLength = 1_024;
const maximumSegmentLength = 255;

export function canonicalStudioPath(candidate: string): string {
  if (!candidate || candidate.length > maximumPathLength || candidate !== candidate.replaceAll('\\', '/') || candidate.startsWith('/') || /^[a-zA-Z]:/.test(candidate) || /[\u0000-\u001f\u007f]/.test(candidate)) {
    throw new Error(`Project path "${candidate}" is invalid.`);
  }
  const segments = candidate.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes(':') || segment.length > maximumSegmentLength)) {
    throw new Error(`Project path "${candidate}" is not canonical.`);
  }
  return candidate;
}
