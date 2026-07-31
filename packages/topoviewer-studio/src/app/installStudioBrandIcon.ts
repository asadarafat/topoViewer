export function installStudioBrandIcon(href: string, ownerDocument: Document = document): void {
  const icon = ownerDocument.querySelector<HTMLLinkElement>(
    'link[data-topoviewer-brand-icon="true"]'
  );
  if (icon) icon.href = href;
}
