<template>
  <div class="flex h-screen">
    <AppSidebar />
    <main class="flex-1 p-6 flex flex-col min-w-0 min-h-0 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import AppSidebar from "@/layouts/AppSidebar.vue";
import { useMessagesStore } from "@/messages/messages.store";

const messages = useMessagesStore();

onMounted(() => {
  void messages.fetchConversations();
  messages.startSse();
});

onBeforeUnmount(() => {
  messages.stopSse();
});
</script>
