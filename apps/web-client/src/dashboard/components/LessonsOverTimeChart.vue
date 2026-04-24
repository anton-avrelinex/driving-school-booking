<template>
  <LineChart
    :title="$t('dashboard_chart_title')"
    :description="$t('dashboard_chart_description')"
    :data="chartData"
    :chart-config="chartConfig"
    :line-keys="lineKeys"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { getLocalTimeZone } from "@internationalized/date";
import type { LessonsOverTimeEntryDto } from "@driving-school-booking/shared-types";
import { parseDateString } from "@/lib/date-utils";
import type { ChartConfig } from "@/components/ui/chart";
import LineChart from "@/components/LineChart.vue";

const props = defineProps<{
  entries: LessonsOverTimeEntryDto[];
}>();

const { t } = useI18n();

const lineKeys = ["scheduled", "completed", "cancelled"];

const chartConfig = computed<ChartConfig>(() => ({
  scheduled: {
    label: t("lesson_status_scheduled"),
    color: "var(--chart-1)",
  },
  completed: {
    label: t("lesson_status_completed"),
    color: "var(--chart-2)",
  },
  cancelled: {
    label: t("lesson_status_cancelled"),
    color: "var(--chart-3)",
  },
}));

const chartData = computed(() => {
  const tz = getLocalTimeZone();
  return props.entries.map((entry) => ({
    bucket: parseDateString(entry.date).toDate(tz),
    scheduled: entry.scheduled,
    completed: entry.completed,
    cancelled: entry.cancelled,
  }));
});
</script>
