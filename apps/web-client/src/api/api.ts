import axios from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/api/token";

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
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/")
    ) {
      originalRequest._retry = true;

      const refresh = getRefreshToken();
      if (refresh) {
        try {
          const { data } = await axios.post("/api/auth/refresh", {
            refreshToken: refresh,
          });
          setTokens(data.accessToken, data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          // refresh failed, fall through to clear
        }
      }

      clearTokens();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
