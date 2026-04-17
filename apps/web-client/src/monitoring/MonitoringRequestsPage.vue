<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end gap-4">
      <div class="flex flex-col gap-1.5">
        <Label for="filter-from">{{ t("monitoring_filter_from") }}</Label>
        <Input id="filter-from" v-model="filterFrom" type="date" class="w-40" />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="filter-to">{{ t("monitoring_filter_to") }}</Label>
        <Input id="filter-to" v-model="filterTo" type="date" class="w-40" />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label>{{ t("monitoring_filter_granularity") }}</Label>
        <Select v-model="granularity">
          <SelectTrigger class="w-32">
            <SelectValue :placeholder="t('monitoring_filter_granularity')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="GRANULARITIES.HOUR">
              {{ t("monitoring_granularity_hour") }}
            </SelectItem>
            <SelectItem :value="GRANULARITIES.DAY">
              {{ t("monitoring_granularity_day") }}
            </SelectItem>
            <SelectItem :value="GRANULARITIES.WEEK">
              {{ t("monitoring_granularity_week") }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button @click="applyFilters">{{ t("monitoring_apply") }}</Button>
    </div>

    <div v-if="store.loading" class="text-muted-foreground py-12 text-center">
      {{ t("monitoring_loading") }}
    </div>

    <div v-else-if="store.error" class="text-destructive py-12 text-center">
      {{ store.error }}
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-2">
      <PieChart
        :title="t('monitoring_title_top_endpoints')"
        :description="t('monitoring_description_top_endpoints')"
        :items="topEndpointItems"
        :chart-config="topEndpointConfig"
        :central-sub-label="t('monitoring_requests')"
      />
      <PieChart
        :title="t('monitoring_title_by_school')"
        :description="t('monitoring_description_by_school')"
        :items="bySchoolItems"
        :chart-config="bySchoolConfig"
        :central-sub-label="t('monitoring_requests')"
      />
      <div class="lg:col-span-2">
        <BarChart
          :title="t('monitoring_title_volume')"
          :description="t('monitoring_description_volume')"
          :data="store.volume"
        />
      </div>
      <LineChart
        :title="t('monitoring_title_error_rate')"
        :description="t('monitoring_description_error_rate')"
        :data="errorRateData"
        :chart-config="errorRateConfig"
        :line-keys="['rate']"
      />
      <LineChart
        :title="t('monitoring_title_latency')"
        :description="t('monitoring_description_latency')"
        :data="latencyData"
        :chart-config="latencyConfig"
        :line-keys="['p50', 'p95', 'p99']"
        unit="ms"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartConfig } from "@/components/ui/chart";
import {
  GRANULARITIES,
  type Granularity,
  type TimeSeriesFilters,
} from "@driving-school-booking/shared-types";

import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMonitoringStore } from "./monitoring.store";
import PieChart from "./PieChart.vue";
import type { PieItem } from "./PieChart.vue";
import BarChart from "./BarChart.vue";
import LineChart from "./LineChart.vue";

const { t } = useI18n();

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const store = useMonitoringStore();

const now = new Date();
const sevenDaysAgo = new Date(now);
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const filterFrom = ref(formatDateForInput(sevenDaysAgo));
const filterTo = ref(formatDateForInput(now));
const granularity = ref<Granularity>(GRANULARITIES.DAY);

function formatDateForInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildFilters(): TimeSeriesFilters {
  return {
    from: new Date(filterFrom.value).toISOString(),
    to: new Date(filterTo.value + "T23:59:59.999Z").toISOString(),
    granularity: granularity.value,
  };
}

async function applyFilters() {
  await store.fetchAll(buildFilters());
}

onMounted(async () => {
  await applyFilters();
});

// -- Top Endpoints pie chart --

const topEndpointItems = computed<PieItem[]>(() =>
  store.topEndpoints.map((ep, i) => {
    const label = `${ep.method} ${ep.path}`;
    return {
      label,
      value: ep.count,
      fill: CHART_COLORS[i % CHART_COLORS.length]!,
      [label]: ep.count,
    };
  }),
);

const topEndpointConfig = computed<ChartConfig>(() => {
  const config: ChartConfig = {};
  store.topEndpoints.forEach((ep, i) => {
    const key = `${ep.method} ${ep.path}`;
    config[key] = {
      label: key,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });
  return config;
});

// -- Requests by School pie chart --

const bySchoolItems = computed<PieItem[]>(() =>
  store.bySchool.map((s, i) => {
    const label = s.schoolId ?? t("monitoring_no_school");
    return {
      label,
      value: s.count,
      fill: CHART_COLORS[i % CHART_COLORS.length]!,
      [label]: s.count,
    };
  }),
);

const bySchoolConfig = computed<ChartConfig>(() => {
  const config: ChartConfig = {};
  store.bySchool.forEach((s, i) => {
    const key = s.schoolId ?? t("monitoring_no_school");
    config[key] = {
      label: key,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });
  return config;
});

// -- Error Rate line chart --

const errorRateData = computed<Record<string, unknown>[]>(() =>
  store.errorRate.map((d) => ({
    bucket: d.bucket,
    rate: d.rate,
  })),
);

const errorRateConfig = computed<ChartConfig>(() => ({
  rate: { label: t("monitoring_error_rate"), color: "var(--chart-1)" },
}));

// -- Latency line chart --

const latencyData = computed<Record<string, unknown>[]>(() =>
  store.latency.map((d) => ({
    bucket: d.bucket,
    p50: d.p50,
    p95: d.p95,
    p99: d.p99,
  })),
);

const latencyConfig = computed<ChartConfig>(() => ({
  p50: { label: t("monitoring_latency_p50"), color: "var(--chart-1)" },
  p95: { label: t("monitoring_latency_p95"), color: "var(--chart-3)" },
  p99: { label: t("monitoring_latency_p99"), color: "var(--chart-5)" },
}));
</script>
