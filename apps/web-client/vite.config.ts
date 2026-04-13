import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const apiTarget =
    mode === "production"
      ? (process.env.VITE_API_URL ?? "http://main-service:3001")
      : (process.env.VITE_API_URL ?? "http://localhost:3001");

  const obsTarget =
    mode === "production"
      ? (process.env.VITE_OBS_URL ?? "http://observability-service:4001")
      : (process.env.VITE_OBS_URL ?? "http://localhost:4001");

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
