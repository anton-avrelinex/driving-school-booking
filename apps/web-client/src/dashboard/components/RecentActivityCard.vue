<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ $t("dashboard_activity_title") }}</CardTitle>
      <CardDescription>
        {{ $t("dashboard_activity_description") }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div
        v-if="entries.length === 0"
        class="text-sm text-muted-foreground py-2"
      >
        {{ $t("dashboard_activity_empty") }}
      </div>
      <ul v-else class="flex flex-col divide-y">
        <li
          v-for="entry in entries"
          :key="entry.id"
          class="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div
            class="rounded-full p-2 shrink-0"
            :class="badgeClass(entry.type)"
          >
            <component :is="iconFor(entry.type)" class="size-3.5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-sm">
              <span class="font-medium">{{ entry.studentName }}</span>
              <span class="text-muted-foreground"> · </span>
              <span>{{
                $t(`dashboard_activity_type_${entry.type.toLowerCase()}`)
              }}</span>
            </div>
            <div class="text-xs text-muted-foreground mt-0.5 truncate">
              {{ $t("lesson_instructor") }}: {{ entry.instructorName }} ·
              {{ formatRelative(entry.timestamp) }}
            </div>
          </div>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { CheckIcon, PlusIcon, XIcon, type LucideIcon } from "lucide-vue-next";
import {
  RECENT_ACTIVITY_TYPES,
  type RecentActivityEntryDto,
  type RecentActivityType,
} from "@driving-school-booking/shared-types";
import { parseISOToZoned } from "@/lib/date-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

defineProps<{ entries: RecentActivityEntryDto[] }>();

const { locale } = useI18n();

function iconFor(type: RecentActivityType): LucideIcon {
  switch (type) {
    case RECENT_ACTIVITY_TYPES.BOOKED:
      return PlusIcon;
    case RECENT_ACTIVITY_TYPES.COMPLETED:
      return CheckIcon;
    case RECENT_ACTIVITY_TYPES.CANCELLED:
      return XIcon;
  }
}

function badgeClass(type: RecentActivityType): string {
  switch (type) {
    case RECENT_ACTIVITY_TYPES.BOOKED:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case RECENT_ACTIVITY_TYPES.COMPLETED:
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case RECENT_ACTIVITY_TYPES.CANCELLED:
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
  }
}

function formatRelative(iso: string): string {
  const date = parseISOToZoned(iso).toDate();
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(locale.value, {
    month: "short",
    day: "numeric",
  });
}
</script>
