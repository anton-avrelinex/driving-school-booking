<template>
  <div class="flex items-center gap-1">
    <Select :model-value="hourStr" @update:model-value="setHour">
      <SelectTrigger class="w-[70px]">
        <SelectValue :placeholder="'--'" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="h in hours" :key="h" :value="h">{{ h }}</SelectItem>
      </SelectContent>
    </Select>
    <span class="text-muted-foreground">:</span>
    <Select :model-value="minuteStr" @update:model-value="setMinute">
      <SelectTrigger class="w-[70px]">
        <SelectValue :placeholder="'--'" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="m in minutes" :key="m" :value="m">{{ m }}</SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Time } from "@internationalized/date";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const props = withDefaults(
  defineProps<{
    minuteStep?: number;
  }>(),
  {
    minuteStep: 15,
  },
);

const model = defineModel<Time | null>();

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

const hours = computed(() => Array.from({ length: 24 }, (_, i) => pad(i)));

const minutes = computed(() => {
  const result: string[] = [];
  for (let m = 0; m < 60; m += props.minuteStep) {
    result.push(pad(m));
  }
  return result;
});

const hourStr = computed(() =>
  model.value ? pad(model.value.hour) : null,
);
const minuteStr = computed(() =>
  model.value ? pad(model.value.minute) : null,
);

function setHour(v: unknown) {
  if (typeof v !== "string") return;
  model.value = new Time(parseInt(v, 10), model.value?.minute ?? 0);
}

function setMinute(v: unknown) {
  if (typeof v !== "string") return;
  model.value = new Time(model.value?.hour ?? 0, parseInt(v, 10));
}
</script>
