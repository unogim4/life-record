// 배포용 서버: 빌드 결과(dist/) 제공 + 소설 API. 개발 중에는 vite.config.ts가 같은 API를 붙인다.
// 실행: npm run build && npm start
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFile } from './env.ts';
import { handleNovel } from './novel.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
loadEnvFile(path.join(ROOT, '.env'));
const PORT = Number(process.env.PORT) || 8080;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function send(res: http.ServerResponse, status: number, body: string | Buffer, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  const rel = path.normalize(urlPath === '/' ? '/index.html' : urlPath).replace(/^[/\\]+/, '');
  const file = path.join(DIST, rel);
  if (!file.startsWith(DIST + path.sep)) return send(res, 403, 'Forbidden');

  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found');
    send(res, 200, data, MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
  });
}

if (!fs.existsSync(DIST)) {
  console.error('dist/ 가 없습니다. 먼저 npm run build 를 실행하세요.');
  process.exit(1);
}

http
  .createServer((req, res) => {
    if (req.url?.startsWith('/api/novel')) return void handleNovel(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    serveStatic(req, res);
  })
  .listen(PORT, () => console.log(`인생기록부: http://localhost:${PORT}`));
