<template>
  <RouterView />
  <Toaster rich-colors />
</template>

<script setup lang="ts">
import "vue-sonner/style.css";
import { Toaster } from "@/components/ui/sonner";
</script>
