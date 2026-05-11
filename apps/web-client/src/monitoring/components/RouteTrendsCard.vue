<template>
  <div v-if="allRoutes.length > 0" class="flex items-center gap-2">
    <Label>{{ t("analytics_col_route") }}</Label>
    <Select v-model="selectedRoute">
      <SelectTrigger class="w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{{ t("common_all") }}</SelectItem>
        <SelectItem v-for="route in allRoutes" :key="route" :value="route">
          {{ route }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>

  <LineChart
    v-if="pageViewData.length > 0"
    :title="t('analytics_title_page_view_trends')"
    :description="selectedRoute === 'all' ? t('common_all') : selectedRoute"
    :data="pageViewData"
    :chart-config="pageViewConfig"
    :line-keys="['count']"
  />

  <LineChart
    v-if="pageLoadData.length > 0"
    :title="t('analytics_title_page_load_trends')"
    :description="selectedRoute === 'all' ? t('common_all') : selectedRoute"
    :data="pageLoadData"
    :chart-config="pageLoadConfig"
    :line-keys="['avgLoadTimeMs']"
    unit="ms"
  />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { ChartConfig } from "@/components/ui/chart";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LineChart from "@/components/LineChart.vue";
import { useAnalyticsStore } from "@/monitoring/analytics.store";
import { CHART_COLORS } from "@/monitoring/chart-colors";

const { t } = useI18n();
const store = useAnalyticsStore();

const selectedRoute = ref("all");

const allRoutes = computed(() => {
  const routes = new Set<string>();
  for (const d of store.pageViewSeries) {
    routes.add(d.route);
  }
  for (const d of store.pageLoadSeries) {
    routes.add(d.route);
  }
  return [...routes].sort();
});

const pageViewData = computed<Record<string, unknown>[]>(() => {
  const filtered =
    selectedRoute.value === "all"
      ? store.pageViewSeries
      : store.pageViewSeries.filter((d) => d.route === selectedRoute.value);

  if (selectedRoute.value !== "all") {
    return filtered.map((d) => ({
      bucket: d.bucket.toDate(),
      count: d.count,
    }));
  }

  const bucketMap = new Map<string, { bucket: Date; count: number }>();
  for (const d of filtered) {
    const key = d.bucket.toAbsoluteString();
    const entry = bucketMap.get(key) ?? { bucket: d.bucket.toDate(), count: 0 };
    entry.count += d.count;
    bucketMap.set(key, entry);
  }
  return [...bucketMap.values()];
});

const pageViewConfig = computed<ChartConfig>(() => ({
  count: {
    label:
      selectedRoute.value === "all" ? t("common_all") : selectedRoute.value,
    color: CHART_COLORS[0],
  },
}));

const pageLoadData = computed<Record<string, unknown>[]>(() => {
  const filtered =
    selectedRoute.value === "all"
      ? store.pageLoadSeries
      : store.pageLoadSeries.filter((d) => d.route === selectedRoute.value);

  if (selectedRoute.value !== "all") {
    return filtered.map((d) => ({
      bucket: d.bucket.toDate(),
      avgLoadTimeMs: d.avgLoadTimeMs,
    }));
  }

  const bucketMap = new Map<
    string,
    { bucket: Date; sum: number; count: number }
  >();
  for (const d of filtered) {
    const key = d.bucket.toAbsoluteString();
    const entry = bucketMap.get(key) ?? {
      bucket: d.bucket.toDate(),
      sum: 0,
      count: 0,
    };
    entry.sum += d.avgLoadTimeMs;
    entry.count++;
    bucketMap.set(key, entry);
  }
  return [...bucketMap.values()].map(({ bucket, sum, count }) => ({
    bucket,
    avgLoadTimeMs: Math.round(sum / count),
  }));
});

const pageLoadConfig = computed<ChartConfig>(() => ({
  avgLoadTimeMs: {
    label:
      selectedRoute.value === "all" ? t("common_all") : selectedRoute.value,
    color: CHART_COLORS[1],
  },
}));
</script>
