<template>
  <Card class="overflow-hidden">
    <div class="bg-primary/5 border-b px-6 py-3 flex items-center gap-2">
      <ClockIcon class="size-4 text-primary" />
      <span class="text-sm font-medium">
        {{ $t("dashboard_today_title", { date: todayLabel }) }}
      </span>
    </div>
    <CardContent class="p-6">
      <div
        v-if="lessons.length === 0"
        class="flex flex-col items-center text-center py-6 gap-3"
      >
        <div class="rounded-full bg-muted p-3">
          <ClockIcon class="size-6 text-muted-foreground" />
        </div>
        <div>
          <p class="font-medium">{{ $t("dashboard_no_lessons_today") }}</p>
          <p class="text-sm text-muted-foreground mt-1">
            {{ $t("dashboard_no_lessons_today_hint") }}
          </p>
        </div>
      </div>
      <ul v-else class="flex flex-col gap-3">
        <li
          v-for="lesson in lessons"
          :key="lesson.id"
          class="flex items-center gap-4 rounded-md border p-3"
        >
          <div class="text-sm font-semibold w-20 shrink-0 tabular-nums">
            {{ formatTime(lesson.startTime) }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium truncate">
              {{ lesson.studentName }}
            </div>
            <div class="text-xs text-muted-foreground truncate">
              {{ lesson.courseName }}
            </div>
          </div>
          <Badge :variant="lesson.status === LESSON_STATUSES.COMPLETED ? 'success' : 'info'">
            {{ $t(`lesson_status_${lesson.status.toLowerCase()}`) }}
          </Badge>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ClockIcon } from "lucide-vue-next";
import {
  type ZonedDateTime,
  getLocalTimeZone,
  now,
} from "@internationalized/date";
import { LESSON_STATUSES } from "@driving-school-booking/shared-types";
import type { DashboardLesson } from "@/dashboard/dashboard.models";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

defineProps<{
  lessons: DashboardLesson[];
}>();

const { locale } = useI18n();

const todayLabel = computed(() =>
  now(getLocalTimeZone())
    .toDate()
    .toLocaleDateString(locale.value, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
);

function formatTime(zoned: ZonedDateTime): string {
  return zoned.toDate().toLocaleTimeString(locale.value, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>
