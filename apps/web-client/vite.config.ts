import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiTarget = env.VITE_API_URL;
  const obsTarget = env.VITE_OBS_URL;
  if (!apiTarget || !obsTarget) {
    throw new Error(
      "VITE_API_URL and VITE_OBS_URL must be set (see apps/web-client/.env.example).",
    );
  }

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
