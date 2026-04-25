<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">{{ $t("lesson_list_title") }}</h1>

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
      {{ $t("common_no_results") }}
    </p>

    <Table v-else>
      <TableHeader>
        <TableRow>
          <TableHead>{{ $t("lesson_date") }}</TableHead>
          <TableHead>{{ $t("lesson_time") }}</TableHead>
          <TableHead>{{ $t("lesson_course") }}</TableHead>
          <TableHead v-if="!authStore.isInstructor">
            {{ $t("lesson_instructor") }}
          </TableHead>
          <TableHead v-if="authStore.isInstructor">
            {{ $t("lesson_student") }}
          </TableHead>
          <TableHead v-if="authStore.isInstructor">
            {{ $t("lesson_vehicle") }}
          </TableHead>
          <TableHead>{{ $t("lesson_status") }}</TableHead>
          <TableHead>{{ $t("common_actions") }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="lesson in lessonStore.lessons" :key="lesson.id">
          <TableCell>
            {{ $d(lesson.startTime.toDate(), "date") }}
          </TableCell>
          <TableCell>
            {{ $d(lesson.startTime.toDate(), "time") }}-{{
              $d(lesson.endTime.toDate(), "time")
            }}
          </TableCell>
          <TableCell>{{ lesson.courseName }}</TableCell>
          <TableCell v-if="!authStore.isInstructor">
            {{ lesson.instructorName }}
          </TableCell>
          <TableCell v-if="authStore.isInstructor">
            {{ lesson.studentName }}
          </TableCell>
          <TableCell v-if="authStore.isInstructor">
            {{ lesson.vehicleName ?? "—" }}
          </TableCell>
          <TableCell>
            <Badge :variant="lessonStatusVariant(lesson.status)">
              {{ $t(`lesson_status_${lesson.status.toLowerCase()}`) }}
            </Badge>
          </TableCell>
          <TableCell class="space-x-2">
            <template v-if="lesson.status === LESSON_STATUSES.SCHEDULED">
              <template v-if="authStore.isInstructor">
                <Button size="sm" @click="handleComplete(lesson.id)">
                  {{ $t("lesson_mark_complete") }}
                </Button>
                <Button
                  v-if="!lesson.vehicleId"
                  size="sm"
                  variant="outline"
                  @click="openAssignVehicle(lesson)"
                >
                  {{ $t("lesson_assign_vehicle") }}
                </Button>
              </template>
              <Button
                size="sm"
                variant="destructive"
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
      v-model:open="vehicleDialogOpen"
      :lesson="selectedLesson"
      @assigned="lessonStore.fetchLessons()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  LESSON_STATUSES,
  type LessonStatus,
} from "@driving-school-booking/shared-types";
import type { LessonModel } from "@/lessons/lessons.models";
import { toast } from "vue-sonner";
import { useAuthStore } from "@/auth/auth.store";
import { useLessonStore } from "@/lessons/lessons.store";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariants } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AssignVehicleDialog from "@/lessons/AssignVehicleDialog.vue";

function lessonStatusVariant(
  status: LessonStatus,
): BadgeVariants["variant"] {
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
const authStore = useAuthStore();
const lessonStore = useLessonStore();

const vehicleDialogOpen = ref(false);
const selectedLesson = ref(null) as Ref<LessonModel | null>;

onMounted(async () => {
  await lessonStore.fetchLessons();
});

async function handleComplete(lessonId: string) {
  try {
    await lessonStore.completeLesson(lessonId);
    toast.success(t("lesson_completed_success"));
  } catch {
    toast.error(t("lesson_completed_failed"));
  }
}

async function handleCancel(lessonId: string) {
  try {
    await lessonStore.cancelLesson(lessonId);
    toast.success(t("lesson_cancelled_success"));
  } catch {
    toast.error(t("lesson_cancelled_failed"));
  }
}

function openAssignVehicle(lesson: LessonModel) {
  selectedLesson.value = lesson;
  vehicleDialogOpen.value = true;
}
</script>
