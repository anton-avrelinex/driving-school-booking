import { ref } from "vue";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import type {
  SchoolConfigDto,
  UpdateSchoolConfigDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";

export const useSchoolConfigStore = defineStore("school-config", () => {
  const { t } = useI18n();

  const config = ref<SchoolConfigDto | null>(null);
  const loading = ref(true);
  const saving = ref(false);
  const error = ref<string | null>(null);

  async function fetchConfig() {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get<SchoolConfigDto>("/school-config");
      config.value = data;
    } catch {
      error.value = t("school_config_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  async function updateConfig(dto: UpdateSchoolConfigDto) {
    saving.value = true;
    try {
      const { data } = await api.patch<SchoolConfigDto>("/school-config", dto);
      config.value = data;
      return data;
    } finally {
      saving.value = false;
    }
  }

  return { config, loading, saving, error, fetchConfig, updateConfig };
});
