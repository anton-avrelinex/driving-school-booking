<template>
  <div>
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <p class="mt-2 text-muted-foreground">
      Welcome back. You are logged in as <strong>{{ auth.user?.role }}</strong>.
    </p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/auth/auth.store";

const auth = useAuthStore();
</script>
