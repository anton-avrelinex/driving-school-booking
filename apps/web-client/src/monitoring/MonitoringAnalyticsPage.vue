<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end gap-4">
      <div class="flex flex-col gap-1.5">
        <Label>{{ t("monitoring_filter_from") }}</Label>
        <div class="w-40">
          <DatePicker v-model="filterFrom" />
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <Label>{{ t("monitoring_filter_to") }}</Label>
        <div class="w-40">
          <DatePicker v-model="filterTo" />
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <Label>{{ t("monitoring_filter_granularity") }}</Label>
        <Select v-model="granularity">
          <SelectTrigger class="w-32">
            <SelectValue />
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
      <div class="flex flex-col gap-1.5">
        <Label>{{ t("analytics_filter_school_id") }}</Label>
        <Input
          v-model="filterSchoolId"
          type="text"
          class="w-40"
          :placeholder="t('common_all')"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label>{{ t("analytics_filter_user_id") }}</Label>
        <Input
          v-model="filterUserId"
          type="text"
          class="w-40"
          :placeholder="t('common_all')"
        />
      </div>
      <Button @click="applyFilters">{{ t("monitoring_apply") }}</Button>
    </div>

    <div v-if="store.loading" class="text-muted-foreground py-12 text-center">
      {{ t("analytics_loading") }}
    </div>

    <div v-else-if="store.error" class="text-destructive py-12 text-center">
      {{ store.error }}
    </div>

    <div v-else class="space-y-6">
      <!-- Event Trends -->
      <LineChart
        v-if="eventSeriesData.length > 0"
        :title="t('analytics_title_event_trends')"
        :description="''"
        :data="eventSeriesData"
        :chart-config="eventSeriesConfig"
        :line-keys="eventSeriesKeys"
      />

      <!-- Event Counts -->
      <PieChart
        v-if="store.eventCounts.length > 0"
        :title="t('analytics_title_events')"
        :description="''"
        :items="eventItems"
        :chart-config="eventConfig"
        :central-sub-label="'events'"
      />
      <Card v-else>
        <CardContent class="py-4">
          <p class="text-muted-foreground text-sm text-center">
            {{ t("common_no_results") }}
          </p>
        </CardContent>
      </Card>

      <!-- Page Views Table -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t("analytics_title_page_views") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table v-if="store.pageViews.length > 0">
            <TableHeader>
              <TableRow>
                <TableHead>{{ t("analytics_col_route") }}</TableHead>
                <TableHead class="text-right">
                  {{ t("analytics_col_count") }}
                </TableHead>
                <TableHead class="text-right">
                  {{ t("analytics_col_duration") }}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="pv in store.pageViews" :key="pv.route">
                <TableCell class="text-sm font-mono">{{ pv.route }}</TableCell>
                <TableCell class="text-sm text-right">{{ pv.count }}</TableCell>
                <TableCell class="text-sm text-right">
                  {{ Math.round(pv.avgDurationMs) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p v-else class="text-muted-foreground text-sm py-4 text-center">
            {{ t("common_no_results") }}
          </p>
        </CardContent>
      </Card>

      <!-- Performance Table -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t("analytics_title_performance") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table v-if="store.performance.length > 0">
            <TableHeader>
              <TableRow>
                <TableHead>{{ t("analytics_col_route") }}</TableHead>
                <TableHead class="text-right">
                  {{ t("analytics_col_avg") }}
                </TableHead>
                <TableHead class="text-right">
                  {{ t("analytics_col_p50") }}
                </TableHead>
                <TableHead class="text-right">
                  {{ t("analytics_col_p95") }}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="p in store.performance" :key="p.route">
                <TableCell class="text-sm font-mono">{{ p.route }}</TableCell>
                <TableCell class="text-sm text-right">
                  {{ Math.round(p.avg) }}
                </TableCell>
                <TableCell class="text-sm text-right">
                  {{ Math.round(p.p50) }}
                </TableCell>
                <TableCell class="text-sm text-right">
                  {{ Math.round(p.p95) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p v-else class="text-muted-foreground text-sm py-4 text-center">
            {{ t("common_no_results") }}
          </p>
        </CardContent>
      </Card>

      <!-- Route selector for per-route trends -->
      <div v-if="allRoutes.length > 0" class="flex items-center gap-2">
        <Label>{{ t("analytics_col_route") }}</Label>
        <Select v-model="selectedRoute">
          <SelectTrigger class="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t("common_all") }}</SelectItem>
            <SelectItem v-for="route in allRoutes" :key="route" :value="route">
              {{ route }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Page View Trends (selected route) -->
      <LineChart
        v-if="pageViewSeriesData.length > 0"
        :title="t('analytics_title_page_view_trends')"
        :description="selectedRoute === 'all' ? t('common_all') : selectedRoute"
        :data="pageViewSeriesData"
        :chart-config="pageViewSeriesConfig"
        :line-keys="['count']"
      />

      <!-- Page Load Trends (selected route) -->
      <LineChart
        v-if="pageLoadSeriesData.length > 0"
        :title="t('analytics_title_page_load_trends')"
        :description="selectedRoute === 'all' ? t('common_all') : selectedRoute"
        :data="pageLoadSeriesData"
        :chart-config="pageLoadSeriesConfig"
        :line-keys="['avgLoadTimeMs']"
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
import { computed, onMounted, ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  type CalendarDate,
  getLocalTimeZone,
  today,
} from "@internationalized/date";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dateEnd, dateStart } from "@/lib/date-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAnalyticsStore } from "./analytics.store";
import PieChart from "./PieChart.vue";
import type { PieItem } from "./PieChart.vue";
import LineChart from "@/components/LineChart.vue";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const { t } = useI18n();
const store = useAnalyticsStore();

const filterFrom = ref(
  today(getLocalTimeZone()).subtract({ days: 7 }),
) as Ref<CalendarDate>;
const filterTo = ref(today(getLocalTimeZone())) as Ref<CalendarDate>;
const granularity = ref<Granularity>(GRANULARITIES.DAY);
const filterSchoolId = ref("");
const filterUserId = ref("");

function buildFilters(): TimeSeriesFilters {
  const filters: TimeSeriesFilters = {
    from: dateStart(filterFrom.value),
    to: dateEnd(filterTo.value),
    granularity: granularity.value,
  };
  if (filterSchoolId.value.trim())
    filters.schoolId = filterSchoolId.value.trim();
  if (filterUserId.value.trim()) filters.userId = filterUserId.value.trim();
  return filters;
}

async function applyFilters() {
  await store.fetchAll(buildFilters());
}

const eventItems = computed<PieItem[]>(() =>
  store.eventCounts.map((ec, i) => ({
    label: ec.event,
    value: ec.count,
    fill: CHART_COLORS[i % CHART_COLORS.length]!,
    [ec.event]: ec.count,
  })),
);

const eventConfig = computed<ChartConfig>(() => {
  const config: ChartConfig = {};
  store.eventCounts.forEach((ec, i) => {
    config[ec.event] = {
      label: ec.event,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });
  return config;
});

// Event count time-series: pivot from [{bucket, event, count}] to [{bucket, event1: n, event2: n}]
const eventSeriesKeys = computed(() => {
  const keys = new Set<string>();
  for (const d of store.eventCountSeries) {
    keys.add(d.event);
  }
  return [...keys];
});

const eventSeriesData = computed<Record<string, unknown>[]>(() => {
  const bucketMap = new Map<string, Record<string, unknown>>();
  for (const d of store.eventCountSeries) {
    const key = d.bucket.toAbsoluteString();
    if (!bucketMap.has(key)) bucketMap.set(key, { bucket: d.bucket.toDate() });
    bucketMap.get(key)![d.event] = d.count;
  }
  return [...bucketMap.values()];
});

const eventSeriesConfig = computed<ChartConfig>(() => {
  const config: ChartConfig = {};
  eventSeriesKeys.value.forEach((key, i) => {
    config[key] = {
      label: key,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });
  return config;
});

// Route selector for page view/load trends
const allRoutes = computed(() => {
  const routes = new Set<string>();
  for (const d of store.pageViewSeries) routes.add(d.route);
  for (const d of store.pageLoadSeries) routes.add(d.route);
  return [...routes].sort();
});

const selectedRoute = ref("all");

// Page view series filtered to selected route (or aggregated for "all")
const pageViewSeriesData = computed<Record<string, unknown>[]>(() => {
  const filtered =
    selectedRoute.value === "all"
      ? store.pageViewSeries
      : store.pageViewSeries.filter((d) => d.route === selectedRoute.value);

  if (selectedRoute.value !== "all") {
    return filtered.map((d) => ({
      bucket: d.bucket.toDate(),
      count: d.count,
    }));
  }

  // Aggregate all routes per bucket
  const bucketMap = new Map<string, { bucket: Date; count: number }>();
  for (const d of filtered) {
    const key = d.bucket.toAbsoluteString();
    const entry = bucketMap.get(key) ?? { bucket: d.bucket.toDate(), count: 0 };
    entry.count += d.count;
    bucketMap.set(key, entry);
  }
  return [...bucketMap.values()];
});

const pageViewSeriesConfig = computed<ChartConfig>(() => ({
  count: {
    label:
      selectedRoute.value === "all" ? t("common_all") : selectedRoute.value,
    color: CHART_COLORS[0],
  },
}));

// Page load series filtered to selected route (or aggregated for "all")
const pageLoadSeriesData = computed<Record<string, unknown>[]>(() => {
  const filtered =
    selectedRoute.value === "all"
      ? store.pageLoadSeries
      : store.pageLoadSeries.filter((d) => d.route === selectedRoute.value);

  if (selectedRoute.value !== "all") {
    return filtered.map((d) => ({
      bucket: d.bucket.toDate(),
      avgLoadTimeMs: d.avgLoadTimeMs,
    }));
  }

  // Average across routes per bucket
  const bucketMap = new Map<
    string,
    { bucket: Date; sum: number; count: number }
  >();
  for (const d of filtered) {
    const key = d.bucket.toAbsoluteString();
    const entry = bucketMap.get(key) ?? {
      bucket: d.bucket.toDate(),
      sum: 0,
      count: 0,
    };
    entry.sum += d.avgLoadTimeMs;
    entry.count++;
    bucketMap.set(key, entry);
  }
  return [...bucketMap.values()].map(({ bucket, sum, count }) => ({
    bucket,
    avgLoadTimeMs: Math.round(sum / count),
  }));
});

const pageLoadSeriesConfig = computed<ChartConfig>(() => ({
  avgLoadTimeMs: {
    label:
      selectedRoute.value === "all" ? t("common_all") : selectedRoute.value,
    color: CHART_COLORS[1],
  },
}));

onMounted(async () => {
  await applyFilters();
});
</script>
