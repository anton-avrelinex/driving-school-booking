<template>
  <Card class="py-4 sm:py-0">
    <CardHeader class="flex flex-col items-stretch border-b !p-0 sm:flex-row">
      <div class="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
        <CardTitle>{{ title }}</CardTitle>
        <CardDescription>{{ description }}</CardDescription>
      </div>
      <div v-if="lineKeys.length > 1" class="flex">
        <button
          :data-active="activeKey === 'all'"
          class="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
          @click="activeKey = 'all'"
        >
          <span class="text-muted-foreground text-xs">{{ $t("common_all") }}</span>
        </button>
        <button
          v-for="key in lineKeys"
          :key="key"
          :data-active="activeKey === key"
          class="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
          @click="activeKey = key"
        >
          <span class="text-muted-foreground text-xs">
            {{ chartConfig[key]?.label ?? key }}
          </span>
        </button>
      </div>
    </CardHeader>
    <CardContent class="px-2 sm:p-6">
      <ChartContainer
        :config="chartConfig"
        class="aspect-auto h-[250px] w-full"
        cursor
      >
        <VisXYContainer
          :data="data"
          :margin="{ left: 0 }"
          :y-domain="[0, undefined]"
        >
          <VisLine
            v-for="key in visibleKeys"
            :key="key"
            :x="xAccessor"
            :y="(d: Record<string, unknown>) => d[key] as number"
            :color="chartConfig[key]?.color ?? 'var(--chart-1)'"
          />
          <VisAxis
            type="x"
            :x="xAccessor"
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
            :tick-format="yTickFormat"
          />
          <ChartTooltip />
          <ChartCrosshair
            :template="
              componentToString(chartConfig, ChartTooltipContent, {
                labelFormatter(d) {
                  return new Date(d).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                },
              })
            "
            :color="visibleKeys.length === 1 && visibleKeys[0] ? chartConfig[visibleKeys[0]]?.color ?? 'var(--chart-1)' : '#0000'"
          />
        </VisXYContainer>
      </ChartContainer>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { ChartConfig } from "@/components/ui/chart";

import { VisAxis, VisLine, VisXYContainer } from "@unovis/vue";
import { computed, ref } from "vue";
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

const props = withDefaults(
  defineProps<{
    title: string;
    description: string;
    data: Record<string, unknown>[];
    chartConfig: ChartConfig;
    lineKeys: string[];
    unit?: string;
  }>(),
  {
    unit: undefined,
  },
);

const activeKey = ref(props.lineKeys.length > 1 ? "all" : props.lineKeys[0] ?? "");

const visibleKeys = computed(() =>
  activeKey.value === "all" ? props.lineKeys : [activeKey.value],
);

function xAccessor(d: Record<string, unknown>): Date {
  return new Date(d.bucket as string);
}

function formatXTick(d: number): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function yTickFormat(d: number): string {
  return props.unit ? `${d}${props.unit}` : String(d);
}
</script>
