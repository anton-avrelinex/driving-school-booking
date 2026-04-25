import { ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { defineStore } from "pinia";
import type {
  EventCountDto,
  PageViewDto,
  PerformanceDto,
  TimeSeriesFilters,
} from "@driving-school-booking/shared-types";
import {
  getPageViews,
  getPerformance,
  getEventCounts,
  getEventCountSeries,
  getPageViewSeries,
  getPageLoadSeries,
} from "./analytics.api";
import {
  type EventCountTimeSeriesModel,
  type PageLoadTimeSeriesModel,
  type PageViewTimeSeriesModel,
  toEventCountTimeSeriesModel,
  toPageLoadTimeSeriesModel,
  toPageViewTimeSeriesModel,
} from "./analytics.models";

export const useAnalyticsStore = defineStore("analytics", () => {
  const { t } = useI18n();
  const pageViews = ref<PageViewDto[]>([]);
  const performance = ref<PerformanceDto[]>([]);
  const eventCounts = ref<EventCountDto[]>([]);
  const eventCountSeries = ref([]) as Ref<EventCountTimeSeriesModel[]>;
  const pageViewSeries = ref([]) as Ref<PageViewTimeSeriesModel[]>;
  const pageLoadSeries = ref([]) as Ref<PageLoadTimeSeriesModel[]>;
  const loading = ref(true);
  const error = ref<string | null>(null);

  async function fetchAll(filters: TimeSeriesFilters) {
    loading.value = true;
    error.value = null;
    try {
      const [
        pageViewsData,
        performanceData,
        eventCountsData,
        eventSeriesData,
        pageViewSeriesData,
        pageLoadSeriesData,
      ] = await Promise.all([
        getPageViews(filters),
        getPerformance(filters),
        getEventCounts(filters),
        getEventCountSeries(filters),
        getPageViewSeries(filters),
        getPageLoadSeries(filters),
      ]);
      pageViews.value = pageViewsData;
      performance.value = performanceData;
      eventCounts.value = eventCountsData;
      eventCountSeries.value = eventSeriesData.map(toEventCountTimeSeriesModel);
      pageViewSeries.value = pageViewSeriesData.map(toPageViewTimeSeriesModel);
      pageLoadSeries.value = pageLoadSeriesData.map(toPageLoadTimeSeriesModel);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : t("analytics_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  return {
    pageViews,
    performance,
    eventCounts,
    eventCountSeries,
    pageViewSeries,
    pageLoadSeries,
    loading,
    error,
    fetchAll,
  };
});
