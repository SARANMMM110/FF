/**
 * Client-only Vite config: builds only the React app.
 * Use on the server when dist/ is not writable (e.g. owned by root).
 * Output: client-build/ (set STATIC_DIR to this path in .env so Node serves it).
 * Run: VITE_BASE_PATH=/dashboard/ npm run build:frontend:client
 */
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const raw = process.env.VITE_BASE_PATH ?? "/";
const basePath = raw.endsWith("/") ? raw : raw + "/";

// Use dir the app user can write to when dist/ is root-owned (e.g. on shared server)
const outDir = process.env.CLIENT_BUILD_DIR || "client-build";

export default defineConfig({
  base: basePath,
  plugins: [react()],
  build: {
    outDir,
    chunkSizeWarningLimit: 5000,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
