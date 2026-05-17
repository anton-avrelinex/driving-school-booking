import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import api from "@/api/api";
import { getCsrfToken } from "@/api/token";
import { useAuthStore } from "@/auth/auth.store";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export function installInterceptors(): void {
  api.interceptors.request.use((config) => {
    // axios defaults to "get" if no method is set
    const method = (config.method ?? "get").toLowerCase();
    if (!SAFE_METHODS.has(method)) {
      const csrf = getCsrfToken();
      if (csrf) {
        config.headers["X-CSRF-Token"] = csrf;
      }
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as
        | RetryableRequestConfig
        | undefined;

      if (
        originalRequest &&
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !PUBLIC_ROUTES.some((route) => originalRequest.url?.includes(route))
      ) {
        originalRequest._retry = true;

        try {
          await useAuthStore().refresh();
          return api(originalRequest);
        } catch {
          globalThis.location.href = "/login";
        }
      }

      throw error;
    },
  );
}

const PUBLIC_ROUTES = ["/auth/login", "/auth/refresh"];
const SAFE_METHODS = new Set(["get", "head", "options"]);
