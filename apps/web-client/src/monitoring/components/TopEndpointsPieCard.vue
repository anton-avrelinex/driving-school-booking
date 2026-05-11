<template>
  <PieChart
    :title="t('monitoring_title_top_endpoints')"
    :description="t('monitoring_description_top_endpoints')"
    :items="items"
    :chart-config="config"
    :central-sub-label="t('monitoring_requests')"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { ChartConfig } from "@/components/ui/chart";
import { useMonitoringStore } from "@/monitoring/monitoring.store";
import { CHART_COLORS } from "@/monitoring/chart-colors";
import PieChart, { type PieItem } from "@/monitoring/PieChart.vue";

const { t } = useI18n();
const store = useMonitoringStore();

const items = computed<PieItem[]>(() =>
  store.topEndpoints.map((ep, i) => {
    const label = `${ep.method} ${ep.path}`;
    return {
      label,
      value: ep.count,
      fill: CHART_COLORS[i % CHART_COLORS.length]!,
      [label]: ep.count,
    };
  }),
);

const config = computed<ChartConfig>(() => {
  const cfg: ChartConfig = {};
  store.topEndpoints.forEach((ep, i) => {
    const key = `${ep.method} ${ep.path}`;
    cfg[key] = {
      label: key,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });
  return cfg;
});
</script>
