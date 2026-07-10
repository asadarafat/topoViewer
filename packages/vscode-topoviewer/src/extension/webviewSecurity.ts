export function studioWebviewContentSecurityPolicy(cspSource: string, nonce: string): string {
  if (!cspSource || /[;\r\n]/.test(cspSource)) throw new Error('VS Code webview CSP source is invalid.');
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(nonce)) throw new Error('VS Code webview nonce is invalid.');
  return [
    "default-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    `img-src ${cspSource} data: blob:`,
    `font-src ${cspSource} data:`,
    `style-src ${cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
    `worker-src ${cspSource} blob:`,
    `child-src ${cspSource} blob:`
  ].join('; ');
}
