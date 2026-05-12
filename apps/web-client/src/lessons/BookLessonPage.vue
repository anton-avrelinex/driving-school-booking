<template>
  <div>
    <PageHeader
      :title="$t('lesson_book')"
      :description="$t('lesson_book_description')"
    />

    <Transition name="fade" mode="out-in">
      <div v-if="loadingEnrollments" class="flex flex-col gap-4 max-w-2xl">
        <Skeleton class="h-9 w-full" />
        <Skeleton class="h-9 w-full" />
      </div>
      <p v-else-if="enrollmentError" class="text-destructive">
        {{ enrollmentError }}
      </p>

      <div v-else class="flex flex-col gap-6">
        <div
          v-if="activeEnrollments.length > 1"
          class="flex flex-col gap-2 max-w-md"
        >
          <Label for="enrollment">{{ $t("lesson_enrollment") }}</Label>
          <Select
            v-model="selectedEnrollmentId"
            @update:model-value="onEnrollmentChange"
          >
            <SelectTrigger id="enrollment" class="w-full">
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

        <div v-if="singleEnrollment" class="text-sm text-muted-foreground">
          {{ $t("lesson_enrollment") }}:
          <span class="font-medium text-foreground">
            {{ singleEnrollment.course.name }}
          </span>
          ({{ singleEnrollment.hoursCompleted }}/{{
            singleEnrollment.hoursPurchased
          }}h)
        </div>

        <Tabs
          v-if="selectedEnrollmentId"
          v-model="flow"
          @update:model-value="onFlowChange"
        >
          <TabsList>
            <TabsTrigger value="instructor">
              {{ $t("lesson_book_by_instructor") }}
            </TabsTrigger>
            <TabsTrigger value="time">
              {{ $t("lesson_book_by_time") }}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instructor">
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2 max-w-md">
                <Label for="instructor">{{ $t("lesson_instructor") }}</Label>
                <Skeleton
                  v-if="
                    lessonStore.loading &&
                    !lessonStore.availableInstructors.length
                  "
                  class="h-9 w-full"
                />
                <Select
                  v-else
                  v-model="selectedInstructorId"
                  @update:model-value="onInstructorChange"
                >
                  <SelectTrigger id="instructor" class="w-full">
                    <SelectValue
                      :placeholder="$t('lesson_select_instructor')"
                    />
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

              <Card v-if="!selectedInstructorId" class="max-w-2xl">
                <CardContent>
                  <EmptyState
                    :title="$t('lesson_book')"
                    :description="$t('lesson_book_choose_setup')"
                    :icon="CalendarIcon"
                  />
                </CardContent>
              </Card>

              <Card v-else class="overflow-hidden">
                <div
                  class="grid lg:grid-cols-[auto_320px] divide-y lg:divide-y-0 lg:divide-x"
                >
                  <div class="p-4 flex justify-center">
                    <Calendar
                      v-model:placeholder="calendarPlaceholder"
                      :model-value="selectedDate ?? undefined"
                      :min-value="minDate"
                      :is-date-disabled="isDateUnavailable"
                      :week-starts-on="WEEK_STARTS_ON"
                      :key="`instr-${availableDays.size}`"
                      class="text-base **:data-[slot=calendar-cell-trigger]:size-12 **:data-[slot=calendar-cell-trigger]:text-base"
                      @update:model-value="onCalendarChange"
                    />
                  </div>

                  <SlotPanel
                    :selected-date="selectedDate"
                    :selected-slot="selectedSlot"
                    :slots="slotsForSelectedDate"
                    :loading="lessonStore.loading"
                    :saving="lessonStore.saving"
                    :show-counts="false"
                    @select-slot="selectedSlot = $event.startTime"
                    @book="confirmBookingOpen = true"
                  />
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="time">
            <Card class="overflow-hidden">
              <div
                class="grid lg:grid-cols-[auto_320px] divide-y lg:divide-y-0 lg:divide-x"
              >
                <div class="p-4 flex justify-center">
                  <Calendar
                    v-model:placeholder="calendarPlaceholder"
                    :model-value="selectedDate ?? undefined"
                    :min-value="minDate"
                    :is-date-disabled="isDateUnavailable"
                    :week-starts-on="1"
                    :key="`time-${availableDays.size}`"
                    class="text-base **:data-[slot=calendar-cell-trigger]:size-12 **:data-[slot=calendar-cell-trigger]:text-base"
                    @update:model-value="onCalendarChange"
                  />
                </div>

                <SlotPanel
                  :selected-date="selectedDate"
                  :selected-slot="selectedSlot"
                  :slots="slotsForSelectedDate"
                  :loading="lessonStore.loading"
                  :saving="lessonStore.saving"
                  show-counts
                  @select-slot="onAggregatedSlotPick"
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Transition>

    <Dialog v-model:open="confirmBookingOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ $t("lesson_book_confirm_title") }}</DialogTitle>
          <DialogDescription v-if="selectedSlot && selectedInstructor">
            {{
              $t("lesson_book_confirm_description", {
                name: `${selectedInstructor.firstName} ${selectedInstructor.lastName}`,
                date: $d(selectedSlot.toDate(), "dateLong"),
                time: $d(selectedSlot.toDate(), "time"),
              })
            }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            :disabled="lessonStore.saving"
            @click="confirmBookingOpen = false"
          >
            {{ $t("common_cancel") }}
          </Button>
          <Button
            :disabled="lessonStore.saving"
            @click="confirmBookingFromInstructorFlow"
          >
            {{ lessonStore.saving ? $t("common_saving") : $t("lesson_book") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="instructorPickerOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ $t("lesson_book_choose_instructor") }}</DialogTitle>
          <DialogDescription v-if="selectedSlot">
            {{ $d(selectedSlot.toDate(), "dateLong") }}
            ·
            {{ $d(selectedSlot.toDate(), "time") }}
          </DialogDescription>
        </DialogHeader>
        <p
          v-if="pickerInstructors.length === 1"
          class="text-sm text-muted-foreground"
        >
          {{
            $t("lesson_book_only_instructor", {
              name: pickerInstructors[0]
                ? `${pickerInstructors[0].firstName} ${pickerInstructors[0].lastName}`
                : "",
            })
          }}
        </p>
        <div v-else class="flex flex-col gap-2">
          <Button
            v-for="instructor in pickerInstructors"
            :key="instructor.id"
            variant="outline"
            class="justify-start"
            @click="confirmInstructor(instructor.id)"
          >
            {{ instructor.firstName }} {{ instructor.lastName }}
          </Button>
        </div>
        <DialogFooter v-if="pickerInstructors.length === 1">
          <Button
            :disabled="lessonStore.saving"
            @click="confirmInstructor(pickerInstructors[0]!.id)"
          >
            {{ lessonStore.saving ? $t("common_saving") : $t("lesson_book") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, type Ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  ENROLLMENT_STATUSES,
  type UserDto,
} from "@driving-school-booking/shared-types";
import { toast } from "vue-sonner";
import { useAuthStore } from "@/auth/auth.store";
import { useLessonStore } from "@/lessons/lessons.store";
import type { SlotModel } from "@/lessons/lessons.models";
import SlotPanel from "@/lessons/SlotPanel.vue";
import { CalendarIcon } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState.vue";
import PageHeader from "@/components/PageHeader.vue";
import {
  type CalendarDate,
  type DateValue,
  type ZonedDateTime,
  endOfMonth,
  endOfWeek,
  getLocalTimeZone,
  startOfMonth,
  startOfWeek,
  today,
} from "@internationalized/date";
import {
  dateStart,
  dateEnd,
  isoLocalDate,
  sameLocalDay,
  WEEK_LOCALE,
  WEEK_STARTS_ON,
} from "@/lib/date-utils";
import api from "@/api/api";

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const lessonStore = useLessonStore();

const flow = ref<"instructor" | "time">("instructor");

const loadingEnrollments = ref(true);
const enrollmentError = ref<string | null>(null);
const enrollments = ref<UserDto["studentProfile"]>();

const selectedEnrollmentId = ref<string | null>(null);
const selectedInstructorId = ref<string | null>(null);
const selectedDate = ref(null) as Ref<CalendarDate | null>;
const selectedSlot = ref(null) as Ref<ZonedDateTime | null>;

const instructorPickerOpen = ref(false);
const pickerInstructorIds = ref<string[]>([]);
const confirmBookingOpen = ref(false);

const selectedInstructor = computed(() =>
  lessonStore.availableInstructors.find(
    (i) => i.id === selectedInstructorId.value,
  ),
);

const activeEnrollments = computed(() => {
  if (!enrollments.value?.enrollments) {
    return [];
  }
  return enrollments.value.enrollments.filter(
    (e) => e.status === ENROLLMENT_STATUSES.ACTIVE,
  );
});

const singleEnrollment = computed(() =>
  activeEnrollments.value.length === 1 ? activeEnrollments.value[0] : null,
);

const minDate = computed(() => today(getLocalTimeZone()));
const calendarPlaceholder = ref(today(getLocalTimeZone())) as Ref<CalendarDate>;

const pickerInstructors = computed(() =>
  pickerInstructorIds.value
    .map((id) => lessonStore.availableInstructors.find((i) => i.id === id))
    .filter(
      (i): i is { id: string; firstName: string; lastName: string } =>
        i !== undefined,
    ),
);

const availableDays = computed<Set<string>>(() => {
  const set = new Set<string>();
  for (const slot of lessonStore.slots) {
    set.add(isoLocalDate(slot.startTime));
  }
  return set;
});

const slotsForSelectedDate = computed<SlotModel[]>(() => {
  if (!selectedDate.value) {
    return [];
  }
  const date = selectedDate.value;
  return lessonStore.slots.filter((s) => sameLocalDay(s.startTime, date));
});

const isDateUnavailable = computed(() => {
  return (date: DateValue) => {
    return !availableDays.value.has(date.toString());
  };
});

onMounted(async () => {
  loadingEnrollments.value = true;
  try {
    const userId = authStore.user!.id;
    const { data } = await api.get<UserDto>(`/users/${userId}`);
    enrollments.value = data.studentProfile;
    if (singleEnrollment.value) {
      selectedEnrollmentId.value = singleEnrollment.value.id;
      onEnrollmentChange();
    }
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
  if (!selectedEnrollmentId.value) {
    return;
  }
  void lessonStore.fetchAvailableInstructors(selectedEnrollmentId.value);
  void refreshSlots();
}

function onFlowChange() {
  selectedDate.value = null;
  selectedSlot.value = null;
  void refreshSlots();
}

function onInstructorChange() {
  selectedDate.value = null;
  selectedSlot.value = null;
  void refreshSlots();
}

function refreshSlots() {
  if (!selectedEnrollmentId.value) {
    return;
  }
  const timezone = getLocalTimeZone();
  const gridStart = startOfWeek(
    startOfMonth(calendarPlaceholder.value),
    WEEK_LOCALE,
  );
  const gridEnd = endOfWeek(endOfMonth(calendarPlaceholder.value), WEEK_LOCALE);
  const todayDate = today(timezone);
  const start = gridStart.compare(todayDate) < 0 ? todayDate : gridStart;
  return lessonStore.fetchSlots({
    enrollmentId: selectedEnrollmentId.value,
    from: dateStart(start, timezone),
    to: dateEnd(gridEnd, timezone),
    ...(flow.value === "instructor" && selectedInstructorId.value
      ? { instructorId: selectedInstructorId.value }
      : {}),
  });
}

watch(calendarPlaceholder, () => {
  void refreshSlots();
});

function onCalendarChange(value: DateValue | undefined) {
  if (!value) {
    selectedDate.value = null;
    selectedSlot.value = null;
    return;
  }
  selectedDate.value = value as CalendarDate;
  selectedSlot.value = null;
}

function onAggregatedSlotPick(slot: SlotModel) {
  selectedSlot.value = slot.startTime;
  pickerInstructorIds.value = slot.instructorIds;
  instructorPickerOpen.value = true;
}

async function confirmInstructor(instructorId: string) {
  await handleBook(instructorId);
  instructorPickerOpen.value = false;
}

async function confirmBookingFromInstructorFlow() {
  if (!selectedInstructorId.value) {
    return;
  }
  await handleBook(selectedInstructorId.value);
  confirmBookingOpen.value = false;
}

async function handleBook(instructorId: string) {
  if (!selectedEnrollmentId.value || !selectedSlot.value) {
    return;
  }
  try {
    await lessonStore.bookLesson({
      enrollmentId: selectedEnrollmentId.value,
      instructorId,
      startTime: selectedSlot.value.toAbsoluteString(),
    });

    toast.success(t("lesson_booked"));
    void router.push({ name: "my-lessons" });
  } catch {
    toast.error(t("lesson_book_failed"));
  }
}
</script>
