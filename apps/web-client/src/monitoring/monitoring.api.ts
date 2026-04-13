import type {
  MonitoringFilters,
  TopEndpointsFilters,
  TimeSeriesFilters,
  TopEndpointDto,
  RequestsBySchoolDto,
  VolumePointDto,
  ErrorRatePointDto,
  LatencyPointDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";

export async function getTopEndpoints(
  filters: TopEndpointsFilters,
): Promise<TopEndpointDto[]> {
  const { data } = await api.get<TopEndpointDto[]>(
    "/monitoring/logs/top-endpoints",
    { params: filters },
  );
  return data;
}

export async function getBySchool(
  filters: MonitoringFilters,
): Promise<RequestsBySchoolDto[]> {
  const { data } = await api.get<RequestsBySchoolDto[]>(
    "/monitoring/logs/by-school",
    { params: filters },
  );
  return data;
}

export async function getVolume(
  filters: TimeSeriesFilters,
): Promise<VolumePointDto[]> {
  const { data } = await api.get<VolumePointDto[]>("/monitoring/logs/volume", {
    params: filters,
  });
  return data;
}

export async function getErrorRate(
  filters: TimeSeriesFilters,
): Promise<ErrorRatePointDto[]> {
  const { data } = await api.get<ErrorRatePointDto[]>(
    "/monitoring/logs/error-rate",
    { params: filters },
  );
  return data;
}

export async function getLatency(
  filters: TimeSeriesFilters,
): Promise<LatencyPointDto[]> {
  const { data } = await api.get<LatencyPointDto[]>(
    "/monitoring/logs/latency",
    { params: filters },
  );
  return data;
}
