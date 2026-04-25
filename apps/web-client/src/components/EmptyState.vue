<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div class="mb-3 rounded-full bg-muted p-3">
      <component :is="iconComponent" class="size-6 text-muted-foreground" />
    </div>
    <p class="text-sm font-medium">{{ title }}</p>
    <p v-if="description" class="mt-1 text-xs text-muted-foreground max-w-sm">
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type FunctionalComponent } from "vue";
import { InboxIcon } from "lucide-vue-next";

const props = defineProps<{
  title: string;
  description?: string;
  icon?: FunctionalComponent;
}>();

const iconComponent = computed(() => props.icon ?? InboxIcon);
</script>
