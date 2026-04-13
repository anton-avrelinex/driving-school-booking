import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { defineStore } from "pinia";
import type {
  TimeSeriesFilters,
  TopEndpointDto,
  RequestsBySchoolDto,
  VolumePointDto,
  ErrorRatePointDto,
  LatencyPointDto,
} from "@driving-school-booking/shared-types";
import {
  getTopEndpoints,
  getBySchool,
  getVolume,
  getErrorRate,
  getLatency,
} from "./monitoring.api";

export const useMonitoringStore = defineStore("monitoring", () => {
  const { t } = useI18n();
  const topEndpoints = ref<TopEndpointDto[]>([]);
  const bySchool = ref<RequestsBySchoolDto[]>([]);
  const volume = ref<VolumePointDto[]>([]);
  const errorRate = ref<ErrorRatePointDto[]>([]);
  const latency = ref<LatencyPointDto[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll(filters: TimeSeriesFilters) {
    loading.value = true;
    error.value = null;
    try {
      const [
        topEndpointsData,
        bySchoolData,
        volumeData,
        errorRateData,
        latencyData,
      ] = await Promise.all([
        getTopEndpoints(filters),
        getBySchool(filters),
        getVolume(filters),
        getErrorRate(filters),
        getLatency(filters),
      ]);
      topEndpoints.value = topEndpointsData;
      bySchool.value = bySchoolData;
      volume.value = volumeData;
      errorRate.value = errorRateData;
      latency.value = latencyData;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : t("monitoring_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  return {
    topEndpoints,
    bySchool,
    volume,
    errorRate,
    latency,
    loading,
    error,
    fetchAll,
  };
});
