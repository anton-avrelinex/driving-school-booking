import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { TokenResponseDto } from "@driving-school-booking/shared-types";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/api/token";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const PUBLIC_ROUTES = ["/auth/login", "/auth/refresh"];

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
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

      try {
        const { data } = await axios.post<TokenResponseDto>(
          "/api/auth/refresh",
          null,
          { withCredentials: true },
        );
        setAccessToken(data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        // refresh failed, fall through to clear
      }

      clearAccessToken();
      globalThis.location.href = "/login";
    }

    throw error;
  },
);

export default api;
