<template>
  <Card class="py-4 sm:py-0">
    <CardHeader class="flex flex-col items-stretch border-b !p-0 sm:flex-row">
      <div class="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
        <CardTitle>{{ title }}</CardTitle>
        <CardDescription>{{ description }}</CardDescription>
      </div>
      <div class="flex items-center px-6 py-4 sm:border-l sm:px-8 sm:py-6">
        <div class="flex flex-col gap-1 text-left">
          <span class="text-muted-foreground text-xs">
            {{ $t("monitoring_bar_total") }}
          </span>
          <span class="text-lg leading-none font-bold sm:text-3xl">
            {{ totalCount.toLocaleString() }}
          </span>
        </div>
      </div>
    </CardHeader>
    <CardContent class="px-2 sm:p-6">
      <ChartContainer
        :config="chartConfig"
        class="aspect-auto h-62.5 w-full"
        cursor
      >
        <VisXYContainer
          :data="chartData"
          :margin="{ left: 0 }"
          :y-domain="[0, undefined]"
        >
          <VisGroupedBar
            :x="(d: ChartDataItem) => d.date"
            :y="(d: ChartDataItem) => d.count"
            color="var(--chart-1)"
            :bar-padding="0.1"
            :rounded-corners="false"
          />
          <VisAxis
            type="x"
            :x="(d: ChartDataItem) => d.date"
            :tick-line="false"
            :domain-line="false"
            :grid-line="false"
            :tick-format="formatXTick"
          />
          <VisAxis
            type="y"
            :num-ticks="3"
            :tick-line="false"
            :domain-line="false"
          />
          <ChartTooltip />
          <ChartCrosshair
            :template="
              componentToString(chartConfig, ChartTooltipContent, {
                labelFormatter(value) {
                  return d(new Date(value), 'dateShortYear');
                },
              })
            "
            color="#0000"
          />
        </VisXYContainer>
      </ChartContainer>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { ChartConfig } from "@/components/ui/chart";
import type { VolumePointModel } from "@/monitoring/monitoring.models";

import { VisAxis, VisGroupedBar, VisXYContainer } from "@unovis/vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from "@/components/ui/chart";

interface ChartDataItem {
  date: Date;
  count: number;
}

const props = defineProps<{
  title: string;
  description: string;
  data: VolumePointModel[];
}>();

const { t, d } = useI18n();

const chartConfig = computed<ChartConfig>(() => ({
  count: {
    label: t("monitoring_bar_requests"),
    color: "var(--chart-1)",
  },
}));

const chartData = computed<ChartDataItem[]>(() =>
  props.data.map((d) => ({
    date: d.bucket.toDate(),
    count: d.count,
  })),
);

const totalCount = computed(() =>
  props.data.reduce((acc, curr) => acc + curr.count, 0),
);

function formatXTick(value: number): string {
  return d(new Date(value), "dateShort");
}
</script>
