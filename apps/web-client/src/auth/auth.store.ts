import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  ANALYTICS_EVENTS,
  ROLES,
  type JwtPayload,
  type TokenResponseDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/api/token";
import router from "@/router";
import { logWarn, trackEvent } from "@/observability";

function parseJwt(token: string): JwtPayload {
  const base64 = token.split(".")[1]!;
  return JSON.parse(atob(base64)) as JwtPayload;
}

export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref<string | null>(getAccessToken());

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
        mustChangePassword: payload.mustChangePassword,
      };
    } catch {
      return null;
    }
  });

  const isAuthenticated = computed(() => !!accessToken.value);

  const isAdmin = computed(() => user.value?.role === ROLES.ADMIN);
  const isInstructor = computed(() => user.value?.role === ROLES.INSTRUCTOR);
  const isStudent = computed(() => user.value?.role === ROLES.STUDENT);

  const mustChangePassword = computed(() => {
    return user.value?.mustChangePassword ?? false;
  });

  function setToken(access: string) {
    accessToken.value = access;
    setAccessToken(access);
  }

  function clearToken() {
    accessToken.value = null;
    clearAccessToken();
  }

  async function login(email: string, password: string) {
    const { data } = await api.post<TokenResponseDto>("/auth/login", {
      email,
      password,
    });
    setToken(data.accessToken);
    trackEvent(ANALYTICS_EVENTS.LOGIN, {
      role: parseJwt(data.accessToken).role,
    });
    return data;
  }

  async function refresh(): Promise<boolean> {
    try {
      const { data } = await api.post<TokenResponseDto>("/auth/refresh", null);
      setToken(data.accessToken);
      return true;
    } catch {
      logWarn("Token refresh failed");
      return false;
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    const { data } = await api.post<TokenResponseDto>("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    setToken(data.accessToken);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // best-effort; clear local state regardless
    }
    clearToken();
    void router.push("/login");
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    isAdmin,
    isInstructor,
    isStudent,
    mustChangePassword,
    login,
    refresh,
    changePassword,
    logout,
    setToken,
  };
});
