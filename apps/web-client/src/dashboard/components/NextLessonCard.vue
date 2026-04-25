<template>
  <Card class="overflow-hidden">
    <div class="bg-primary/5 border-b px-6 py-3 flex items-center gap-2">
      <CalendarIcon class="size-4 text-primary" />
      <span class="text-sm font-medium">{{ $t("dashboard_next_lesson") }}</span>
    </div>
    <CardContent class="p-6">
      <div
        v-if="lesson"
        class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
      >
        <div class="shrink-0">
          <div class="text-4xl font-bold tracking-tight">
            {{ $d(startDate, "dayOnly") }}
          </div>
          <div class="text-sm text-muted-foreground uppercase mt-1">
            {{ $d(startDate, "monthShort") }}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xl font-semibold">
            {{ $d(startDate, "time") }} — {{ $d(endDate, "time") }}
          </div>
          <div class="text-sm text-muted-foreground mt-1 truncate">
            {{ $t("lesson_instructor") }}: {{ lesson.instructorName }}
          </div>
          <div class="text-sm text-muted-foreground truncate">
            {{ $t("lesson_course") }}: {{ lesson.courseName }}
          </div>
        </div>
        <div class="shrink-0">
          <Button variant="outline" size="sm" @click="$router.push('/lessons')">
            {{ $t("dashboard_view_lessons") }}
          </Button>
        </div>
      </div>
      <div v-else class="flex flex-col items-center text-center py-6 gap-3">
        <div class="rounded-full bg-muted p-3">
          <CalendarIcon class="size-6 text-muted-foreground" />
        </div>
        <div>
          <p class="font-medium">{{ $t("dashboard_no_upcoming_lesson") }}</p>
          <p class="text-sm text-muted-foreground mt-1">
            {{ $t("dashboard_no_upcoming_lesson_hint") }}
          </p>
        </div>
        <Button size="sm" @click="$router.push('/lessons/book')">
          {{ $t("lesson_book") }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CalendarIcon } from "lucide-vue-next";
import type { DashboardLesson } from "@/dashboard/dashboard.models";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const props = defineProps<{
  lesson: DashboardLesson | null;
}>();

const startDate = computed(
  () => props.lesson?.startTime.toDate() ?? new Date(),
);
const endDate = computed(() => props.lesson?.endTime.toDate() ?? new Date());
</script>
