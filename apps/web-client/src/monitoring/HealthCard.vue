<template>
  <div class="rounded-lg border bg-card p-4 space-y-2">
    <div class="flex items-center justify-between">
      <span class="font-medium text-sm">{{ component }}</span>
      <span
        class="text-xs font-medium px-2 py-0.5 rounded-full"
        :class="statusClass"
      >
        {{ statusLabel }}
      </span>
    </div>

    <div class="flex gap-px h-8 items-end">
      <div
        v-for="(bar, i) in bars"
        :key="i"
        class="flex-1 rounded-sm min-w-0.5 transition-colors"
        :class="bar.colorClass"
        :title="bar.tooltip"
        :style="{ height: '100%' }"
      />
    </div>

    <div
      class="flex items-center justify-between text-xs text-muted-foreground"
    >
      <span>{{ t("health_days_ago", { count: totalDays }) }}</span>
      <span
        class="font-medium"
        :class="
          overallUptime >= 99
            ? 'text-green-600'
            : overallUptime >= 95
              ? 'text-yellow-600'
              : 'text-red-600'
        "
      >
        {{ t("health_uptime", { value: overallUptime.toFixed(2) }) }}
      </span>
      <span>{{ t("health_today") }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface DayHealth {
  date: string;
  uptimePercent: number;
  totalDowntimeMinutes: number;
  incidentCount: number;
}

const props = defineProps<{
  component: string;
  days: DayHealth[];
  totalDays: number;
}>();

function colorClassForUptime(uptime: number): string {
  if (uptime >= 99) return "bg-green-500";
  if (uptime >= 95) return "bg-yellow-500";
  if (uptime >= 90) return "bg-orange-500";
  return "bg-red-500";
}

const bars = computed(() => {
  const dayMap = new Map(props.days.map((d) => [d.date, d]));
  const result: { colorClass: string; tooltip: string }[] = [];

  for (let i = props.totalDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const day = dayMap.get(key);

    if (day) {
      result.push({
        colorClass: colorClassForUptime(day.uptimePercent),
        tooltip: `${key}: ${day.uptimePercent.toFixed(1)}% uptime`,
      });
    } else {
      result.push({
        colorClass: "bg-muted",
        tooltip: `${key}: ${t("health_status_no_data")}`,
      });
    }
  }

  return result;
});

const overallUptime = computed(() => {
  if (props.days.length === 0) return 0;
  const sum = props.days.reduce((acc, d) => acc + d.uptimePercent, 0);
  return sum / props.days.length;
});

const statusLabel = computed(() => {
  if (props.days.length === 0) return t("health_status_no_data");
  const latest = props.days[props.days.length - 1]!;
  if (latest.uptimePercent >= 99) return t("health_status_operational");
  if (latest.uptimePercent >= 90) return t("health_status_degraded");
  return t("health_status_down");
});

const statusClass = computed(() => {
  if (props.days.length === 0) return "bg-muted text-muted-foreground";
  const latest = props.days[props.days.length - 1]!;
  if (latest.uptimePercent >= 99)
    return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
  if (latest.uptimePercent >= 90)
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
  return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
});
</script>
