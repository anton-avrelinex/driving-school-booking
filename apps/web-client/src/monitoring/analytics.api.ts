import type {
  TimeSeriesFilters,
  PageViewDto,
  PerformanceDto,
  EventCountDto,
  EventCountTimeSeriesDto,
  PageViewTimeSeriesDto,
  PageLoadTimeSeriesDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";

export async function getPageViews(
  filters: TimeSeriesFilters,
): Promise<PageViewDto[]> {
  const { data } = await api.get<PageViewDto[]>(
    "/monitoring/analytics/page-views",
    { params: filters },
  );
  return data;
}

export async function getPerformance(
  filters: TimeSeriesFilters,
): Promise<PerformanceDto[]> {
  const { data } = await api.get<PerformanceDto[]>(
    "/monitoring/analytics/performance",
    { params: filters },
  );
  return data;
}

export async function getEventCounts(
  filters: TimeSeriesFilters,
): Promise<EventCountDto[]> {
  const { data } = await api.get<EventCountDto[]>(
    "/monitoring/analytics/event-counts",
    { params: filters },
  );
  return data;
}

export async function getEventCountSeries(
  filters: TimeSeriesFilters,
): Promise<EventCountTimeSeriesDto[]> {
  const { data } = await api.get<EventCountTimeSeriesDto[]>(
    "/monitoring/analytics/event-count-series",
    { params: filters },
  );
  return data;
}

export async function getPageViewSeries(
  filters: TimeSeriesFilters,
): Promise<PageViewTimeSeriesDto[]> {
  const { data } = await api.get<PageViewTimeSeriesDto[]>(
    "/monitoring/analytics/page-view-series",
    { params: filters },
  );
  return data;
}

export async function getPageLoadSeries(
  filters: TimeSeriesFilters,
): Promise<PageLoadTimeSeriesDto[]> {
  const { data } = await api.get<PageLoadTimeSeriesDto[]>(
    "/monitoring/analytics/page-load-series",
    { params: filters },
  );
  return data;
}
