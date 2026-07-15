import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

/**
 * Тайлы, которые будут всегда возвращать 404.
 * Формат строки: "z/x/y"
 *
 * Чтобы узнать нужные z/x/y — откройте DevTools → Network,
 * отфильтруйте по /tiles/ и посмотрите запросы.
 *
 * Пример для Амстердама на zoom 5–7:
 *   z=5: весь Zoom 5 имеет 32x32 тайла, Амстердам ~ 5/16/10
 *   z=6: Амстердам ~ 6/32/21
 *   z=7: Амстердам ~ 7/65/42
 */
const ERROR_TILES = new Set([
  '10/525/336',
  '10/527/337'
]);

export default defineConfig({
  define: {
    CESIUM_BASE_URL: JSON.stringify('/cesium'),
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/cesium/Build/CesiumUnminified/Assets', dest: 'cesium' },
        { src: 'node_modules/cesium/Build/CesiumUnminified/Workers', dest: 'cesium' },
        { src: 'node_modules/cesium/Build/CesiumUnminified/ThirdParty', dest: 'cesium' },
        { src: 'node_modules/cesium/Build/CesiumUnminified/Widgets', dest: 'cesium' },
      ],
    }),
    {
      name: 'local-tiles-fallback',
      configureServer(server) {
        server.middlewares.use('/tiles', (req, res, next) => {
          // req.url выглядит как "/5/16/10.png" → убираем слеш и .png
          const tileKey = req.url.replace(/^\//, '').replace(/\.png$/, '');

          // Симулируем 404 для заданных тайлов
          if (ERROR_TILES.has(tileKey)) {
            console.log(`[tile-error] 404 → /tiles${req.url}`);
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Tile not found (simulated)');
            return;
          }

          const tilePath = path.join(process.cwd(), 'public', 'tiles', req.url);
          if (fs.existsSync(tilePath)) {
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            fs.createReadStream(tilePath).pipe(res);
          } else {
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'no-cache');
            res.statusCode = 200;
            res.end(TRANSPARENT_PNG);
          }
        });
      },
    },
  ],
});
