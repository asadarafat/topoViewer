import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.yaml', 'application/yaml; charset=utf-8'],
  ['.yml', 'application/yaml; charset=utf-8']
]);

export const pagesBasePath = process.env.TOPOVIEWER_PAGES_BASE_PATH || '/topoviewer';

function normalizeBasePath(basePath) {
  const withSlash = basePath.startsWith('/') ? basePath : `/${basePath}`;
  return withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
}

export function pathForDocsRequest(siteRoot, requestUrl, basePath = pagesBasePath) {
  const parsed = new URL(requestUrl, 'http://127.0.0.1');
  const normalizedBasePath = normalizeBasePath(basePath);
  let urlPath = decodeURIComponent(parsed.pathname);

  if (urlPath === normalizedBasePath) {
    urlPath = '/';
  } else if (urlPath.startsWith(`${normalizedBasePath}/`)) {
    urlPath = urlPath.slice(normalizedBasePath.length);
  } else {
    return undefined;
  }

  let absolutePath = path.resolve(siteRoot, `.${urlPath}`);
  if (!absolutePath.startsWith(siteRoot)) {
    return undefined;
  }

  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
    absolutePath = path.join(absolutePath, 'index.html');
  } else if (!fs.existsSync(absolutePath) && !path.extname(absolutePath)) {
    absolutePath = path.join(absolutePath, 'index.html');
  }

  if (!absolutePath.startsWith(siteRoot)) {
    return undefined;
  }
  return absolutePath;
}

export function createDocsStaticServer({ siteRoot, host = '127.0.0.1', port = 0, basePath = pagesBasePath }) {
  const server = http.createServer((request, response) => {
    const absolutePath = pathForDocsRequest(siteRoot, request.url || '/', basePath);
    if (!absolutePath || !fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const contentType = mimeTypes.get(path.extname(absolutePath)) || 'application/octet-stream';
    response.writeHead(200, { 'content-type': contentType });
    fs.createReadStream(absolutePath).pipe(response);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(Number(port), host, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Could not determine docs preview server address.'));
        return;
      }
      resolve({ server, baseUrl: `http://${host}:${address.port}` });
    });
  });
}
