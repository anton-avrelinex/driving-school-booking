<template>
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
