<template>
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
      <EmptyState v-else :title="t('common_no_results')" />
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EmptyState from "@/components/EmptyState.vue";
import { useAnalyticsStore } from "@/monitoring/analytics.store";

const { t } = useI18n();
const store = useAnalyticsStore();
</script>
