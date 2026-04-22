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
        :model-value="calendarValue"
        :min-value="minDate"
        :max-value="maxDate"
        @update:model-value="handleSelect"
      />
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CalendarIcon } from "lucide-vue-next";
import { parseDate, type DateValue } from "@internationalized/date";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const props = defineProps<{
  min?: string;
  max?: string;
  placeholder?: string;
}>();

const model = defineModel<string | null>();

const calendarValue = computed(() =>
  model.value ? parseDate(model.value) : undefined,
);
const minDate = computed(() => (props.min ? parseDate(props.min) : undefined));
const maxDate = computed(() => (props.max ? parseDate(props.max) : undefined));

const formatted = computed(() => {
  if (!model.value) return "";
  return new Date(`${model.value}T00:00:00`).toLocaleDateString();
});

function handleSelect(v: DateValue | DateValue[] | undefined) {
  if (!v) {
    model.value = null;
    return;
  }
  const date = Array.isArray(v) ? v[0] : v;
  model.value = date ? date.toString() : null;
}
</script>
