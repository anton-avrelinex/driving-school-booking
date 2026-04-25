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
        <div class="w-40">
          <DatePicker v-model="selectedDate" @update:model-value="fetchDaily" />
        </div>
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
              {{ $d(check.timestamp.toDate(), "timeFull") }}
            </TableCell>
            <TableCell class="text-sm">{{ check.component }}</TableCell>
            <TableCell>
              <Badge
                :variant="
                  check.status === 'healthy' ? 'success' : 'destructive'
                "
              >
                {{
                  check.status === "healthy"
                    ? t("health_status_operational")
                    : t("health_status_down")
                }}
              </Badge>
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
import { computed, onMounted, ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  HEALTH_COMPONENTS,
  type HealthComponent,
} from "@driving-school-booking/shared-types";
import {
  type CalendarDate,
  getLocalTimeZone,
  today,
} from "@internationalized/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { dateEnd, dateStart } from "@/lib/date-utils";
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
const selectedDate = ref(today(getLocalTimeZone())) as Ref<CalendarDate>;

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
    const dateStr = agg.date.toString();
    for (const hs of agg.healthSummary) {
      if (!result[hs.component]) continue;

      const key = `${dateStr}:${hs.component}`;
      coveredDays.add(key);
      result[hs.component]!.push({
        date: dateStr,
        uptimePercent: hs.uptimePercent,
        totalDowntimeMinutes: hs.totalDowntimeMinutes,
        incidentCount: hs.incidentCount,
      });
    }
  }

  for (const daySummary of store.recentSummaries) {
    const dateStr = daySummary.date.toString();
    for (const hs of daySummary.summaries) {
      const key = `${dateStr}:${hs.component}`;
      if (coveredDays.has(key)) continue;
      if (!result[hs.component]) continue;

      result[hs.component]!.push({
        date: dateStr,
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
  const to = today(getLocalTimeZone());
  const from = to.subtract({ days: selectedDays.value });
  return {
    from: dateStart(from),
    to: dateEnd(to),
  };
}

function buildDailyFilters() {
  return {
    from: dateStart(selectedDate.value),
    to: dateEnd(selectedDate.value),
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
