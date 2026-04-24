<template>
  <Card>
    <CardContent class="p-6">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-sm font-medium text-muted-foreground truncate">
            {{ label }}
          </p>
          <p class="mt-2 text-3xl font-bold tracking-tight">{{ value }}</p>
          <p v-if="hint" class="mt-1 text-xs text-muted-foreground">
            {{ hint }}
          </p>
        </div>
        <div
          v-if="icon"
          class="shrink-0 rounded-md bg-primary/10 p-2 text-primary"
        >
          <component :is="icon" class="size-5" />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import { Card, CardContent } from "@/components/ui/card";

defineProps<{
  label: string;
  value: string | number;
  hint?: string;
  icon?: Component;
}>();
</script>
