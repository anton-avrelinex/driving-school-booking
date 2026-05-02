<template>
  <div class="p-4 flex flex-col gap-3 min-h-80">
    <div>
      <p class="text-sm font-medium">{{ $t("lesson_time_slot") }}</p>
      <p class="text-xs text-muted-foreground">
        {{
          selectedDate
            ? $d(selectedDate.toDate(getLocalTimeZone()), "dateLong")
            : $t("lesson_book_pick_date")
        }}
      </p>
    </div>

    <Transition name="fade" mode="out-in">
      <div v-if="!selectedDate" class="flex-1" />

      <div v-else-if="loading" class="flex flex-col gap-2">
        <Skeleton v-for="i in 5" :key="i" class="h-9 w-full" />
      </div>

      <div
        v-else-if="slots.length === 0"
        class="flex-1 flex items-center justify-center"
      >
        <EmptyState
          :title="$t('lesson_no_slots')"
          :description="$t('lesson_no_slots_description')"
          :icon="ClockIcon"
        />
      </div>

      <div
        v-else
        class="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1"
      >
        <Button
          v-for="slot in slots"
          :key="slot.startTime.toAbsoluteString()"
          :variant="
            selectedSlot && selectedSlot.compare(slot.startTime) === 0
              ? 'default'
              : 'outline'
          "
          :class="showCounts ? 'justify-between' : 'justify-center'"
          @click="$emit('select-slot', slot)"
        >
          <span>
            {{ $d(slot.startTime.toDate(), "time") }} -
            {{ $d(slot.endTime.toDate(), "time") }}
          </span>
          <span v-if="showCounts" class="text-xs text-muted-foreground">
            {{
              $t("lesson_book_instructors_available", {
                count: slot.instructorIds.length,
              })
            }}
          </span>
        </Button>
      </div>
    </Transition>

    <Button
      v-if="!showCounts && selectedSlot"
      :disabled="saving"
      @click="$emit('book')"
    >
      {{ saving ? $t("common_saving") : $t("lesson_book") }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import {
  type CalendarDate,
  type ZonedDateTime,
  getLocalTimeZone,
} from "@internationalized/date";
import { ClockIcon } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState.vue";
import type { SlotModel } from "@/lessons/lessons.models";

defineProps<{
  selectedDate: CalendarDate | null;
  selectedSlot: ZonedDateTime | null;
  slots: SlotModel[];
  loading: boolean;
  saving: boolean;
  showCounts: boolean;
}>();

defineEmits<{
  "select-slot": [SlotModel];
  book: [];
}>();
</script>
