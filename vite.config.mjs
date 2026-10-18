import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import { testModeEnabled } from './local-test/guard.mjs';
import { localTestServer } from './local-test/server.mjs';
const path = name => fileURLToPath(new URL(name, import.meta.url));
export default defineConfig(({ command, mode }) => {
 const enabled = testModeEnabled(command, mode, {...loadEnv(mode, process.cwd(), ''), ...process.env});
 return {
  define: { __LOCAL_TEST_MODE__: JSON.stringify(enabled) },
  resolve: enabled ? {alias: [
   {find:/^convex\/react$/, replacement:path('./local-test/client.jsx')},
   {find:/^@convex-dev\/auth\/react$/,replacement:path('./local-test/auth.js')},
  ]} : undefined,
  plugins: enabled ? [localTestServer()] : [],
  server: {host:'127.0.0.1', ...(enabled?{port:5180,strictPort:true}: {})},
 };
});
