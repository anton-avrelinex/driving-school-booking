<template>
  <LineChart
    :title="t('monitoring_title_latency')"
    :description="t('monitoring_description_latency')"
    :data="data"
    :chart-config="config"
    :line-keys="['p50', 'p95', 'p99']"
    unit="ms"
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
  store.latency.map((d) => ({
    bucket: d.bucket.toDate(),
    p50: d.p50,
    p95: d.p95,
    p99: d.p99,
  })),
);

const config = computed<ChartConfig>(() => ({
  p50: { label: t("monitoring_latency_p50"), color: "var(--chart-1)" },
  p95: { label: t("monitoring_latency_p95"), color: "var(--chart-3)" },
  p99: { label: t("monitoring_latency_p99"), color: "var(--chart-5)" },
}));
</script>
