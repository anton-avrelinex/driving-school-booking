<template>
  <LineChart
    v-if="seriesData.length > 0"
    :title="t('analytics_title_event_trends')"
    :description="''"
    :data="seriesData"
    :chart-config="seriesConfig"
    :line-keys="seriesKeys"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { ChartConfig } from "@/components/ui/chart";
import LineChart from "@/components/LineChart.vue";
import { useAnalyticsStore } from "@/monitoring/analytics.store";
import { CHART_COLORS } from "@/monitoring/chart-colors";

const { t } = useI18n();
const store = useAnalyticsStore();

// Pivot from [{bucket, event, count}] to [{bucket, event1: n, event2: n}]
const seriesKeys = computed(() => {
  const keys = new Set<string>();
  for (const d of store.eventCountSeries) {
    keys.add(d.event);
  }
  return [...keys];
});

const seriesData = computed<Record<string, unknown>[]>(() => {
  const bucketMap = new Map<string, Record<string, unknown>>();
  for (const d of store.eventCountSeries) {
    const key = d.bucket.toAbsoluteString();
    if (!bucketMap.has(key)) {
      bucketMap.set(key, { bucket: d.bucket.toDate() });
    }
    bucketMap.get(key)![d.event] = d.count;
  }
  return [...bucketMap.values()];
});

const seriesConfig = computed<ChartConfig>(() => {
  const cfg: ChartConfig = {};
  seriesKeys.value.forEach((key, i) => {
    cfg[key] = {
      label: key,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });
  return cfg;
});
</script>
