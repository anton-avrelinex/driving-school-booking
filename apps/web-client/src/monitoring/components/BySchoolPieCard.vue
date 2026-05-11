<template>
  <PieChart
    :title="t('monitoring_title_by_school')"
    :description="t('monitoring_description_by_school')"
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
  store.bySchool.map((s, i) => {
    const label = s.schoolId ?? t("monitoring_no_school");
    return {
      label,
      value: s.count,
      fill: CHART_COLORS[i % CHART_COLORS.length]!,
      [label]: s.count,
    };
  }),
);

const config = computed<ChartConfig>(() => {
  const cfg: ChartConfig = {};
  store.bySchool.forEach((s, i) => {
    const key = s.schoolId ?? t("monitoring_no_school");
    cfg[key] = {
      label: key,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });
  return cfg;
});
</script>
