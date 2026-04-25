<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ $t("dashboard_pending_title") }}</CardTitle>
      <CardDescription>
        {{ $t("dashboard_pending_description") }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div
        v-if="lessons.length === 0"
        class="text-sm text-muted-foreground py-2"
      >
        {{ $t("dashboard_pending_empty") }}
      </div>
      <ul v-else class="flex flex-col gap-2">
        <li
          v-for="lesson in lessons"
          :key="lesson.id"
          class="flex items-center gap-3 rounded-md border p-3"
        >
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate">
              {{ lesson.studentName }}
            </div>
            <div class="text-xs text-muted-foreground truncate">
              {{ $d(lesson.startTime.toDate(), "datetimeShort") }} ·
              {{ lesson.courseName }}
            </div>
          </div>
          <Button size="sm" @click="$emit('goToLessons')">
            {{ $t("dashboard_pending_action") }}
          </Button>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { DashboardLesson } from "@/dashboard/dashboard.models";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

defineProps<{ lessons: DashboardLesson[] }>();
defineEmits<{ (e: "goToLessons"): void }>();
</script>
