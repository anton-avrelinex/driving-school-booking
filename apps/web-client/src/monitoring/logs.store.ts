import { ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { defineStore } from "pinia";
import type { LogSearchFilters } from "@driving-school-booking/shared-types";
import { searchLogs } from "./logs.api";
import {
  type LogSearchResultModel,
  toLogSearchResultModel,
} from "./logs.models";

export const useLogsStore = defineStore("logs", () => {
  const { t } = useI18n();
  const result = ref({
    items: [],
    total: 0,
    page: 1,
    limit: 50,
  }) as Ref<LogSearchResultModel>;
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetch(filters: LogSearchFilters) {
    loading.value = true;
    error.value = null;
    try {
      result.value = toLogSearchResultModel(await searchLogs(filters));
    } catch (err) {
      error.value = err instanceof Error ? err.message : t("logs_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  return { result, loading, error, fetch };
});
