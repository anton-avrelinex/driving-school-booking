<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ $t("dashboard_progress_title") }}</CardTitle>
      <CardDescription>
        {{ $t("dashboard_progress_description") }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="enrollments.length === 0" class="text-sm text-muted-foreground py-4">
        {{ $t("dashboard_no_enrollments") }}
      </div>
      <div v-else class="flex flex-col gap-5">
        <div
          v-for="enrollment in enrollments"
          :key="enrollment.id"
          class="flex flex-col gap-2"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="text-sm font-medium truncate">
              {{ enrollment.course.name }}
            </div>
            <div class="text-sm text-muted-foreground shrink-0">
              {{ enrollment.hoursCompleted }} / {{ enrollment.hoursPurchased }}h
            </div>
          </div>
          <div class="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              class="h-full bg-primary transition-all"
              :style="{ width: `${percent(enrollment)}%` }"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { UserDto } from "@driving-school-booking/shared-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Enrollment = NonNullable<
  UserDto["studentProfile"]
>["enrollments"][number];

defineProps<{
  enrollments: Enrollment[];
}>();

function percent(enrollment: Enrollment): number {
  if (enrollment.hoursPurchased === 0) return 0;
  const raw = (enrollment.hoursCompleted / enrollment.hoursPurchased) * 100;
  return Math.min(100, Math.max(0, Math.round(raw)));
}
</script>
