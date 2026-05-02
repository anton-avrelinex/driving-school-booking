<template>
  <div class="flex flex-col gap-3 h-full min-h-0">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              :aria-label="$t('schedule_prev')"
              @click="goPrev"
            >
              <ChevronLeftIcon class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{{ $t("schedule_prev") }}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              :aria-label="$t('schedule_next')"
              @click="goNext"
            >
              <ChevronRightIcon class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{{ $t("schedule_next") }}</TooltipContent>
        </Tooltip>
        <Button variant="outline" size="sm" @click="goToday">
          {{ $t("schedule_today") }}
        </Button>
        <span class="ml-2 text-sm font-medium">{{ rangeLabel }}</span>
      </div>

      <div class="flex items-center gap-0.5 rounded-md border p-0.5">
        <Button
          :variant="mode === 'week' ? 'default' : 'ghost'"
          size="sm"
          @click="mode = 'week'"
        >
          {{ $t("schedule_view_week") }}
        </Button>
        <Button
          :variant="mode === 'month' ? 'default' : 'ghost'"
          size="sm"
          @click="mode = 'month'"
        >
          {{ $t("schedule_view_month") }}
        </Button>
      </div>
    </div>

    <Card class="overflow-hidden flex-1 min-h-0 flex flex-col py-0">
      <ScheduleWeekView
        v-if="mode === 'week'"
        :week-anchor="anchor"
        :lessons="visibleLessons"
        :availability="availability"
        class="flex-1 min-h-0"
        @lesson-click="onLessonClick"
      />
      <ScheduleMonthView
        v-else
        :month-anchor="anchor"
        :lessons="visibleLessons"
        class="flex-1 min-h-0"
        @lesson-click="onLessonClick"
      />
    </Card>

    <Dialog v-model:open="dialogOpen">
      <DialogContent v-if="selectedLesson">
        <DialogHeader>
          <DialogTitle>{{ selectedLesson.courseName }}</DialogTitle>
          <DialogDescription>
            {{ $d(selectedLesson.startTime.toDate(), "dateLong") }}
            ·
            {{ $d(selectedLesson.startTime.toDate(), "time") }} —
            {{ $d(selectedLesson.endTime.toDate(), "time") }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <span class="text-muted-foreground">
            {{ $t("lesson_instructor") }}
          </span>
          <span>{{ selectedLesson.instructorName }}</span>
          <span class="text-muted-foreground">
            {{ $t("lesson_student") }}
          </span>
          <span>{{ selectedLesson.studentName }}</span>
          <span class="text-muted-foreground">
            {{ $t("lesson_vehicle") }}
          </span>
          <span>{{ selectedLesson.vehicleName ?? "—" }}</span>
          <span class="text-muted-foreground">
            {{ $t("lesson_status") }}
          </span>
          <span>
            <Badge :variant="lessonStatusVariant(selectedLesson.status)">
              {{ $t(`lesson_status_${selectedLesson.status.toLowerCase()}`) }}
            </Badge>
          </span>
        </div>
        <DialogFooter>
          <slot
            name="lesson-actions"
            :lesson="selectedLesson"
            :close="closeDialog"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  type CalendarDate,
  endOfWeek,
  getLocalTimeZone,
  startOfMonth,
  startOfWeek,
  today,
} from "@internationalized/date";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-vue-next";
import {
  LESSON_STATUSES,
  type LessonStatus,
} from "@driving-school-booking/shared-types";
import type { LessonModel } from "@/lessons/lessons.models";
import type { AvailabilityBlockModel } from "@/availability/availability.models";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariants } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ScheduleMonthView from "@/lessons/ScheduleMonthView.vue";
import ScheduleWeekView from "@/lessons/ScheduleWeekView.vue";
import { WEEK_LOCALE } from "@/lib/date-utils";

const props = defineProps<{
  lessons: LessonModel[];
  availability?: AvailabilityBlockModel[];
}>();

const visibleLessons = computed(() =>
  props.lessons.filter((l) => l.status !== LESSON_STATUSES.CANCELLED),
);

const { d } = useI18n();

type Mode = "week" | "month";
const mode = ref<Mode>("week");
const anchor = ref<CalendarDate>(
  today(getLocalTimeZone()),
) as Ref<CalendarDate>;

const selectedLesson = ref<LessonModel | null>(null) as Ref<LessonModel | null>;
const dialogOpen = ref(false);

function goPrev() {
  anchor.value = anchor.value.subtract(
    mode.value === "week" ? { weeks: 1 } : { months: 1 },
  );
}

function goNext() {
  anchor.value = anchor.value.add(
    mode.value === "week" ? { weeks: 1 } : { months: 1 },
  );
}

function goToday() {
  anchor.value = today(getLocalTimeZone());
}

function onLessonClick(lesson: LessonModel) {
  selectedLesson.value = lesson;
  dialogOpen.value = true;
}

function closeDialog() {
  dialogOpen.value = false;
}

const rangeLabel = computed(() => {
  const timezone = getLocalTimeZone();
  if (mode.value === "week") {
    const start = startOfWeek(anchor.value, WEEK_LOCALE);
    const end = endOfWeek(anchor.value, WEEK_LOCALE);
    return `${d(start.toDate(timezone), "dateShortYear")} — ${d(
      end.toDate(timezone),
      "dateShortYear",
    )}`;
  }
  return d(startOfMonth(anchor.value).toDate(timezone), "monthYear");
});

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
</script>
