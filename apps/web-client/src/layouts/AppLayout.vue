<template>
  <div class="flex min-h-screen">
    <AppSidebar />
    <main class="flex-1 p-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from "@/layouts/AppSidebar.vue";
</script>
