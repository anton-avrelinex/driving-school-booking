import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { defineStore } from "pinia";
import type {
  TrendsFilters,
  DailyAggregateDto,
  DayHealthSummaryDto,
  HealthCheckDto,
  HealthSummaryFilters,
} from "@driving-school-booking/shared-types";
import { getTrends, getHealthSummary, getHealthChecks } from "./health.api";

export const useHealthStore = defineStore("health", () => {
  const { t } = useI18n();
  const aggregates = ref<DailyAggregateDto[]>([]);
  const recentSummaries = ref<DayHealthSummaryDto[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll(filters: TrendsFilters) {
    loading.value = true;
    error.value = null;
    try {
      const [trendsData, summaryData] = await Promise.all([
        getTrends(filters),
        getHealthSummary({ from: filters.from, to: filters.to }),
      ]);
      aggregates.value = trendsData;
      recentSummaries.value = summaryData;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : t("health_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  const checks = ref<HealthCheckDto[]>([]);

  async function fetchChecks(filters: HealthSummaryFilters) {
    loading.value = true;
    error.value = null;
    try {
      checks.value = await getHealthChecks(filters);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : t("health_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  return { aggregates, recentSummaries, checks, loading, error, fetchAll, fetchChecks };
});
