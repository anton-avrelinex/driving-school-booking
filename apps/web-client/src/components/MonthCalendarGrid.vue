<template>
  <div
    class="grid grid-cols-7 border-l border-t overflow-auto"
    :style="{
      gridTemplateRows: `auto repeat(${weekRowCount}, minmax(${minRowPx}px, 1fr))`,
    }"
  >
    <div
      v-for="(label, i) in weekdayLabels"
      :key="i"
      class="border-r border-b bg-muted/40 px-2 py-1.5 text-xs font-medium text-muted-foreground sticky top-0 z-10"
    >
      {{ label }}
    </div>

    <div
      v-for="day in days"
      :key="day.date.toString()"
      class="border-r border-b p-1.5 text-xs flex flex-col gap-1 overflow-hidden"
      :class="{
        'bg-muted/30': !day.inMonth,
        'bg-accent/40': day.isToday,
      }"
    >
      <div
        class="text-right text-muted-foreground"
        :class="{ 'font-semibold text-foreground': day.isToday }"
      >
        {{ day.date.day }}
      </div>
      <slot name="cell" :day="day" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  type CalendarDate,
  endOfMonth,
  endOfWeek,
  getLocalTimeZone,
  startOfMonth,
  startOfWeek,
  today,
} from "@internationalized/date";
import { WEEK_LOCALE } from "@/lib/date-utils";

interface MonthDay {
  date: CalendarDate;
  inMonth: boolean;
  isToday: boolean;
}

const props = withDefaults(
  defineProps<{
    monthAnchor: CalendarDate;
    minRowPx?: number;
  }>(),
  { minRowPx: 96 },
);

defineSlots<{
  cell(props: { day: MonthDay }): unknown;
}>();

const i18n = useI18n();

const weekdayLabels = computed(() => {
  const labels: string[] = i18n.tm("common_days");
  return labels.map((d) => d.slice(0, 3));
});

const days = computed<MonthDay[]>(() => {
  const timezone = getLocalTimeZone();
  const monthStart = startOfMonth(props.monthAnchor);
  const monthEnd = endOfMonth(props.monthAnchor);
  const start = startOfWeek(monthStart, WEEK_LOCALE);
  const end = endOfWeek(monthEnd, WEEK_LOCALE);
  const todayDate = today(timezone);

  const result: MonthDay[] = [];
  let cur = start;
  while (cur.compare(end) <= 0) {
    result.push({
      date: cur,
      inMonth: cur.month === props.monthAnchor.month,
      isToday: cur.compare(todayDate) === 0,
    });
    cur = cur.add({ days: 1 });
  }
  return result;
});

const weekRowCount = computed(() => Math.ceil(days.value.length / 7));
</script>
