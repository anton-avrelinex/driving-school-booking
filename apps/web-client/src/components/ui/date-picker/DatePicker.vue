<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="
          cn(
            'w-full justify-start text-left font-normal',
            !model && 'text-muted-foreground',
          )
        "
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        <span>{{ formatted || placeholder }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <Calendar
        :model-value="model ?? undefined"
        :min-value="min"
        :max-value="max"
        @update:model-value="handleSelect"
      />
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CalendarIcon } from "lucide-vue-next";
import {
  type CalendarDate,
  type DateValue,
  getLocalTimeZone,
  toCalendarDate,
} from "@internationalized/date";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

defineProps<{
  min?: CalendarDate;
  max?: CalendarDate;
  placeholder?: string;
}>();

const model = defineModel<CalendarDate | null>();

const formatted = computed(() =>
  model.value ? model.value.toDate(getLocalTimeZone()).toLocaleDateString() : "",
);

function handleSelect(v: DateValue | DateValue[] | null | undefined) {
  if (!v) {
    model.value = null;
    return;
  }
  const d = Array.isArray(v) ? v[0] : v;
  model.value = d ? toCalendarDate(d) : null;
}
</script>
