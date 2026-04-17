import type {
  TrendsFilters,
  DailyAggregateDto,
  HealthSummaryFilters,
  DayHealthSummaryDto,
  HealthCheckDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";

export async function getTrends(
  filters: TrendsFilters,
): Promise<DailyAggregateDto[]> {
  const { data } = await api.get<DailyAggregateDto[]>(
    "/monitoring/aggregates/trends",
    { params: filters },
  );
  return data;
}

export async function getHealthSummary(
  filters: HealthSummaryFilters,
): Promise<DayHealthSummaryDto[]> {
  const { data } = await api.get<DayHealthSummaryDto[]>(
    "/monitoring/health/summary",
    { params: filters },
  );
  return data;
}

export async function getHealthChecks(
  filters: HealthSummaryFilters,
): Promise<HealthCheckDto[]> {
  const { data } = await api.get<HealthCheckDto[]>(
    "/monitoring/health/checks",
    { params: filters },
  );
  return data;
}
