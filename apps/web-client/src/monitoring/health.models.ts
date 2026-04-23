import type { CalendarDate, ZonedDateTime } from "@internationalized/date";
import type {
  DailyAggregateDto,
  DailyAggregateMetrics,
  DayHealthSummaryDto,
  HealthCheckDto,
  HealthComponent,
  HealthStatus,
  HealthSummaryDto,
  TopEndpointAggregate,
} from "@driving-school-booking/shared-types";
import { parseDateString, parseISOToZoned } from "@/lib/date-utils";

export interface HealthCheckModel {
  component: HealthComponent;
  timestamp: ZonedDateTime;
  status: HealthStatus;
  responseTimeMs: number;
  error?: string | null;
}

export interface DailyAggregateModel {
  date: CalendarDate;
  service: string;
  metrics: DailyAggregateMetrics;
  topEndpoints: TopEndpointAggregate[];
  analyticsEventCounts: Record<string, number>;
  healthSummary?: HealthSummaryDto[];
}

export interface DayHealthSummaryModel {
  date: CalendarDate;
  summaries: HealthSummaryDto[];
}

export function toHealthCheckModel(dto: HealthCheckDto): HealthCheckModel {
  return {
    component: dto.component,
    timestamp: parseISOToZoned(dto.timestamp),
    status: dto.status,
    responseTimeMs: dto.responseTimeMs,
    error: dto.error,
  };
}

export function toDailyAggregateModel(
  dto: DailyAggregateDto,
): DailyAggregateModel {
  return {
    date: parseDateString(dto.date),
    service: dto.service,
    metrics: dto.metrics,
    topEndpoints: dto.topEndpoints,
    analyticsEventCounts: dto.analyticsEventCounts,
    healthSummary: dto.healthSummary,
  };
}

export function toDayHealthSummaryModel(
  dto: DayHealthSummaryDto,
): DayHealthSummaryModel {
  return {
    date: parseDateString(dto.date),
    summaries: dto.summaries,
  };
}
