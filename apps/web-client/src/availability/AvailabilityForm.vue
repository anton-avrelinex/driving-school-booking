<template>
  <div class="flex flex-col gap-6">
    <div
      v-for="(dayOfWeek, i) in WEEK_ORDER"
      :key="dayOfWeek"
      class="flex flex-col gap-2"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">
          {{ $t(`common_days[${i}]`) }}
        </span>
        <Button
          variant="outline"
          size="sm"
          type="button"
          @click="addBlock(dayOfWeek)"
        >
          {{ $t("teacher_availability_add_block") }}
        </Button>
      </div>

      <p
        v-if="getBlocksForDay(dayOfWeek).length === 0"
        class="text-sm text-muted-foreground"
      >
        {{ $t("teacher_availability_no_blocks") }}
      </p>

      <div
        v-for="(block, index) in getBlocksForDay(dayOfWeek)"
        :key="index"
        class="flex items-center gap-2"
      >
        <TimePicker
          :model-value="block.startTime"
          @update:model-value="
            (v) => v && updateBlock(dayOfWeek, index, 'startTime', v)
          "
        />
        <span class="text-muted-foreground">—</span>
        <TimePicker
          :model-value="block.endTime"
          @update:model-value="
            (v) => v && updateBlock(dayOfWeek, index, 'endTime', v)
          "
        />
        <Button
          variant="ghost"
          size="sm"
          type="button"
          @click="removeBlock(dayOfWeek, index)"
        >
          {{ $t("teacher_availability_remove_block") }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Time } from "@internationalized/date";
import type { AvailabilityBlockModel } from "@/availability/availability.models";
import { WEEK_ORDER } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { TimePicker } from "@/components/ui/time-picker";

const model = defineModel<AvailabilityBlockModel[]>({ required: true });

function getBlocksForDay(dayOfWeek: number): AvailabilityBlockModel[] {
  return model.value.filter((s) => s.dayOfWeek === dayOfWeek);
}

function addBlock(dayOfWeek: number) {
  model.value = [
    ...model.value,
    { dayOfWeek, startTime: new Time(8, 0), endTime: new Time(18, 0) },
  ];
}

function removeBlock(dayOfWeek: number, index: number) {
  const dayBlocks = model.value.filter((s) => s.dayOfWeek === dayOfWeek);
  const toRemove = dayBlocks[index];
  model.value = model.value.filter((s) => s !== toRemove);
}

function updateBlock(
  dayOfWeek: number,
  index: number,
  field: "startTime" | "endTime",
  value: Time,
) {
  const dayBlocks = model.value.filter((s) => s.dayOfWeek === dayOfWeek);
  const target = dayBlocks[index];
  model.value = model.value.map((s) =>
    s === target ? { ...s, [field]: value } : s,
  );
}
</script>
