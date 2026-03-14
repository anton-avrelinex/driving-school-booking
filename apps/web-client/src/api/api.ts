import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { TokenResponseDto } from "@driving-school-booking/shared-types";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "@/api/token";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const PUBLIC_ROUTES = ["/auth/login", "/auth/refresh"];

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  if (PUBLIC_ROUTES.some((route) => config.url?.includes(route))) {
    return config;
  }
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      originalRequest &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !PUBLIC_ROUTES.some((route) => originalRequest.url?.includes(route))
    ) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await axios.post<TokenResponseDto>(
            "/api/auth/refresh",
            { refreshToken },
          );
          setTokens(data.accessToken, data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          // refresh failed, fall through to clear
        }
      }

      clearTokens();
      globalThis.location.href = "/login";
    }

    throw error;
  },
);

export default api;
