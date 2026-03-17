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
        <Input
          type="time"
          :model-value="block.startTime"
          @update:model-value="
            updateBlock(day - 1, index, 'startTime', $event as string)
          "
          class="w-32"
        />
        <span class="text-muted-foreground">—</span>
        <Input
          type="time"
          :model-value="block.endTime"
          @update:model-value="
            updateBlock(day - 1, index, 'endTime', $event as string)
          "
          class="w-32"
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
import type { InstructorAvailabilityDto } from "@driving-school-booking/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const model = defineModel<InstructorAvailabilityDto[]>({ required: true });

function getBlocksForDay(dayOfWeek: number): InstructorAvailabilityDto[] {
  return model.value.filter((s) => s.dayOfWeek === dayOfWeek);
}

function addBlock(dayOfWeek: number) {
  model.value = [
    ...model.value,
    { dayOfWeek, startTime: "08:00", endTime: "18:00" },
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
  value: string,
) {
  const dayBlocks = model.value.filter((s) => s.dayOfWeek === dayOfWeek);
  const target = dayBlocks[index];
  model.value = model.value.map((s) =>
    s === target ? { ...s, [field]: value } : s,
  );
}
</script>
