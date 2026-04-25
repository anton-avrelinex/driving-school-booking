<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t("lesson_book") }}</h1>
    </div>

    <Transition name="fade" mode="out-in">
      <div v-if="loadingEnrollments" class="flex flex-col gap-4 max-w-md">
        <Skeleton class="h-9 w-full" />
        <Skeleton class="h-9 w-full" />
      </div>
      <p v-else-if="enrollmentError" class="text-destructive">
        {{ enrollmentError }}
      </p>

      <div v-else class="flex flex-col gap-6 max-w-md">
        <!-- Step 1: Select enrollment -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">{{
            $t("lesson_enrollment")
          }}</label>
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
          <label class="text-sm font-medium">{{
            $t("lesson_instructor")
          }}</label>
          <Skeleton v-if="lessonStore.loading" class="h-9 w-full" />
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
          <div class="max-w-md">
            <DatePicker
              v-model="selectedDate"
              :min="minDate"
              :max="maxDate"
              :placeholder="$t('lesson_select_date')"
              @update:model-value="onDateChange"
            />
          </div>
        </div>

        <!-- Step 4: Select slot -->
        <div v-if="selectedDate" class="flex flex-col gap-2">
          <label class="text-sm font-medium">{{
            $t("lesson_time_slot")
          }}</label>
          <Skeleton v-if="lessonStore.loading" class="h-9 w-full" />
          <EmptyState
            v-else-if="lessonStore.availableSlots.length === 0"
            :title="$t('lesson_no_slots')"
            :description="$t('lesson_no_slots_description')"
            :icon="ClockIcon"
          />
          <div v-else class="flex flex-wrap gap-2">
            <Button
              v-for="slot in lessonStore.availableSlots"
              :key="timeToString(slot.startTime)"
              :variant="
                selectedSlot && selectedSlot.compare(slot.startTime) === 0
                  ? 'default'
                  : 'outline'
              "
              size="sm"
              @click="selectedSlot = slot.startTime"
            >
              {{ timeToString(slot.startTime) }} -
              {{ timeToString(slot.endTime) }}
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
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  ENROLLMENT_STATUSES,
  type UserDto,
} from "@driving-school-booking/shared-types";
import { toast } from "vue-sonner";
import { useAuthStore } from "@/auth/auth.store";
import { useLessonStore } from "@/lessons/lessons.store";
import { ClockIcon } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import EmptyState from "@/components/EmptyState.vue";
import {
  type CalendarDate,
  type Time,
  getLocalTimeZone,
  today,
} from "@internationalized/date";
import { combineDateTime, timeToString } from "@/lib/date-utils";
import api from "@/api/api";

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const lessonStore = useLessonStore();

const loadingEnrollments = ref(true);
const enrollmentError = ref<string | null>(null);
const enrollments = ref<UserDto["studentProfile"]>();

const selectedEnrollmentId = ref<string | null>(null);
const selectedInstructorId = ref<string | null>(null);
const selectedDate = ref(null) as Ref<CalendarDate | null>;
const selectedSlot = ref(null) as Ref<Time | null>;

const activeEnrollments = computed(() => {
  if (!enrollments.value?.enrollments) return [];
  return enrollments.value.enrollments.filter(
    (e) => e.status === ENROLLMENT_STATUSES.ACTIVE,
  );
});

const minDate = computed(() => today(getLocalTimeZone()).add({ days: 1 }));
const maxDate = computed(() => today(getLocalTimeZone()).add({ days: 28 }));

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
  selectedDate.value = null;
  selectedSlot.value = null;
  if (!selectedEnrollmentId.value) return;
  void lessonStore.fetchAvailableInstructors(selectedEnrollmentId.value);
}

function onInstructorChange() {
  selectedDate.value = null;
  selectedSlot.value = null;
}

function onDateChange() {
  selectedSlot.value = null;
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
    selectedDate.value.toString(),
  );
}

async function handleBook() {
  if (
    !selectedEnrollmentId.value ||
    !selectedInstructorId.value ||
    !selectedDate.value ||
    !selectedSlot.value
  ) {
    return;
  }
  try {
    const startTime = combineDateTime(selectedDate.value, selectedSlot.value);

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
