import { ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { defineStore } from "pinia";
import type {
  HealthSummaryFilters,
  TrendsFilters,
} from "@driving-school-booking/shared-types";
import { getTrends, getHealthSummary, getHealthChecks } from "./health.api";
import {
  type DailyAggregateModel,
  type DayHealthSummaryModel,
  type HealthCheckModel,
  toDailyAggregateModel,
  toDayHealthSummaryModel,
  toHealthCheckModel,
} from "./health.models";

export const useHealthStore = defineStore("health", () => {
  const { t } = useI18n();
  const aggregates = ref([]) as Ref<DailyAggregateModel[]>;
  const recentSummaries = ref([]) as Ref<DayHealthSummaryModel[]>;
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
      aggregates.value = trendsData.map(toDailyAggregateModel);
      recentSummaries.value = summaryData.map(toDayHealthSummaryModel);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : t("health_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  const checks = ref([]) as Ref<HealthCheckModel[]>;

  async function fetchChecks(filters: HealthSummaryFilters) {
    loading.value = true;
    error.value = null;
    try {
      checks.value = (await getHealthChecks(filters)).map(toHealthCheckModel);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : t("health_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  return {
    aggregates,
    recentSummaries,
    checks,
    loading,
    error,
    fetchAll,
    fetchChecks,
  };
});
