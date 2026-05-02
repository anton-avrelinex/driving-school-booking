<template>
  <div class="flex h-screen">
    <AppSidebar />
    <main class="flex-1 p-6 flex flex-col min-w-0 min-h-0 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from "@/layouts/AppSidebar.vue";
</script>
