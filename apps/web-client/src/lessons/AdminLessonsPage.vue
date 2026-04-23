<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t("lesson_admin_title") }}</h1>
    </div>

    <div class="flex items-center gap-4 mb-4">
      <Select v-model="statusFilter" @update:model-value="applyFilters">
        <SelectTrigger class="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="null">{{ $t("common_all") }}</SelectItem>
          <SelectItem :value="LESSON_STATUSES.SCHEDULED">
            {{ $t("lesson_status_scheduled") }}
          </SelectItem>
          <SelectItem :value="LESSON_STATUSES.COMPLETED">
            {{ $t("lesson_status_completed") }}
          </SelectItem>
          <SelectItem :value="LESSON_STATUSES.CANCELLED">
            {{ $t("lesson_status_cancelled") }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <p v-if="lessonStore.loading" class="text-muted-foreground">
      {{ $t("common_loading") }}
    </p>
    <p v-else-if="lessonStore.error" class="text-destructive">
      {{ lessonStore.error }}
    </p>
    <p
      v-else-if="lessonStore.lessons.length === 0"
      class="text-muted-foreground"
    >
      {{ $t("lesson_no_lessons") }}
    </p>

    <Table v-else>
      <TableHeader>
        <TableRow>
          <TableHead>{{ $t("lesson_date") }}</TableHead>
          <TableHead>{{ $t("lesson_time") }}</TableHead>
          <TableHead>{{ $t("lesson_course") }}</TableHead>
          <TableHead>{{ $t("lesson_instructor") }}</TableHead>
          <TableHead>{{ $t("lesson_student") }}</TableHead>
          <TableHead>{{ $t("lesson_vehicle") }}</TableHead>
          <TableHead>{{ $t("common_status") }}</TableHead>
          <TableHead class="text-right">{{ $t("common_actions") }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="lesson in lessonStore.lessons" :key="lesson.id">
          <TableCell>
            {{ lesson.startTime.toDate().toLocaleDateString() }}
          </TableCell>
          <TableCell>
            {{
              lesson.startTime.toDate().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            }}
          </TableCell>
          <TableCell>{{ lesson.courseName }}</TableCell>
          <TableCell>{{ lesson.instructorName }}</TableCell>
          <TableCell>{{ lesson.studentName }}</TableCell>
          <TableCell>{{ lesson.vehicleName ?? "—" }}</TableCell>
          <TableCell>
            <Badge :variant="lessonStatusVariant(lesson.status)">
              {{ $t(`lesson_status_${lesson.status.toLowerCase()}`) }}
            </Badge>
          </TableCell>
          <TableCell class="text-right space-x-2">
            <template v-if="lesson.status === LESSON_STATUSES.SCHEDULED">
              <Button
                variant="outline"
                size="sm"
                @click="handleComplete(lesson.id)"
              >
                {{ $t("lesson_mark_complete") }}
              </Button>
              <Button
                v-if="!lesson.vehicleId"
                variant="outline"
                size="sm"
                @click="openAssignVehicle(lesson)"
              >
                {{ $t("lesson_assign_vehicle") }}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                @click="handleCancel(lesson.id)"
              >
                {{ $t("lesson_cancel") }}
              </Button>
            </template>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <AssignVehicleDialog
      v-model:open="showAssignVehicleDialog"
      :lesson="assignVehicleLesson"
      @assigned="applyFilters"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import {
  LESSON_STATUSES,
  type LessonStatus,
} from "@driving-school-booking/shared-types";
import type { LessonModel } from "@/lessons/lessons.models";
import { useLessonStore } from "@/lessons/lessons.store";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge, type BadgeVariants } from "@/components/ui/badge";
import AssignVehicleDialog from "@/lessons/AssignVehicleDialog.vue";

function lessonStatusVariant(status: LessonStatus): BadgeVariants["variant"] {
  switch (status) {
    case LESSON_STATUSES.SCHEDULED:
      return "info";
    case LESSON_STATUSES.COMPLETED:
      return "success";
    case LESSON_STATUSES.CANCELLED:
      return "destructive";
  }
}

const { t } = useI18n();
const lessonStore = useLessonStore();

const statusFilter = ref<LessonStatus | null>(null);
const showAssignVehicleDialog = ref(false);
const assignVehicleLesson = ref(null) as Ref<LessonModel | null>;

function applyFilters() {
  void lessonStore.fetchLessons(
    statusFilter.value ? { status: statusFilter.value } : {},
  );
}

async function handleComplete(lessonId: string) {
  try {
    await lessonStore.completeLesson(lessonId);
    toast.success(t("lesson_completed"));
    applyFilters();
  } catch {
    toast.error(t("lesson_complete_failed"));
  }
}

async function handleCancel(lessonId: string) {
  try {
    await lessonStore.cancelLesson(lessonId);
    toast.success(t("lesson_cancelled"));
    applyFilters();
  } catch {
    toast.error(t("lesson_cancel_failed"));
  }
}

function openAssignVehicle(lesson: LessonModel) {
  assignVehicleLesson.value = lesson;
  showAssignVehicleDialog.value = true;
}

onMounted(() => {
  applyFilters();
});
</script>
