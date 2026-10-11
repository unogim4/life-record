import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { loadEnvFile } from './server/env.ts';
import { handleNovel } from './server/novel.ts';

// 개발 서버(npm run dev)와 미리보기 서버에 소설 API를 붙인다. 별도 프로세스가 필요 없다.
function novelApi(): Plugin {
  return {
    name: 'lifelog-novel-api',
    configureServer(server) {
      server.middlewares.use('/api/novel', (req, res) => void handleNovel(req, res));
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/novel', (req, res) => void handleNovel(req, res));
    },
  };
}

loadEnvFile(path.resolve('.env'));

export default defineConfig({
  plugins: [novelApi()],
  server: { port: 5173, strictPort: true },
});
