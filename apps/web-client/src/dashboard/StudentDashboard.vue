<template>
  <div>
    <PageHeader
      :title="title"
      :description="$t('dashboard_student_description')"
    />

    <Transition name="fade" mode="out-in">
      <div
        v-if="store.loading && !store.studentProfile"
        class="flex flex-col gap-6"
      >
        <Skeleton class="h-32 w-full" />
        <div class="grid gap-6 md:grid-cols-2">
          <Skeleton class="h-48 w-full" />
          <Skeleton class="h-48 w-full" />
        </div>
        <Skeleton class="h-48 w-full" />
      </div>
      <p v-else-if="store.error" class="text-destructive">
        {{ store.error }}
      </p>

      <div v-else class="flex flex-col gap-6">
        <NextLessonCard :lesson="nextLesson" />

        <div class="grid gap-6 md:grid-cols-2">
          <EnrollmentProgressCard :enrollments="activeEnrollments" />

          <Card>
            <CardHeader>
              <CardTitle>{{ $t("dashboard_upcoming_title") }}</CardTitle>
              <CardDescription>
                {{ $t("dashboard_upcoming_description") }}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                v-if="upcomingLessons.length === 0"
                class="text-sm text-muted-foreground py-2"
              >
                {{ $t("dashboard_no_upcoming") }}
              </div>
              <ul v-else class="flex flex-col gap-3">
                <li
                  v-for="lesson in upcomingLessons"
                  :key="lesson.id"
                  class="flex items-center justify-between gap-4"
                >
                  <div class="min-w-0">
                    <div class="text-sm font-medium truncate">
                      {{ $d(lesson.startTime.toDate(), "datetimeMedium") }}
                    </div>
                    <div class="text-xs text-muted-foreground truncate">
                      {{ lesson.courseName }} · {{ lesson.instructorName }}
                    </div>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{{ $t("dashboard_recent_title") }}</CardTitle>
            <CardDescription>
              {{ $t("dashboard_recent_description") }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              v-if="recentLessons.length === 0"
              class="text-sm text-muted-foreground py-2"
            >
              {{ $t("dashboard_no_recent") }}
            </div>
            <ul v-else class="flex flex-col gap-3">
              <li
                v-for="lesson in recentLessons"
                :key="lesson.id"
                class="flex items-center justify-between gap-4"
              >
                <div class="min-w-0">
                  <div class="text-sm font-medium truncate">
                    {{ $d(lesson.startTime.toDate(), "datetimeMedium") }}
                  </div>
                  <div class="text-xs text-muted-foreground truncate">
                    {{ lesson.courseName }} · {{ lesson.instructorName }}
                  </div>
                </div>
                <Badge variant="success">
                  {{ $t(`lesson_status_${lesson.status.toLowerCase()}`) }}
                </Badge>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { getLocalTimeZone, now } from "@internationalized/date";
import {
  ENROLLMENT_STATUSES,
  LESSON_STATUSES,
} from "@driving-school-booking/shared-types";
import { useAuthStore } from "@/auth/auth.store";
import { useDashboardStore } from "@/dashboard/dashboard.store";
import type { DashboardLesson } from "@/dashboard/dashboard.models";
import PageHeader from "@/components/PageHeader.vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import NextLessonCard from "@/dashboard/components/NextLessonCard.vue";
import EnrollmentProgressCard from "@/dashboard/components/EnrollmentProgressCard.vue";

const UPCOMING_COUNT = 3;
const RECENT_COUNT = 3;

const { t } = useI18n();
const auth = useAuthStore();
const store = useDashboardStore();

const title = computed(() => {
  const name = store.studentProfile?.firstName;
  return name
    ? t("dashboard_student_title_named", { name })
    : t("dashboard_student_title");
});

const activeEnrollments = computed(() => {
  const enrollments = store.studentProfile?.studentProfile?.enrollments ?? [];
  return enrollments.filter((e) => e.status === ENROLLMENT_STATUSES.ACTIVE);
});

const scheduledLessons = computed(() =>
  store.lessons
    .filter((l) => l.status === LESSON_STATUSES.SCHEDULED)
    .slice()
    .sort(byStartTimeAsc),
);

const nextLesson = computed<DashboardLesson | null>(() => {
  const nowZoned = now(getLocalTimeZone());
  return (
    scheduledLessons.value.find((l) => l.startTime.compare(nowZoned) >= 0) ??
    null
  );
});

const upcomingLessons = computed(() => {
  const nowZoned = now(getLocalTimeZone());
  return scheduledLessons.value
    .filter((l) => l.startTime.compare(nowZoned) >= 0)
    .slice(0, UPCOMING_COUNT);
});

const recentLessons = computed(() =>
  store.lessons
    .filter((l) => l.status === LESSON_STATUSES.COMPLETED)
    .slice()
    .sort(byStartTimeDesc)
    .slice(0, RECENT_COUNT),
);

function byStartTimeAsc(a: DashboardLesson, b: DashboardLesson): number {
  return a.startTime.compare(b.startTime);
}

function byStartTimeDesc(a: DashboardLesson, b: DashboardLesson): number {
  return b.startTime.compare(a.startTime);
}

onMounted(async () => {
  if (auth.user) {
    await store.loadStudentDashboard(auth.user.id);
  }
});
</script>
