<template>
  <WeekCalendarGrid :week-anchor="weekAnchor">
    <template #cell="{ day, timeOfDayToVerticalPercent }">
      <div
        v-for="(band, i) in bandsForDayOfWeek(
          day.dayOfWeek,
          timeOfDayToVerticalPercent,
        )"
        :key="`band-${i}`"
        class="absolute left-0 right-0 bg-emerald-100/40 dark:bg-emerald-900/20 pointer-events-none"
        :style="{
          top: band.topPercent + '%',
          height: band.heightPercent + '%',
        }"
      />

      <button
        v-for="chip in chipsForDate(day.date, timeOfDayToVerticalPercent)"
        :key="chip.lesson.id"
        type="button"
        class="absolute left-1 right-1 rounded p-1 text-[11px] text-left overflow-hidden hover:opacity-90 transition-opacity border min-h-9"
        :class="lessonChipClass(chip.lesson.status)"
        :style="{
          top: chip.topPercent + '%',
          height: chip.heightPercent + '%',
        }"
        @click="$emit('lesson-click', chip.lesson)"
      >
        <div class="font-medium">
          {{ $d(chip.lesson.startTime.toDate(), "time") }} —
          {{ $d(chip.lesson.endTime.toDate(), "time") }}
        </div>
        <div class="truncate">{{ chipLabel(chip.lesson) }}</div>
      </button>
    </template>
  </WeekCalendarGrid>
</template>

<script setup lang="ts">
import { type CalendarDate } from "@internationalized/date";
import { LESSON_STATUSES, ROLES } from "@driving-school-booking/shared-types";
import type { LessonModel } from "@/lessons/lessons.models";
import type { AvailabilityBlockModel } from "@/availability/availability.models";
import WeekCalendarGrid from "@/components/WeekCalendarGrid.vue";
import { useAuthStore } from "@/auth/auth.store";

const props = defineProps<{
  weekAnchor: CalendarDate;
  lessons: LessonModel[];
  availability?: AvailabilityBlockModel[];
}>();

defineEmits<{ "lesson-click": [LessonModel] }>();

const auth = useAuthStore();

function bandsForDayOfWeek(
  dayOfWeek: number,
  toPercent: (hour: number, minute: number) => number,
) {
  return (props.availability ?? [])
    .filter((b) => b.dayOfWeek === dayOfWeek)
    .map((b) => ({
      topPercent: toPercent(b.startTime.hour, b.startTime.minute),
      heightPercent:
        toPercent(b.endTime.hour, b.endTime.minute) -
        toPercent(b.startTime.hour, b.startTime.minute),
    }));
}

function chipsForDate(
  date: CalendarDate,
  toPercent: (hour: number, minute: number) => number,
) {
  return props.lessons
    .filter(
      (l) =>
        l.startTime.year === date.year &&
        l.startTime.month === date.month &&
        l.startTime.day === date.day,
    )
    .slice()
    .sort((a, b) => a.startTime.compare(b.startTime))
    .map((lesson) => ({
      lesson,
      topPercent: toPercent(lesson.startTime.hour, lesson.startTime.minute),
      heightPercent:
        toPercent(lesson.endTime.hour, lesson.endTime.minute) -
        toPercent(lesson.startTime.hour, lesson.startTime.minute),
    }));
}

function lessonChipClass(status: LessonModel["status"]): string {
  switch (status) {
    case LESSON_STATUSES.SCHEDULED:
      return "bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100 border-blue-300 dark:border-blue-800";
    case LESSON_STATUSES.COMPLETED:
      return "bg-green-100 text-green-900 dark:bg-green-900/50 dark:text-green-100 border-green-300 dark:border-green-800";
    case LESSON_STATUSES.CANCELLED:
      return "bg-muted text-muted-foreground line-through";
  }
}

function chipLabel(lesson: LessonModel): string {
  return auth.user?.role === ROLES.INSTRUCTOR
    ? lesson.studentName
    : lesson.instructorName;
}
</script>
