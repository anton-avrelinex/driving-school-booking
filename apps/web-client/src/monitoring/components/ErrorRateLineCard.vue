<template>
  <LineChart
    :title="t('monitoring_title_error_rate')"
    :description="t('monitoring_description_error_rate')"
    :data="data"
    :chart-config="config"
    :line-keys="['rate']"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { ChartConfig } from "@/components/ui/chart";
import LineChart from "@/components/LineChart.vue";
import { useMonitoringStore } from "@/monitoring/monitoring.store";

const { t } = useI18n();
const store = useMonitoringStore();

const data = computed<Record<string, unknown>[]>(() =>
  store.errorRate.map((d) => ({
    bucket: d.bucket.toDate(),
    rate: d.rate,
  })),
);

const config = computed<ChartConfig>(() => ({
  rate: { label: t("monitoring_error_rate"), color: "var(--chart-1)" },
}));
</script>
