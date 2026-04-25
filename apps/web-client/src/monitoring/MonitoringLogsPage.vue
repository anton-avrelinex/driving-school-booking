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
              {{ $d(log.timestamp.toDate(), "datetime") }}
            </TableCell>
            <TableCell>
              <Badge
                :variant="log.type === LOG_TYPES.REQUEST ? 'info' : 'secondary'"
              >
                {{ log.type }}
              </Badge>
            </TableCell>
            <TableCell class="text-xs">{{ log.service }}</TableCell>
            <TableCell class="text-sm">
              {{ log.type === "request" ? log.method : "—" }}
            </TableCell>
            <TableCell class="text-xs max-w-xs truncate">
              {{ log.type === "request" ? log.path : "—" }}
            </TableCell>
            <TableCell>
              <Badge
                v-if="log.type === LOG_TYPES.REQUEST"
                :variant="statusCodeVariant(log.statusCode)"
              >
                {{ log.statusCode }}
              </Badge>
              <span v-else>—</span>
            </TableCell>
            <TableCell class="text-sm">
              {{ log.type === "request" ? log.durationMs + "ms" : "—" }}
            </TableCell>
            <TableCell>
              <Badge
                v-if="log.type === LOG_TYPES.APP"
                :variant="levelVariant(log.level)"
              >
                {{ log.level }}
              </Badge>
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
import { computed, onMounted, ref, type Ref } from "vue";
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
import { Badge, type BadgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import {
  type CalendarDate,
  getLocalTimeZone,
  today,
} from "@internationalized/date";
import { dateEnd, dateStart } from "@/lib/date-utils";
import { useLogsStore } from "./logs.store";

const { t } = useI18n();
const store = useLogsStore();

const filterFrom = ref(
  today(getLocalTimeZone()).subtract({ days: 7 }),
) as Ref<CalendarDate>;
const filterTo = ref(today(getLocalTimeZone())) as Ref<CalendarDate>;
const filterType = ref<LogType | "all">("all");
const filterService = ref<Service | "all">("all");
const filterLevel = ref<LogLevel | "all">("all");
const filterQuery = ref("");

const PAGE_SIZE = 50;

const totalPages = computed(() =>
  Math.max(1, Math.ceil(store.result.total / store.result.limit)),
);

function buildFilters(page: number): LogSearchFilters {
  const filters: LogSearchFilters = {
    from: dateStart(filterFrom.value),
    to: dateEnd(filterTo.value),
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

function statusCodeVariant(code: number): BadgeVariants["variant"] {
  if (code < 300) return "success";
  if (code < 400) return "info";
  if (code < 500) return "warning";
  return "destructive";
}

function levelVariant(level: LogLevel): BadgeVariants["variant"] {
  switch (level) {
    case LOG_LEVELS.ERROR:
      return "destructive";
    case LOG_LEVELS.WARN:
      return "warning";
    case LOG_LEVELS.INFO:
      return "success";
    default:
      return "secondary";
  }
}

onMounted(async () => {
  await applyFilters(1);
});
</script>
