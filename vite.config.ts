import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_ADMIN_API_BASE_URL || 'http://127.0.0.1:8787';
  return {
    plugins: [react(), tsconfigPaths(), svgr()],
    server: { proxy: { '/api': { target, changeOrigin: false, secure: target.startsWith('https://') } } },
  };
});
