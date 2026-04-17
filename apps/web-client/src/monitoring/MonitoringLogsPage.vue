<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end gap-4">
      <div class="flex flex-col gap-1.5">
        <Label>{{ t("monitoring_filter_from") }}</Label>
        <Input v-model="filterFrom" type="date" class="w-40" />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label>{{ t("monitoring_filter_to") }}</Label>
        <Input v-model="filterTo" type="date" class="w-40" />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label>{{ t("logs_filter_type") }}</Label>
        <Select v-model="filterType">
          <SelectTrigger class="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t("common_all") }}</SelectItem>
            <SelectItem :value="LOG_TYPES.REQUEST">
              {{ t("logs_type_request") }}
            </SelectItem>
            <SelectItem :value="LOG_TYPES.APP">
              {{ t("logs_type_app") }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex flex-col gap-1.5">
        <Label>{{ t("logs_filter_service") }}</Label>
        <Select v-model="filterService">
          <SelectTrigger class="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t("common_all") }}</SelectItem>
            <SelectItem :value="SERVICES.MAIN">main-service</SelectItem>
            <SelectItem :value="SERVICES.OBS">observability-service</SelectItem>
            <SelectItem :value="SERVICES.WEB">web-client</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex flex-col gap-1.5">
        <Label>{{ t("logs_filter_level") }}</Label>
        <Select v-model="filterLevel">
          <SelectTrigger class="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t("common_all") }}</SelectItem>
            <SelectItem :value="LOG_LEVELS.DEBUG">
              {{ t("logs_level_debug") }}
            </SelectItem>
            <SelectItem :value="LOG_LEVELS.INFO">
              {{ t("logs_level_info") }}
            </SelectItem>
            <SelectItem :value="LOG_LEVELS.WARN">
              {{ t("logs_level_warn") }}
            </SelectItem>
            <SelectItem :value="LOG_LEVELS.ERROR">
              {{ t("logs_level_error") }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex flex-col gap-1.5">
        <Label>{{ t("logs_filter_query") }}</Label>
        <Input
          v-model="filterQuery"
          type="text"
          class="w-48"
          :placeholder="t('logs_filter_query')"
        />
      </div>
      <Button @click="applyFilters(1)">{{ t("monitoring_apply") }}</Button>
    </div>

    <div v-if="store.loading" class="text-muted-foreground py-12 text-center">
      {{ t("logs_loading") }}
    </div>

    <div v-else-if="store.error" class="text-destructive py-12 text-center">
      {{ store.error }}
    </div>

    <div
      v-else-if="store.result.items.length === 0"
      class="text-muted-foreground py-12 text-center"
    >
      {{ t("logs_no_results") }}
    </div>

    <div v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ t("logs_col_timestamp") }}</TableHead>
            <TableHead>{{ t("logs_col_type") }}</TableHead>
            <TableHead>{{ t("logs_col_service") }}</TableHead>
            <TableHead>{{ t("logs_col_method") }}</TableHead>
            <TableHead>{{ t("logs_col_path") }}</TableHead>
            <TableHead>{{ t("logs_col_status") }}</TableHead>
            <TableHead>{{ t("logs_col_duration") }}</TableHead>
            <TableHead>{{ t("logs_col_level") }}</TableHead>
            <TableHead>{{ t("logs_col_message") }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="(log, i) in store.result.items" :key="i">
            <TableCell class="text-xs whitespace-nowrap">
              {{ new Date(log.timestamp).toLocaleString() }}
            </TableCell>
            <TableCell>
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="
                  log.type === 'request'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                "
              >
                {{ log.type }}
              </span>
            </TableCell>
            <TableCell class="text-xs">{{ log.service }}</TableCell>
            <TableCell class="text-sm">
              {{ log.type === "request" ? log.method : "—" }}
            </TableCell>
            <TableCell class="text-xs max-w-xs truncate">
              {{ log.type === "request" ? log.path : "—" }}
            </TableCell>
            <TableCell>
              <span
                v-if="log.type === 'request'"
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="statusCodeClass(log.statusCode)"
              >
                {{ log.statusCode }}
              </span>
              <span v-else>—</span>
            </TableCell>
            <TableCell class="text-sm">
              {{ log.type === "request" ? log.durationMs + "ms" : "—" }}
            </TableCell>
            <TableCell>
              <span
                v-if="log.type === 'app'"
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="levelClass(log.level)"
              >
                {{ log.level }}
              </span>
              <span v-else>—</span>
            </TableCell>
            <TableCell class="text-xs max-w-sm truncate">
              {{ log.type === "app" ? log.message : "—" }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div class="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          size="sm"
          :disabled="store.result.page <= 1"
          @click="applyFilters(store.result.page - 1)"
        >
          {{ t("logs_page_prev") }}
        </Button>
        <span class="text-sm text-muted-foreground">
          {{
            t("logs_page_info", { page: store.result.page, total: totalPages })
          }}
        </span>
        <Button
          variant="outline"
          size="sm"
          :disabled="store.result.page >= totalPages"
          @click="applyFilters(store.result.page + 1)"
        >
          {{ t("logs_page_next") }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  LOG_TYPES,
  LOG_LEVELS,
  SERVICES,
  type LogType,
  type LogLevel,
  type Service,
  type LogSearchFilters,
} from "@driving-school-booking/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLogsStore } from "./logs.store";

const { t } = useI18n();
const store = useLogsStore();

const now = new Date();
const sevenDaysAgo = new Date(now);
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const filterFrom = ref(formatDate(sevenDaysAgo));
const filterTo = ref(formatDate(now));
const filterType = ref<LogType | "all">("all");
const filterService = ref<Service | "all">("all");
const filterLevel = ref<LogLevel | "all">("all");
const filterQuery = ref("");

const PAGE_SIZE = 50;

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const totalPages = computed(() =>
  Math.max(1, Math.ceil(store.result.total / store.result.limit)),
);

function buildFilters(page: number): LogSearchFilters {
  const filters: LogSearchFilters = {
    from: filterFrom.value + "T00:00:00.000Z",
    to: filterTo.value + "T23:59:59.999Z",
    page,
    limit: PAGE_SIZE,
  };
  if (filterType.value !== "all") {
    filters.type = filterType.value;
  }
  if (filterService.value !== "all") {
    filters.service = filterService.value;
  }
  if (filterLevel.value !== "all") {
    filters.level = filterLevel.value;
  }
  if (filterQuery.value.trim()) {
    filters.query = filterQuery.value.trim();
  }

  return filters;
}

async function applyFilters(page: number) {
  await store.fetch(buildFilters(page));
}

function statusCodeClass(code: number): string {
  if (code < 300)
    return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
  if (code < 400)
    return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
  if (code < 500)
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";

  return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
}

function levelClass(level: string): string {
  switch (level) {
    case LOG_LEVELS.ERROR:
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    case LOG_LEVELS.WARN:
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    case LOG_LEVELS.INFO:
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

onMounted(async () => {
  await applyFilters(1);
});
</script>
