import { ref, type Ref } from "vue";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import type {
  AdminDashboardStatsDto,
  LessonDto,
  UserDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";
import {
  type DashboardLesson,
  toDashboardLesson,
} from "@/dashboard/dashboard.models";

export const useDashboardStore = defineStore("dashboard", () => {
  const { t } = useI18n();

  const studentProfile = ref<UserDto | null>(null);
  const lessons = ref<DashboardLesson[]>([]) as Ref<DashboardLesson[]>;
  const adminStats = ref<AdminDashboardStatsDto | null>(null);

  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadStudentDashboard(userId: string) {
    loading.value = true;
    error.value = null;
    try {
      const [profileRes, lessonsRes] = await Promise.all([
        api.get<UserDto>(`/users/${userId}`),
        api.get<LessonDto[]>("/lessons"),
      ]);
      studentProfile.value = profileRes.data;
      lessons.value = lessonsRes.data.map(toDashboardLesson);
    } catch {
      error.value = t("dashboard_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  async function loadInstructorDashboard() {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get<LessonDto[]>("/lessons");
      lessons.value = data.map(toDashboardLesson);
    } catch {
      error.value = t("dashboard_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  async function loadAdminDashboard() {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get<AdminDashboardStatsDto>(
        "/stats/admin-dashboard",
      );
      adminStats.value = data;
    } catch {
      error.value = t("dashboard_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  return {
    studentProfile,
    lessons,
    adminStats,
    loading,
    error,
    loadStudentDashboard,
    loadInstructorDashboard,
    loadAdminDashboard,
  };
});
