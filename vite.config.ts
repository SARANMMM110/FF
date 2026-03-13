import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// When deploying under a subpath (e.g. mortalfocus.com/dashboard), set VITE_BASE_PATH=/dashboard/
const raw = process.env.VITE_BASE_PATH ?? '/';
const basePath = raw.endsWith('/') ? raw : raw + '/';
export default defineConfig({
  base: basePath,
  plugins: [react(), cloudflare()],
  server: {
    allowedHosts: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
    // Avoid EACCES when dist/ was created by another user (e.g. root); don't clear output dir
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
