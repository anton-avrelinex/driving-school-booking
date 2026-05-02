<template>
  <div class="flex flex-col gap-6 flex-1 min-h-0">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ $t("lesson_list_title") }}</h1>
      <div class="flex items-center gap-0.5 rounded-md border p-0.5">
        <Button
          :variant="view === 'list' ? 'default' : 'ghost'"
          size="sm"
          @click="view = 'list'"
        >
          <ListIcon class="size-4" />
          {{ $t("schedule_view_list") }}
        </Button>
        <Button
          :variant="view === 'calendar' ? 'default' : 'ghost'"
          size="sm"
          @click="view = 'calendar'"
        >
          <CalendarIcon class="size-4" />
          {{ $t("schedule_view_calendar") }}
        </Button>
      </div>
    </div>

    <div class="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <Transition name="fade" mode="out-in">
        <TableSkeleton
          v-if="lessonStore.loading && lessonStore.lessons.length === 0"
          :columns="authStore.isInstructor ? 7 : 6"
        />

        <p v-else-if="lessonStore.error" class="text-destructive">
          {{ lessonStore.error }}
        </p>

        <EmptyState
          v-else-if="lessonStore.lessons.length === 0"
          :title="$t('lesson_no_lessons')"
          :description="$t('lesson_no_lessons_description')"
          :icon="CalendarIcon"
        />

        <ScheduleView
          v-else-if="view === 'calendar'"
          :lessons="lessonStore.lessons"
          :availability="
            authStore.isInstructor ? availabilityStore.slots : undefined
          "
        >
          <template #lesson-actions="{ lesson, close }">
            <template v-if="lesson.status === LESSON_STATUSES.SCHEDULED">
              <template v-if="authStore.isInstructor">
                <Button size="sm" @click="completeAndClose(lesson.id, close)">
                  {{ $t("lesson_mark_complete") }}
                </Button>
                <Button
                  v-if="!lesson.vehicleId"
                  size="sm"
                  variant="outline"
                  @click="openAssignVehicleById(lesson.id, close)"
                >
                  {{ $t("lesson_assign_vehicle") }}
                </Button>
              </template>
              <Button
                size="sm"
                variant="destructive"
                @click="cancelAndClose(lesson.id, close)"
              >
                {{ $t("lesson_cancel") }}
              </Button>
            </template>
          </template>
        </ScheduleView>

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
      </Transition>
    </div>

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
import { CalendarIcon, ListIcon } from "lucide-vue-next";
import { useAuthStore } from "@/auth/auth.store";
import { useAvailabilityStore } from "@/availability/availability.store";
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
import EmptyState from "@/components/EmptyState.vue";
import TableSkeleton from "@/components/TableSkeleton.vue";
import AssignVehicleDialog from "@/lessons/AssignVehicleDialog.vue";
import ScheduleView from "@/lessons/ScheduleView.vue";

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
const authStore = useAuthStore();
const lessonStore = useLessonStore();
const availabilityStore = useAvailabilityStore();

const view = ref<"list" | "calendar">("list");

const vehicleDialogOpen = ref(false);
const selectedLesson = ref(null) as Ref<LessonModel | null>;

onMounted(async () => {
  const tasks: Promise<unknown>[] = [lessonStore.fetchLessons()];
  if (authStore.isInstructor && authStore.user) {
    tasks.push(availabilityStore.fetchAvailability(authStore.user.id));
  }
  await Promise.all(tasks);
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

async function completeAndClose(lessonId: string, close: () => void) {
  await handleComplete(lessonId);
  close();
}

async function cancelAndClose(lessonId: string, close: () => void) {
  await handleCancel(lessonId);
  close();
}

function openAssignVehicle(lesson: LessonModel) {
  selectedLesson.value = lesson;
  vehicleDialogOpen.value = true;
}

function openAssignVehicleById(lessonId: string, close: () => void) {
  const lesson = lessonStore.lessons.find((l) => l.id === lessonId);
  if (!lesson) return;
  openAssignVehicle(lesson);
  close();
}
</script>
