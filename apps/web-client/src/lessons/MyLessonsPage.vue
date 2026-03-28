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

    <table v-else class="w-full text-sm">
      <thead>
        <tr class="border-b text-left">
          <th class="px-3 py-2">{{ $t("lesson_date") }}</th>
          <th class="px-3 py-2">{{ $t("lesson_time") }}</th>
          <th class="px-3 py-2">{{ $t("lesson_course") }}</th>
          <th v-if="!authStore.isInstructor" class="px-3 py-2">
            {{ $t("lesson_instructor") }}
          </th>
          <th v-if="authStore.isInstructor" class="px-3 py-2">
            {{ $t("lesson_student") }}
          </th>
          <th v-if="authStore.isInstructor" class="px-3 py-2">
            {{ $t("lesson_vehicle") }}
          </th>
          <th class="px-3 py-2">{{ $t("lesson_status") }}</th>
          <th class="px-3 py-2">{{ $t("common_actions") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="lesson in lessonStore.lessons"
          :key="lesson.id"
          class="border-b"
        >
          <td class="px-3 py-2">
            {{ new Date(lesson.startTime).toLocaleDateString() }}
          </td>
          <td class="px-3 py-2">
            {{
              new Date(lesson.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            }}-{{
              new Date(lesson.endTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            }}
          </td>
          <td class="px-3 py-2">{{ lesson.courseName }}</td>
          <td v-if="!authStore.isInstructor" class="px-3 py-2">
            {{ lesson.instructorName }}
          </td>
          <td v-if="authStore.isInstructor" class="px-3 py-2">
            {{ lesson.studentName }}
          </td>
          <td v-if="authStore.isInstructor" class="px-3 py-2">
            {{ lesson.vehicleName ?? "—" }}
          </td>
          <td class="px-3 py-2">
            <span
              :class="{
                'text-blue-600': lesson.status === 'SCHEDULED',
                'text-green-600': lesson.status === 'COMPLETED',
                'text-red-600': lesson.status === 'CANCELLED',
              }"
            >
              {{ $t(`lesson_status_${lesson.status.toLowerCase()}`) }}
            </span>
          </td>
          <td class="px-3 py-2 space-x-2">
            <template v-if="lesson.status === 'SCHEDULED'">
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
                <Button
                  size="sm"
                  variant="destructive"
                  @click="handleCancel(lesson.id)"
                >
                  {{ $t("lesson_cancel") }}
                </Button>
              </template>
              <template v-else>
                <Button
                  size="sm"
                  variant="destructive"
                  @click="handleCancel(lesson.id)"
                >
                  {{ $t("lesson_cancel") }}
                </Button>
              </template>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <AssignVehicleDialog
      v-model:open="vehicleDialogOpen"
      :lesson="selectedLesson"
      @assigned="lessonStore.fetchLessons()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import type { LessonDto } from "@driving-school-booking/shared-types";
import { toast } from "vue-sonner";
import { useAuthStore } from "@/auth/auth.store";
import { useLessonStore } from "@/lessons/lessons.store";
import { Button } from "@/components/ui/button";
import AssignVehicleDialog from "@/lessons/AssignVehicleDialog.vue";

const { t } = useI18n();
const authStore = useAuthStore();
const lessonStore = useLessonStore();

const vehicleDialogOpen = ref(false);
const selectedLesson = ref<LessonDto | null>(null);

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

function openAssignVehicle(lesson: LessonDto) {
  selectedLesson.value = lesson;
  vehicleDialogOpen.value = true;
}
</script>
