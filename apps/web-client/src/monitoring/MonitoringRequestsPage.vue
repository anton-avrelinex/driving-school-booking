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

    <Transition name="fade" mode="out-in">
      <div v-if="store.loading" class="grid gap-6 lg:grid-cols-2">
        <Skeleton class="h-72 w-full" />
        <Skeleton class="h-72 w-full" />
        <Skeleton class="h-64 w-full lg:col-span-2" />
        <Skeleton class="h-64 w-full" />
        <Skeleton class="h-64 w-full" />
      </div>

      <div v-else-if="store.error" class="text-destructive py-12 text-center">
        {{ store.error }}
      </div>

      <div v-else class="grid gap-6 lg:grid-cols-2">
        <TopEndpointsPieCard />
        <BySchoolPieCard />
        <div class="lg:col-span-2">
          <VolumeBarCard />
        </div>
        <ErrorRateLineCard />
        <LatencyLineCard />
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { dateEnd, dateStart } from "@/lib/date-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMonitoringStore } from "./monitoring.store";
import TopEndpointsPieCard from "./components/TopEndpointsPieCard.vue";
import BySchoolPieCard from "./components/BySchoolPieCard.vue";
import VolumeBarCard from "./components/VolumeBarCard.vue";
import ErrorRateLineCard from "./components/ErrorRateLineCard.vue";
import LatencyLineCard from "./components/LatencyLineCard.vue";

const { t } = useI18n();
const store = useMonitoringStore();

const filterFrom = ref(
  today(getLocalTimeZone()).subtract({ days: 7 }),
) as Ref<CalendarDate>;
const filterTo = ref(today(getLocalTimeZone())) as Ref<CalendarDate>;
const granularity = ref<Granularity>(GRANULARITIES.DAY);

function buildFilters(): TimeSeriesFilters {
  return {
    from: dateStart(filterFrom.value),
    to: dateEnd(filterTo.value),
    granularity: granularity.value,
  };
}

async function applyFilters() {
  await store.fetchAll(buildFilters());
}

onMounted(async () => {
  await applyFilters();
});
</script>
