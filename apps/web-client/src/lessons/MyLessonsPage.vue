<template>
  <div class="flex flex-col gap-6 flex-1 min-h-0">
    <PageHeader
      :title="$t('lesson_list_title')"
      :description="$t('lesson_list_description')"
    >
      <template #actions>
        <Select v-model="statusFilter" @update:model-value="applyFilters">
          <SelectTrigger class="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="null">{{ $t("common_all") }}</SelectItem>
            <SelectItem :value="LESSON_STATUSES.PENDING">
              {{ $t("lesson_status_pending") }}
            </SelectItem>
            <SelectItem :value="LESSON_STATUSES.SCHEDULED">
              {{ $t("lesson_status_scheduled") }}
            </SelectItem>
            <SelectItem :value="LESSON_STATUSES.COMPLETED">
              {{ $t("lesson_status_completed") }}
            </SelectItem>
            <SelectItem :value="LESSON_STATUSES.CANCELLED">
              {{ $t("lesson_status_cancelled") }}
            </SelectItem>
            <SelectItem :value="LESSON_STATUSES.REJECTED">
              {{ $t("lesson_status_rejected") }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Tabs v-model="view">
          <TabsList>
            <TabsTrigger value="list">
              <ListIcon class="size-4" />
              {{ $t("schedule_view_list") }}
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarIcon class="size-4" />
              {{ $t("schedule_view_calendar") }}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </template>
    </PageHeader>

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
            <template v-if="lesson.status === LESSON_STATUSES.PENDING">
              <template v-if="authStore.isInstructor">
                <Button size="sm" @click="confirmAndClose(lesson.id, close)">
                  {{ $t("lesson_confirm") }}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  @click="rejectAndClose(lesson.id, close)"
                >
                  {{ $t("lesson_reject") }}
                </Button>
              </template>
              <Button
                v-else
                size="sm"
                variant="destructive"
                @click="cancelAndClose(lesson.id, close)"
              >
                {{ $t("lesson_cancel") }}
              </Button>
            </template>
            <template v-else-if="lesson.status === LESSON_STATUSES.SCHEDULED">
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
              <TableHead class="text-right">
                {{ $t("common_actions") }}
              </TableHead>
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
                <span
                  v-if="lesson.instructorNumber"
                  class="text-muted-foreground"
                >
                  · #{{ lesson.instructorNumber }}
                </span>
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
              <TableCell class="text-right space-x-2">
                <template v-if="lesson.status === LESSON_STATUSES.PENDING">
                  <template v-if="authStore.isInstructor">
                    <Button size="sm" @click="handleConfirm(lesson.id)">
                      {{ $t("lesson_confirm") }}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      @click="handleReject(lesson.id)"
                    >
                      {{ $t("lesson_reject") }}
                    </Button>
                  </template>
                  <Button
                    v-else
                    size="sm"
                    variant="destructive"
                    @click="handleCancel(lesson.id)"
                  >
                    {{ $t("lesson_cancel") }}
                  </Button>
                </template>
                <template
                  v-else-if="lesson.status === LESSON_STATUSES.SCHEDULED"
                >
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

    <ConfirmLessonDialog
      v-model:open="confirmDialogOpen"
      :vehicles="confirmDialogVehicles"
      :saving="confirmSaving"
      @confirm="onConfirmWithVehicle"
    />

    <CancelLessonDialog
      v-model:open="cancelDialogOpen"
      :lesson-id="cancelTargetLessonId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  LESSON_STATUSES,
  type LessonStatus,
  type VehicleDto,
} from "@driving-school-booking/shared-types";
import type { LessonModel } from "@/lessons/lessons.models";
import { toast } from "vue-sonner";
import { CalendarIcon, ListIcon } from "lucide-vue-next";
import { useAuthStore } from "@/auth/auth.store";
import { useAvailabilityStore } from "@/availability/availability.store";
import { useLessonStore } from "@/lessons/lessons.store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { lessonStatusVariant } from "@/lessons/lesson-status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EmptyState from "@/components/EmptyState.vue";
import PageHeader from "@/components/PageHeader.vue";
import TableSkeleton from "@/components/TableSkeleton.vue";
import AssignVehicleDialog from "@/lessons/AssignVehicleDialog.vue";
import CancelLessonDialog from "@/lessons/CancelLessonDialog.vue";
import ConfirmLessonDialog from "@/lessons/ConfirmLessonDialog.vue";
import ScheduleView from "@/lessons/ScheduleView.vue";

const { t } = useI18n();
const authStore = useAuthStore();
const lessonStore = useLessonStore();
const availabilityStore = useAvailabilityStore();

const view = ref<"list" | "calendar">("list");
const statusFilter = ref<LessonStatus | null>(null);

const vehicleDialogOpen = ref(false);
const selectedLesson = ref(null) as Ref<LessonModel | null>;

const confirmDialogOpen = ref(false);
const confirmDialogVehicles = ref<VehicleDto[]>([]);
const confirmTargetLessonId = ref<string | null>(null);
const confirmSaving = ref(false);
const confirmAfterDialog = ref<(() => void) | null>(null);

const cancelDialogOpen = ref(false);
const cancelTargetLessonId = ref<string | null>(null);

function applyFilters() {
  void lessonStore.fetchLessons(
    statusFilter.value ? { status: statusFilter.value } : {},
  );
}

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

function handleCancel(lessonId: string) {
  cancelTargetLessonId.value = lessonId;
  cancelDialogOpen.value = true;
}

async function confirmWithVehicle(
  lessonId: string,
  vehicleId: string,
): Promise<void> {
  await lessonStore.confirmLesson(lessonId);
  await lessonStore.assignVehicle(lessonId, vehicleId);
}

async function startConfirm(lessonId: string, after?: () => void) {
  try {
    const vehicles = await lessonStore.fetchAvailableVehicles(lessonId);
    if (vehicles.length === 0) {
      toast.error(t("lesson_confirm_no_vehicles"));
      return;
    }
    if (vehicles.length === 1) {
      await confirmWithVehicle(lessonId, vehicles[0]!.id);
      toast.success(t("lesson_confirmed"));
      after?.();
      return;
    }
    confirmTargetLessonId.value = lessonId;
    confirmDialogVehicles.value = vehicles;
    confirmAfterDialog.value = after ?? null;
    confirmDialogOpen.value = true;
  } catch {
    toast.error(t("lesson_confirm_failed"));
  }
}

async function onConfirmWithVehicle(vehicleId: string) {
  if (!confirmTargetLessonId.value) {
    return;
  }
  confirmSaving.value = true;
  try {
    await confirmWithVehicle(confirmTargetLessonId.value, vehicleId);
    toast.success(t("lesson_confirmed"));
    confirmDialogOpen.value = false;
    confirmAfterDialog.value?.();
    confirmAfterDialog.value = null;
  } catch {
    toast.error(t("lesson_confirm_failed"));
  } finally {
    confirmSaving.value = false;
  }
}

function handleConfirm(lessonId: string) {
  return startConfirm(lessonId);
}

async function handleReject(lessonId: string) {
  try {
    await lessonStore.rejectLesson(lessonId);
    toast.success(t("lesson_rejected"));
  } catch {
    toast.error(t("lesson_reject_failed"));
  }
}

async function completeAndClose(lessonId: string, close: () => void) {
  await handleComplete(lessonId);
  close();
}

function cancelAndClose(lessonId: string, close: () => void) {
  close();
  handleCancel(lessonId);
}

async function confirmAndClose(lessonId: string, close: () => void) {
  await startConfirm(lessonId, close);
}

async function rejectAndClose(lessonId: string, close: () => void) {
  await handleReject(lessonId);
  close();
}

function openAssignVehicle(lesson: LessonModel) {
  selectedLesson.value = lesson;
  vehicleDialogOpen.value = true;
}

function openAssignVehicleById(lessonId: string, close: () => void) {
  const lesson = lessonStore.lessons.find((l) => l.id === lessonId);
  if (!lesson) {
    return;
  }
  openAssignVehicle(lesson);
  close();
}
</script>
