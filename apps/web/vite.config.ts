import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const appDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = path.resolve(appDir, "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, "");
  const apiTarget = env.VITE_API_URL || "http://localhost:3100";
  const port = Number(env.VITE_WEB_PORT || 5180);

  return {
    envDir: repoRoot,
    resolve: {
      alias: {
        "@tresamigos/types": path.resolve(repoRoot, "packages/types/src/index.ts")
      }
    },
    plugins: [react()],
    server: {
      port,
      strictPort: true,
      host: true,
      proxy: {
        "/api": apiTarget,
        "/assets": apiTarget
      }
    },
    build: {
      outDir: "dist"
    }
  };
});
