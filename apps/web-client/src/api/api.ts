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

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
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
      !originalRequest.url?.includes("/auth/")
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
