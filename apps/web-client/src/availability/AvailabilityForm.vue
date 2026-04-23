<template>
  <div class="flex flex-col gap-6">
    <div v-for="day in 7" :key="day - 1" class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">
          {{ $t(`common_days[${day - 1}]`) }}
        </span>
        <Button
          variant="outline"
          size="sm"
          type="button"
          @click="addBlock(day - 1)"
        >
          {{ $t("teacher_availability_add_block") }}
        </Button>
      </div>

      <p
        v-if="getBlocksForDay(day - 1).length === 0"
        class="text-sm text-muted-foreground"
      >
        {{ $t("teacher_availability_no_blocks") }}
      </p>

      <div
        v-for="(block, index) in getBlocksForDay(day - 1)"
        :key="index"
        class="flex items-center gap-2"
      >
        <TimePicker
          :model-value="block.startTime"
          @update:model-value="
            (v) => v && updateBlock(day - 1, index, 'startTime', v)
          "
        />
        <span class="text-muted-foreground">—</span>
        <TimePicker
          :model-value="block.endTime"
          @update:model-value="
            (v) => v && updateBlock(day - 1, index, 'endTime', v)
          "
        />
        <Button
          variant="ghost"
          size="sm"
          type="button"
          @click="removeBlock(day - 1, index)"
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
