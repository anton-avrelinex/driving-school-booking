import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  ANALYTICS_EVENTS,
  ROLES,
  type AuthSessionDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";
import router from "@/router";
import { trackEvent } from "@/observability";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AuthSessionDto | null>(null);

  const isAuthenticated = computed(() => user.value !== null);
  const isAdmin = computed(() => user.value?.role === ROLES.ADMIN);
  const isInstructor = computed(() => user.value?.role === ROLES.INSTRUCTOR);
  const isStudent = computed(() => user.value?.role === ROLES.STUDENT);
  const mustChangePassword = computed(
    () => user.value?.mustChangePassword ?? false,
  );

  async function login(email: string, password: string) {
    const { data } = await api.post<AuthSessionDto>("/auth/login", {
      email,
      password,
    });
    user.value = data;
    trackEvent(ANALYTICS_EVENTS.LOGIN, { role: data.role });
    return data;
  }

  async function refresh(): Promise<void> {
    try {
      const { data } = await api.post<AuthSessionDto>("/auth/refresh");
      user.value = data;
    } catch (e) {
      user.value = null;
      throw e;
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    const { data } = await api.post<AuthSessionDto>("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    user.value = data;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      user.value = null;
      void router.push("/login");
    }
  }

  return {
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
  };
});
