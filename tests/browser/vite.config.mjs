import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const path = value => fileURLToPath(new URL(value, import.meta.url));
export default defineConfig(({ command }) => {
  if (command !== 'serve') throw new Error('The sample-data preview is local-only and cannot be built for deployment.');
  return {
    root: path('./'),
    envDir: path('./'),
    publicDir: path('../../public/'),
    resolve: { alias: [
      { find: /^convex\/react$/, replacement: path('./convex-mock.jsx') },
      { find: /^@convex-dev\/auth\/react$/, replacement: path('./auth-mock.js') },
    ] },
    server: { host: '127.0.0.1', port: 5174, strictPort: true, fs: { allow: [path('../../')] } },
  };
});
