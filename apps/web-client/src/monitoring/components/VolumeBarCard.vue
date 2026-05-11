<template>
  <BarChart
    :title="t('monitoring_title_volume')"
    :description="t('monitoring_description_volume')"
    :data="store.volume"
  />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useMonitoringStore } from "@/monitoring/monitoring.store";
import BarChart from "@/monitoring/BarChart.vue";

const { t } = useI18n();
const store = useMonitoringStore();
</script>
