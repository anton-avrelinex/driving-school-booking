<template>
  <div class="space-y-6">
    <nav class="flex gap-1 border-b">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="
          isActive(tab.to)
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
        "
      >
        {{ tab.label }}
      </RouterLink>
    </nav>

    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const { t } = useI18n();
const route = useRoute();

const tabs = computed(() => [
  { to: "/admin/monitoring/requests", label: t("monitoring_tab_requests") },
  { to: "/admin/monitoring/health", label: t("monitoring_tab_health") },
  { to: "/admin/monitoring/logs", label: t("monitoring_tab_logs") },
  { to: "/admin/monitoring/analytics", label: t("monitoring_tab_analytics") },
]);

function isActive(path: string): boolean {
  return route.path === path;
}
</script>
