import { ref } from "vue";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import type {
  UserDto,
  UpdateProfileDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";

export const useSettingsStore = defineStore("settings", () => {
  const { t } = useI18n();

  const profile = ref<UserDto | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  async function fetchProfile() {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get<UserDto>("/auth/profile");
      profile.value = data;
    } catch {
      error.value = t("settings_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(dto: UpdateProfileDto) {
    saving.value = true;
    try {
      const { data } = await api.patch<UserDto>("/auth/profile", dto);
      profile.value = data;
    } finally {
      saving.value = false;
    }
  }

  return {
    profile,
    loading,
    saving,
    error,
    fetchProfile,
    updateProfile,
  };
});
