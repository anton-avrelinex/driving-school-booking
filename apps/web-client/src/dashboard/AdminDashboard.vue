<template>
  <div>
    <PageHeader
      :title="$t('dashboard_admin_title')"
      :description="$t('dashboard_admin_description')"
    />

    <p v-if="store.loading" class="text-muted-foreground">
      {{ $t("common_loading") }}
    </p>
    <p v-else-if="store.error" class="text-destructive">
      {{ store.error }}
    </p>

    <div v-else-if="stats" class="flex flex-col gap-6">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          :label="$t('dashboard_stat_students')"
          :value="stats.activeStudents"
          :icon="UsersIcon"
        />
        <StatCard
          :label="$t('dashboard_stat_instructors')"
          :value="stats.activeInstructors"
          :icon="GraduationCapIcon"
        />
        <StatCard
          :label="$t('dashboard_stat_lessons_this_week')"
          :value="stats.lessonsThisWeek"
          :icon="CalendarIcon"
        />
        <StatCard
          :label="$t('dashboard_stat_completion_rate')"
          :value="completionRateDisplay"
          :hint="$t('dashboard_stat_completion_rate_hint')"
          :icon="CheckCircleIcon"
        />
      </div>

      <LessonsOverTimeChart :entries="stats.lessonsOverTime" />

      <RecentActivityCard :entries="stats.recentActivity" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import {
  CalendarIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  UsersIcon,
} from "lucide-vue-next";
import { useDashboardStore } from "@/dashboard/dashboard.store";
import PageHeader from "@/components/PageHeader.vue";
import StatCard from "@/dashboard/components/StatCard.vue";
import LessonsOverTimeChart from "@/dashboard/components/LessonsOverTimeChart.vue";
import RecentActivityCard from "@/dashboard/components/RecentActivityCard.vue";

const store = useDashboardStore();

const stats = computed(() => store.adminStats);

const completionRateDisplay = computed(() => {
  if (!stats.value) return "—";
  return `${Math.round(stats.value.completionRate * 100)}%`;
});

onMounted(async () => {
  await store.loadAdminDashboard();
});
</script>
