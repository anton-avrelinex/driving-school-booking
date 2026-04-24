<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ $t("dashboard_week_title") }}</CardTitle>
      <CardDescription>{{ $t("dashboard_week_description") }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-7 gap-2">
        <div
          v-for="day in days"
          :key="day.iso"
          class="flex flex-col items-center rounded-md border p-2"
          :class="{ 'border-primary bg-primary/5': day.isToday }"
        >
          <div class="text-xs text-muted-foreground uppercase">
            {{ day.weekdayLabel }}
          </div>
          <div class="text-lg font-semibold tabular-nums">
            {{ day.dayLabel }}
          </div>
          <div
            class="mt-1 text-xs font-medium"
            :class="day.count > 0 ? 'text-primary' : 'text-muted-foreground'"
          >
            {{ day.count === 0 ? "—" : $t("dashboard_week_lesson_count", { count: day.count }, day.count) }}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  type CalendarDate,
  getLocalTimeZone,
  today,
} from "@internationalized/date";
import { LESSON_STATUSES } from "@driving-school-booking/shared-types";
import type { DashboardLesson } from "@/dashboard/dashboard.models";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const props = defineProps<{
  lessons: DashboardLesson[];
}>();

const { locale } = useI18n();

const days = computed(() => {
  const tz = getLocalTimeZone();
  const todayDate = today(tz);
  const todayIso = todayDate.toString();
  const result = [];

  for (let i = 0; i < 7; i++) {
    const date = todayDate.add({ days: i });
    const iso = date.toString();

    const count = props.lessons.filter((l) => {
      if (l.status === LESSON_STATUSES.CANCELLED) return false;
      return sameDay(l.startTime, date);
    }).length;

    const nativeDate = date.toDate(tz);
    result.push({
      iso,
      isToday: iso === todayIso,
      weekdayLabel: nativeDate.toLocaleDateString(locale.value, {
        weekday: "short",
      }),
      dayLabel: nativeDate.toLocaleDateString(locale.value, { day: "numeric" }),
      count,
    });
  }

  return result;
});

function sameDay(
  a: { year: number; month: number; day: number },
  b: CalendarDate,
): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}
</script>
