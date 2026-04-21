<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t("lesson_book") }}</h1>
    </div>

    <p v-if="loadingEnrollments" class="text-muted-foreground">
      {{ $t("common_loading") }}
    </p>
    <p v-else-if="enrollmentError" class="text-destructive">
      {{ enrollmentError }}
    </p>

    <div v-else class="flex flex-col gap-6 max-w-md">
      <!-- Step 1: Select enrollment -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium">{{ $t("lesson_enrollment") }}</label>
        <Select
          v-model="selectedEnrollmentId"
          @update:model-value="onEnrollmentChange"
        >
          <SelectTrigger class="w-full">
            <SelectValue :placeholder="$t('lesson_select_enrollment')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="enrollment in activeEnrollments"
              :key="enrollment.id"
              :value="enrollment.id"
            >
              {{ enrollment.course.name }} ({{ enrollment.hoursCompleted }}/{{
                enrollment.hoursPurchased
              }}h)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Step 2: Select instructor -->
      <div v-if="selectedEnrollmentId" class="flex flex-col gap-2">
        <label class="text-sm font-medium">{{ $t("lesson_instructor") }}</label>
        <p v-if="lessonStore.loading" class="text-muted-foreground text-sm">
          {{ $t("common_loading") }}
        </p>
        <Select
          v-else
          v-model="selectedInstructorId"
          @update:model-value="onInstructorChange"
        >
          <SelectTrigger class="w-full">
            <SelectValue :placeholder="$t('lesson_select_instructor')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="instructor in lessonStore.availableInstructors"
              :key="instructor.id"
              :value="instructor.id"
            >
              {{ instructor.firstName }} {{ instructor.lastName }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Step 3: Select date -->
      <div v-if="selectedInstructorId" class="flex flex-col gap-2">
        <label class="text-sm font-medium">{{ $t("lesson_date") }}</label>
        <input
          v-model="selectedDate"
          type="date"
          :min="minDate"
          :max="maxDate"
          class="w-full max-w-md rounded-md border px-3 py-2 text-sm"
          @change="onDateChange"
        />
      </div>

      <!-- Step 4: Select slot -->
      <div v-if="selectedDate" class="flex flex-col gap-2">
        <label class="text-sm font-medium">{{ $t("lesson_time_slot") }}</label>
        <p v-if="lessonStore.loading" class="text-muted-foreground text-sm">
          {{ $t("common_loading") }}
        </p>
        <div
          v-else-if="lessonStore.availableSlots.length === 0"
          class="text-muted-foreground text-sm"
        >
          {{ $t("lesson_no_slots") }}
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <Button
            v-for="slot in lessonStore.availableSlots"
            :key="slot.startTime"
            :variant="selectedSlot === slot.startTime ? 'default' : 'outline'"
            size="sm"
            @click="selectedSlot = slot.startTime"
          >
            {{ slot.startTime }} - {{ slot.endTime }}
          </Button>
        </div>
      </div>

      <!-- Step 5: Confirm -->
      <div v-if="selectedSlot">
        <Button :disabled="lessonStore.saving" @click="handleBook">
          {{ lessonStore.saving ? $t("common_saving") : $t("lesson_book") }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  ENROLLMENT_STATUSES,
  type UserDto,
} from "@driving-school-booking/shared-types";
import { toast } from "vue-sonner";
import { useAuthStore } from "@/auth/auth.store";
import { useLessonStore } from "@/lessons/lessons.store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/api/api";

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const lessonStore = useLessonStore();

const loadingEnrollments = ref(false);
const enrollmentError = ref<string | null>(null);
const enrollments = ref<UserDto["studentProfile"]>();

const selectedEnrollmentId = ref<string | null>(null);
const selectedInstructorId = ref<string | null>(null);
const selectedDate = ref("");
const selectedSlot = ref("");

const activeEnrollments = computed(() => {
  if (!enrollments.value?.enrollments) return [];
  return enrollments.value.enrollments.filter(
    (e) => e.status === ENROLLMENT_STATUSES.ACTIVE,
  );
});

const minDate = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
});

const maxDate = computed(() => {
  const max = new Date();
  max.setDate(max.getDate() + 28);
  return max.toISOString().slice(0, 10);
});

onMounted(async () => {
  loadingEnrollments.value = true;
  try {
    const userId = authStore.user!.id;
    const { data } = await api.get<UserDto>(`/users/${userId}`);
    enrollments.value = data.studentProfile;
  } catch {
    enrollmentError.value = t("lesson_fetch_failed");
  } finally {
    loadingEnrollments.value = false;
  }
});

function onEnrollmentChange() {
  selectedInstructorId.value = null;
  selectedDate.value = "";
  selectedSlot.value = "";
  if (!selectedEnrollmentId.value) return;
  void lessonStore.fetchAvailableInstructors(selectedEnrollmentId.value);
}

function onInstructorChange() {
  selectedDate.value = "";
  selectedSlot.value = "";
}

function onDateChange() {
  selectedSlot.value = "";
  if (
    !selectedEnrollmentId.value ||
    !selectedInstructorId.value ||
    !selectedDate.value
  ) {
    return;
  }
  void lessonStore.fetchAvailableSlots(
    selectedEnrollmentId.value,
    selectedInstructorId.value,
    selectedDate.value,
  );
}

async function handleBook() {
  if (!selectedEnrollmentId.value || !selectedInstructorId.value) return;
  try {
    const startTime = new Date(
      `${selectedDate.value}T${selectedSlot.value}:00Z`,
    ).toISOString();

    await lessonStore.bookLesson({
      enrollmentId: selectedEnrollmentId.value,
      instructorId: selectedInstructorId.value,
      startTime,
    });

    toast.success(t("lesson_booked"));
    void router.push({ name: "my-lessons" });
  } catch {
    toast.error(t("lesson_book_failed"));
  }
}
</script>
