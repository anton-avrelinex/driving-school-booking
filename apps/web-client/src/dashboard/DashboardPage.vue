<template>
  <div>
    <h1 class="text-2xl font-bold">{{ $t("dashboard_title") }}</h1>
    <p class="mt-2 text-muted-foreground">
      <i18n-t keypath="dashboard_welcome" tag="span">
        <template #role>
          <strong>{{ auth.user?.role }}</strong>
        </template>
      </i18n-t>
    </p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/auth/auth.store";

const auth = useAuthStore();
</script>
