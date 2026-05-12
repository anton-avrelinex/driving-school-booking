<template>
  <MonthCalendarGrid :month-anchor="monthAnchor">
    <template #cell="{ day }">
      <button
        v-for="lesson in lessonsForDate(day.date).slice(0, MAX_VISIBLE)"
        :key="lesson.id"
        type="button"
        class="block w-full text-left px-1.5 py-0.5 rounded truncate transition-colors hover:opacity-80"
        :class="lessonChipClass(lesson.status)"
        @click="$emit('lesson-click', lesson)"
      >
        <span class="font-medium">{{
          $d(lesson.startTime.toDate(), "time")
        }}</span>
        <span class="ml-1">{{ chipLabel(lesson) }}</span>
      </button>
      <button
        v-if="lessonsForDate(day.date).length > MAX_VISIBLE"
        type="button"
        class="text-[10px] text-muted-foreground px-1.5 text-left hover:text-foreground hover:underline"
        @click="
          $emit('day-click', {
            date: day.date,
            lessons: lessonsForDate(day.date),
          })
        "
      >
        {{
          $t("schedule_more_lessons", {
            count: lessonsForDate(day.date).length - MAX_VISIBLE,
          })
        }}
      </button>
    </template>
  </MonthCalendarGrid>
</template>

<script setup lang="ts">
import { type CalendarDate } from "@internationalized/date";
import { LESSON_STATUSES, ROLES } from "@driving-school-booking/shared-types";
import type { LessonModel } from "@/lessons/lessons.models";
import MonthCalendarGrid from "@/components/MonthCalendarGrid.vue";
import { useAuthStore } from "@/auth/auth.store";

const MAX_VISIBLE = 3;

const props = defineProps<{
  monthAnchor: CalendarDate;
  lessons: LessonModel[];
}>();

defineEmits<{
  "lesson-click": [LessonModel];
  "day-click": [{ date: CalendarDate; lessons: LessonModel[] }];
}>();

const auth = useAuthStore();

function lessonsForDate(date: CalendarDate): LessonModel[] {
  return props.lessons
    .filter(
      (l) =>
        l.startTime.year === date.year &&
        l.startTime.month === date.month &&
        l.startTime.day === date.day,
    )
    .slice()
    .sort((a, b) => a.startTime.compare(b.startTime));
}

function lessonChipClass(status: LessonModel["status"]): string {
  switch (status) {
    case LESSON_STATUSES.PENDING:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200";
    case LESSON_STATUSES.SCHEDULED:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200";
    case LESSON_STATUSES.COMPLETED:
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200";
    case LESSON_STATUSES.CANCELLED:
    case LESSON_STATUSES.REJECTED:
      return "bg-muted text-muted-foreground line-through";
  }
}

function chipLabel(lesson: LessonModel): string {
  return auth.user?.role === ROLES.INSTRUCTOR
    ? lesson.studentName
    : lesson.instructorName;
}
</script>
