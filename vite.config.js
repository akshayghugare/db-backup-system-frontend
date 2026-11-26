import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = (env.VITE_API_BASE_URL || "http://localhost:4800").trim().replace(/\/+$/, "");
  const port = Number(env.VITE_DEV_PORT || 5175);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port,
      strictPort: true,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
      },
    },
    preview: {
      port,
      strictPort: true,
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});
