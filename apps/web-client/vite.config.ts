import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv() reads .env at config time (Vite doesn't auto-inject into
  // process.env for the config). Defaults point at the standard local-dev
  // ports so config-loaders like knip / vitest can resolve without a .env.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiTarget = env.VITE_API_URL ?? "http://localhost:3001";
  const obsTarget = env.VITE_OBS_URL ?? "http://localhost:4001";

  return {
    plugins: [vue(), vueDevTools(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy: {
        "/api/monitoring": {
          target: obsTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/monitoring/, "/api"),
        },
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
