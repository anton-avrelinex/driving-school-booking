<template>
  <div class="overflow-auto">
    <div class="min-w-160 flex flex-col h-full">
      <div
        class="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-l border-t sticky top-0 z-10 bg-card shrink-0"
      >
        <div class="border-r border-b bg-muted/40" />
        <div
          v-for="day in days"
          :key="day.date.toString()"
          class="border-r border-b px-2 py-1.5 text-xs text-center"
          :class="day.isToday ? 'bg-accent/40' : 'bg-muted/40'"
        >
          <slot name="header" :day="day">
            <div
              class="font-medium"
              :class="{ 'text-foreground': day.isToday }"
            >
              {{ day.shortLabel }}
            </div>
            <div
              :class="
                day.isToday
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground'
              "
            >
              {{ day.date.day }}
            </div>
          </slot>
        </div>
      </div>

      <div
        class="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-l flex-1"
        :style="{ minHeight: minBodyHeight + 'px' }"
      >
        <div class="flex flex-col">
          <div
            v-for="hour in HOURS"
            :key="hour"
            class="flex-1 border-r border-b text-[11px] text-muted-foreground px-2 py-0.5"
            :style="{ minHeight: MIN_HOUR_HEIGHT_PX + 'px' }"
          >
            {{ formatHour(hour) }}
          </div>
        </div>

        <div
          v-for="day in days"
          :key="day.date.toString()"
          class="relative border-r flex flex-col"
        >
          <div
            v-for="hour in HOURS"
            :key="hour"
            class="flex-1 border-b"
            :style="{ minHeight: MIN_HOUR_HEIGHT_PX + 'px' }"
          />

          <slot
            name="cell"
            :day="day"
            :time-of-day-to-vertical-percent="timeOfDayToVerticalPercent"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  type CalendarDate,
  getLocalTimeZone,
  startOfWeek,
  today,
} from "@internationalized/date";
import { WEEK_LOCALE } from "@/lib/date-utils";

export interface WeekDay {
  date: CalendarDate;
  dayOfWeek: number; // canonical JS/Postgres day-of-week (Sunday = 0..Saturday = 6)
  isToday: boolean;
  shortLabel: string;
}

const props = withDefaults(
  defineProps<{
    weekAnchor: CalendarDate;
    /** Inclusive hour range shown on the vertical axis. */
    hourStart?: number;
    /** Exclusive hour range shown on the vertical axis. */
    hourEnd?: number;
    /** Min height per hour row in pixels. */
    minHourHeightPx?: number;
  }>(),
  {
    hourStart: 6,
    hourEnd: 22,
    minHourHeightPx: 40,
  },
);

defineSlots<{
  header(props: { day: WeekDay }): unknown;
  cell(props: {
    day: WeekDay;
    timeOfDayToVerticalPercent: (hour: number, minute: number) => number;
  }): unknown;
}>();

const i18n = useI18n();

const HOURS = computed(() =>
  Array.from(
    { length: props.hourEnd - props.hourStart },
    (_, i) => props.hourStart + i,
  ),
);
const MIN_HOUR_HEIGHT_PX = computed(() => props.minHourHeightPx);
const minBodyHeight = computed(
  () => props.minHourHeightPx * (props.hourEnd - props.hourStart),
);
const totalMinutes = computed(() => (props.hourEnd - props.hourStart) * 60);

const days = computed<WeekDay[]>(() => {
  const timezone = getLocalTimeZone();
  const start = startOfWeek(props.weekAnchor, WEEK_LOCALE);
  const todayDate = today(timezone);
  const dayLabels: string[] = i18n.tm("common_days");

  return Array.from({ length: 7 }, (_, i) => {
    const date = start.add({ days: i });
    return {
      date,
      dayOfWeek: date.toDate(timezone).getDay(),
      isToday: date.compare(todayDate) === 0,
      shortLabel: dayLabels[i]!.slice(0, 3),
    };
  });
});

function timeOfDayToVerticalPercent(hour: number, minute: number): number {
  const minutesFromStart = (hour - props.hourStart) * 60 + minute;
  return (minutesFromStart / totalMinutes.value) * 100;
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}
</script>
