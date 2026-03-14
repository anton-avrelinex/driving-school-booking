import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { ROLES, type JwtPayload, type TokenResponseDto } from "@driving-school-booking/shared-types";
import api from "@/api/api";
import {
  getAccessToken,
  getRefreshToken,
  setTokens as persistTokens,
  clearTokens as removeTokens,
} from "@/api/token";
import router from "@/router";

function parseJwt(token: string): JwtPayload {
  const base64 = token.split(".")[1]!;
  return JSON.parse(atob(base64)) as JwtPayload;
}

export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref<string | null>(getAccessToken());
  const refreshToken = ref<string | null>(getRefreshToken());

  const user = computed(() => {
    if (!accessToken.value) {
      return null;
    }

    try {
      const payload = parseJwt(accessToken.value);

      return {
        id: payload.sub,
        schoolId: payload.schoolId,
        role: payload.role,
      };
    } catch {
      return null;
    }
  });

  const isAuthenticated = computed(() => !!accessToken.value);
  const isAdmin = computed(() => user.value?.role === ROLES.ADMIN);
  const mustChangePassword = ref(false);

  function setTokens(access: string, refresh: string) {
    accessToken.value = access;
    refreshToken.value = refresh;

    persistTokens(access, refresh);
  }

  function clearTokens() {
    accessToken.value = null;
    refreshToken.value = null;

    removeTokens();
  }

  async function login(email: string, password: string) {
    const { data } = await api.post<TokenResponseDto>("/auth/login", { email, password });
    setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async function refresh(): Promise<boolean> {
    if (!refreshToken.value) return false;

    try {
      const { data } = await api.post<TokenResponseDto>("/auth/refresh", {
        refreshToken: refreshToken.value,
      });
      setTokens(data.accessToken, data.refreshToken);

      return true;
    } catch {
      return false;
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    await api.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });

    mustChangePassword.value = false;
  }

  function logout() {
    clearTokens();
    void router.push("/login");
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    isAdmin,
    mustChangePassword,
    login,
    refresh,
    changePassword,
    logout,
    setTokens,
  };
});
