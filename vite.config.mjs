import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

export default defineConfig({
  define: {
    CESIUM_BASE_URL: JSON.stringify('/cesium'),
  },
  plugins: [
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
