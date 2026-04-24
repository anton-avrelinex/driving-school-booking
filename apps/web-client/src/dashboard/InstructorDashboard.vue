<template>
  <div>
    <PageHeader
      :title="$t('dashboard_instructor_title')"
      :description="$t('dashboard_instructor_description')"
    />

    <p v-if="store.loading" class="text-muted-foreground">
      {{ $t("common_loading") }}
    </p>
    <p v-else-if="store.error" class="text-destructive">
      {{ store.error }}
    </p>

    <div v-else class="flex flex-col gap-6">
      <TodayScheduleCard :lessons="todayLessons" />

      <WeekOverviewCard :lessons="store.lessons" />

      <PendingCompletionsCard
        :lessons="pendingCompletions"
        @go-to-lessons="$router.push('/instructor/lessons')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import {
  type ZonedDateTime,
  getLocalTimeZone,
  now,
  today,
} from "@internationalized/date";
import { LESSON_STATUSES } from "@driving-school-booking/shared-types";
import { useDashboardStore } from "@/dashboard/dashboard.store";
import type { DashboardLesson } from "@/dashboard/dashboard.models";
import PageHeader from "@/components/PageHeader.vue";
import TodayScheduleCard from "@/dashboard/components/TodayScheduleCard.vue";
import WeekOverviewCard from "@/dashboard/components/WeekOverviewCard.vue";
import PendingCompletionsCard from "@/dashboard/components/PendingCompletionsCard.vue";

const store = useDashboardStore();

const todayLessons = computed(() => {
  const todayDate = today(getLocalTimeZone());
  return store.lessons
    .filter((l) => {
      if (l.status === LESSON_STATUSES.CANCELLED) return false;
      return isSameDay(l.startTime, todayDate);
    })
    .slice()
    .sort(byStartTimeAsc);
});

const pendingCompletions = computed(() => {
  const nowZoned = now(getLocalTimeZone());
  return store.lessons
    .filter(
      (l) =>
        l.status === LESSON_STATUSES.SCHEDULED &&
        l.endTime.compare(nowZoned) < 0,
    )
    .slice()
    .sort(byStartTimeDesc);
});

function isSameDay(
  zoned: ZonedDateTime,
  date: { year: number; month: number; day: number },
): boolean {
  return (
    zoned.year === date.year &&
    zoned.month === date.month &&
    zoned.day === date.day
  );
}

function byStartTimeAsc(a: DashboardLesson, b: DashboardLesson): number {
  return a.startTime.compare(b.startTime);
}

function byStartTimeDesc(a: DashboardLesson, b: DashboardLesson): number {
  return b.startTime.compare(a.startTime);
}

onMounted(async () => {
  await store.loadInstructorDashboard();
});
</script>
