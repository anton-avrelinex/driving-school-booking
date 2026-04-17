<template>
  <div class="space-y-6">
    <div class="flex items-end gap-4">
      <div class="flex gap-1">
        <Button
          :variant="mode === 'daily' ? 'default' : 'outline'"
          size="sm"
          @click="selectDaily()"
        >
          {{ t("health_range_daily") }}
        </Button>
        <Button
          v-for="range in ranges"
          :key="range.days"
          :variant="
            mode === 'range' && selectedDays === range.days
              ? 'default'
              : 'outline'
          "
          size="sm"
          @click="selectRange(range.days)"
        >
          {{ range.label }}
        </Button>
      </div>
      <div v-if="mode === 'daily'" class="flex flex-col gap-1.5">
        <Input
          v-model="selectedDate"
          type="date"
          class="w-40"
          @change="fetchDaily"
        />
      </div>
      <div v-if="mode === 'daily'" class="flex gap-1">
        <Button
          v-for="comp in componentNames"
          :key="comp"
          :variant="activeComponents.has(comp) ? 'default' : 'outline'"
          size="sm"
          @click="toggleComponent(comp)"
        >
          {{ comp }}
        </Button>
      </div>
    </div>

    <div v-if="store.loading" class="text-muted-foreground py-12 text-center">
      {{ t("health_loading") }}
    </div>

    <div v-else-if="store.error" class="text-destructive py-12 text-center">
      {{ store.error }}
    </div>

    <!-- Range view: bar strip cards -->
    <div v-else-if="mode === 'range'" class="space-y-4">
      <HealthCard
        v-for="component in componentNames"
        :key="component"
        :component="component"
        :days="dailyData[component] ?? []"
        :total-days="selectedDays"
      />
    </div>

    <!-- Daily view: checks table -->
    <div v-else>
      <Table v-if="filteredChecks.length > 0">
        <TableHeader>
          <TableRow>
            <TableHead>{{ t("health_check_timestamp") }}</TableHead>
            <TableHead>{{ t("health_check_component") }}</TableHead>
            <TableHead>{{ t("health_check_status") }}</TableHead>
            <TableHead>{{ t("health_check_response_time") }}</TableHead>
            <TableHead>{{ t("health_check_error") }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="(check, i) in filteredChecks" :key="i">
            <TableCell class="text-xs">
              {{ new Date(check.timestamp).toLocaleTimeString() }}
            </TableCell>
            <TableCell class="text-sm">{{ check.component }}</TableCell>
            <TableCell>
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="
                  check.status === 'healthy'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                "
              >
                {{
                  check.status === "healthy"
                    ? t("health_status_operational")
                    : t("health_status_down")
                }}
              </span>
            </TableCell>
            <TableCell class="text-sm">{{ check.responseTimeMs }}ms</TableCell>
            <TableCell class="text-xs text-muted-foreground max-w-xs truncate">
              {{ check.error ?? "—" }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <div v-else class="text-muted-foreground py-12 text-center">
        {{ t("health_check_no_results") }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  HEALTH_COMPONENTS,
  type HealthComponent,
} from "@driving-school-booking/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHealthStore } from "./health.store";
import HealthCard from "./HealthCard.vue";

const { t } = useI18n();
const store = useHealthStore();

const mode = ref<"range" | "daily">("range");

const ranges = [
  { days: 7, label: t("health_range_7d") },
  { days: 30, label: t("health_range_30d") },
  { days: 90, label: t("health_range_90d") },
];

const selectedDays = ref(30);
const selectedDate = ref(formatDateForInput(new Date()));

const componentNames = Object.values(HEALTH_COMPONENTS);
const activeComponents = ref<Set<HealthComponent>>(new Set(componentNames));

function toggleComponent(comp: HealthComponent) {
  if (activeComponents.value.has(comp)) {
    if (activeComponents.value.size > 1) {
      activeComponents.value.delete(comp);
    }
  } else {
    activeComponents.value.add(comp);
  }
  // Trigger reactivity
  activeComponents.value = new Set(activeComponents.value);
}

const filteredChecks = computed(() =>
  store.checks.filter((c) => activeComponents.value.has(c.component)),
);

function formatDateForInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface DayHealth {
  date: string;
  uptimePercent: number;
  totalDowntimeMinutes: number;
  incidentCount: number;
}

const dailyData = computed(() => {
  const result: Record<string, DayHealth[]> = {};

  for (const component of componentNames) {
    result[component] = [];
  }

  const coveredDays = new Set<string>();

  for (const agg of store.aggregates) {
    if (!agg.healthSummary) continue;
    for (const hs of agg.healthSummary) {
      if (!result[hs.component]) continue;

      const key = `${agg.date}:${hs.component}`;
      coveredDays.add(key);
      result[hs.component]!.push({
        date: agg.date,
        uptimePercent: hs.uptimePercent,
        totalDowntimeMinutes: hs.totalDowntimeMinutes,
        incidentCount: hs.incidentCount,
      });
    }
  }

  for (const daySummary of store.recentSummaries) {
    for (const hs of daySummary.summaries) {
      const key = `${daySummary.date}:${hs.component}`;
      if (coveredDays.has(key)) continue;
      if (!result[hs.component]) continue;

      result[hs.component]!.push({
        date: daySummary.date,
        uptimePercent: hs.uptimePercent,
        totalDowntimeMinutes: hs.totalDowntimeMinutes,
        incidentCount: hs.incidentCount,
      });
    }
  }

  for (const component of componentNames) {
    result[component]!.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }

  return result;
});

function buildRangeFilters() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - selectedDays.value);
  return {
    from: from.toISOString().slice(0, 10) + "T00:00:00.000Z",
    to: to.toISOString().slice(0, 10) + "T23:59:59.999Z",
  };
}

function buildDailyFilters() {
  return {
    from: selectedDate.value + "T00:00:00.000Z",
    to: selectedDate.value + "T23:59:59.999Z",
  };
}

async function selectRange(days: number) {
  mode.value = "range";
  selectedDays.value = days;
  await store.fetchAll(buildRangeFilters());
}

async function selectDaily() {
  mode.value = "daily";
  await store.fetchChecks(buildDailyFilters());
}

async function fetchDaily() {
  await store.fetchChecks(buildDailyFilters());
}

onMounted(async () => {
  await store.fetchAll(buildRangeFilters());
});
</script>
