<template>
  <div class="flex flex-col gap-6">
    <PageHeader :title="title" :description="description">
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </PageHeader>
    <slot />
  </div>
</template>

<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";

defineProps<{
  title: string;
  description?: string;
}>();
</script>
