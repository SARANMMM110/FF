/**
 * Client-only Vite config: builds only the React app to dist/client/.
 * Use this on the server when you don't have write access to dist/019a11e2...
 * (the Cloudflare worker output). Run: VITE_BASE_PATH=/dashboard/ npm run build:frontend:client
 */
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const raw = process.env.VITE_BASE_PATH ?? "/";
const basePath = raw.endsWith("/") ? raw : raw + "/";

export default defineConfig({
  base: basePath,
  plugins: [react()],
  build: {
    outDir: "dist/client",
    chunkSizeWarningLimit: 5000,
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
