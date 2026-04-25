import { ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { defineStore } from "pinia";
import type {
  RequestsBySchoolDto,
  TimeSeriesFilters,
  TopEndpointDto,
} from "@driving-school-booking/shared-types";
import {
  getTopEndpoints,
  getBySchool,
  getVolume,
  getErrorRate,
  getLatency,
} from "./monitoring.api";
import {
  type ErrorRatePointModel,
  type LatencyPointModel,
  type VolumePointModel,
  toErrorRatePointModel,
  toLatencyPointModel,
  toVolumePointModel,
} from "./monitoring.models";

export const useMonitoringStore = defineStore("monitoring", () => {
  const { t } = useI18n();
  const topEndpoints = ref<TopEndpointDto[]>([]);
  const bySchool = ref<RequestsBySchoolDto[]>([]);
  const volume = ref([]) as Ref<VolumePointModel[]>;
  const errorRate = ref([]) as Ref<ErrorRatePointModel[]>;
  const latency = ref([]) as Ref<LatencyPointModel[]>;
  const loading = ref(true);
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
      volume.value = volumeData.map(toVolumePointModel);
      errorRate.value = errorRateData.map(toErrorRatePointModel);
      latency.value = latencyData.map(toLatencyPointModel);
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
