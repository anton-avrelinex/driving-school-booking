<template>
  <PieChart
    v-if="store.eventCounts.length > 0"
    :title="t('analytics_title_events')"
    :description="''"
    :items="items"
    :chart-config="config"
    :central-sub-label="'events'"
  />
  <Card v-else>
    <CardContent>
      <EmptyState :title="t('common_no_results')" />
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Card, CardContent } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import EmptyState from "@/components/EmptyState.vue";
import { useAnalyticsStore } from "@/monitoring/analytics.store";
import { CHART_COLORS } from "@/monitoring/chart-colors";
import PieChart, { type PieItem } from "@/monitoring/PieChart.vue";

const { t } = useI18n();
const store = useAnalyticsStore();

const items = computed<PieItem[]>(() =>
  store.eventCounts.map((ec, i) => ({
    label: ec.event,
    value: ec.count,
    fill: CHART_COLORS[i % CHART_COLORS.length]!,
    [ec.event]: ec.count,
  })),
);

const config = computed<ChartConfig>(() => {
  const cfg: ChartConfig = {};
  store.eventCounts.forEach((ec, i) => {
    cfg[ec.event] = {
      label: ec.event,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });
  return cfg;
});
</script>
