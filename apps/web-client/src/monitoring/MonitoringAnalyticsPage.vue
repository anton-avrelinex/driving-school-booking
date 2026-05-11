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

    <Transition name="fade" mode="out-in">
      <div v-if="store.loading" class="flex flex-col gap-6">
        <Skeleton class="h-72 w-full" />
        <Skeleton class="h-64 w-full" />
        <Skeleton class="h-64 w-full" />
      </div>

      <div v-else-if="store.error" class="text-destructive py-12 text-center">
        {{ store.error }}
      </div>

      <div v-else class="space-y-6">
        <EventTrendsCard />
        <EventCountsCard />
        <PageViewsTable />
        <PerformanceTable />
        <RouteTrendsCard />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  GRANULARITIES,
  type Granularity,
  type TimeSeriesFilters,
} from "@driving-school-booking/shared-types";
import { onMounted, ref, type Ref } from "vue";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dateEnd, dateStart } from "@/lib/date-utils";
import { useAnalyticsStore } from "./analytics.store";
import EventTrendsCard from "./components/EventTrendsCard.vue";
import EventCountsCard from "./components/EventCountsCard.vue";
import PageViewsTable from "./components/PageViewsTable.vue";
import PerformanceTable from "./components/PerformanceTable.vue";
import RouteTrendsCard from "./components/RouteTrendsCard.vue";

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
  if (filterSchoolId.value.trim()) {
    filters.schoolId = filterSchoolId.value.trim();
  }
  if (filterUserId.value.trim()) {
    filters.userId = filterUserId.value.trim();
  }
  return filters;
}

async function applyFilters() {
  await store.fetchAll(buildFilters());
}

onMounted(async () => {
  await applyFilters();
});
</script>
