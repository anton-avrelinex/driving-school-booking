<template>
  <Card class="flex flex-col">
    <CardHeader class="items-center pb-0">
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription>{{ description }}</CardDescription>
    </CardHeader>
    <CardContent class="flex-1 pb-0">
      <ChartContainer
        :config="chartConfig"
        class="mx-auto aspect-square max-h-[250px]"
        :style="{
          '--vis-donut-central-label-font-size': 'var(--text-3xl)',
          '--vis-donut-central-label-font-weight': 'var(--font-weight-bold)',
          '--vis-donut-central-label-text-color': 'var(--foreground)',
          '--vis-donut-central-sub-label-text-color': 'var(--muted-foreground)',
        }"
      >
        <VisSingleContainer :data="items" :margin="{ top: 30, bottom: 30 }">
          <VisDonut
            :value="(d: PieItem) => d.value"
            :color="(d: PieItem) => d.fill"
            :arc-width="30"
            :central-label-offset-y="10"
            :central-label="total.toLocaleString()"
            :central-sub-label="centralSubLabel"
          />
          <ChartTooltip
            :triggers="{
              [Donut.selectors.segment]: componentToString(
                chartConfig,
                ChartTooltipContent,
                { hideLabel: true },
              )!,
            }"
          />
        </VisSingleContainer>
      </ChartContainer>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { ChartConfig } from "@/components/ui/chart";

import { Donut } from "@unovis/ts";
import { VisDonut, VisSingleContainer } from "@unovis/vue";
import { computed } from "vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from "@/components/ui/chart";

export interface PieItem {
  label: string;
  value: number;
  fill: string;
  [key: string]: string | number;
}

const props = withDefaults(
  defineProps<{
    title: string;
    description: string;
    items: PieItem[];
    chartConfig: ChartConfig;
    centralSubLabel?: string;
  }>(),
  {
    centralSubLabel: undefined,
  },
);

const total = computed(() =>
  props.items.reduce((acc, curr) => acc + curr.value, 0),
);
</script>
