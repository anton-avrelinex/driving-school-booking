<template>
  <div class="flex items-start justify-between gap-4 mb-6 pb-4 border-b">
    <div class="min-w-0">
      <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
      <p
        v-if="description"
        class="mt-1 text-sm text-muted-foreground"
      >
        {{ description }}
      </p>
    </div>
    <div
      v-if="$slots.actions"
      class="flex items-center gap-2 shrink-0"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>
