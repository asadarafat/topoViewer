import { describe, expect, it } from 'vitest';
import { studioWebviewContentSecurityPolicy } from '../../src/extension/webviewSecurity';

describe('VS Code Studio webview CSP', () => {
  it('allows only nonce scripts and local/data/blob rendering assets', () => {
    const policy = studioWebviewContentSecurityPolicy('vscode-webview://unit-test', 'abcdefghijklmnop');
    expect(policy).toContain("default-src 'none'");
    expect(policy).toContain("script-src 'nonce-abcdefghijklmnop'");
    expect(policy).toContain('img-src vscode-webview://unit-test data: blob:');
    expect(policy).not.toMatch(/https?:/);
    expect(policy).not.toContain("script-src 'unsafe-inline'");
    expect(policy).not.toContain('connect-src');
  });

  it('rejects injectable CSP sources and weak nonces', () => {
    expect(() => studioWebviewContentSecurityPolicy("vscode-webview://ok; script-src *", 'abcdefghijklmnop')).toThrow(/source is invalid/i);
    expect(() => studioWebviewContentSecurityPolicy('vscode-webview://ok', 'short')).toThrow(/nonce is invalid/i);
  });
});
