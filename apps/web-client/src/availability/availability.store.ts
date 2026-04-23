import { ref, type Ref } from "vue";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import type { InstructorAvailabilityDto } from "@driving-school-booking/shared-types";
import api from "@/api/api";
import {
  type AvailabilityBlockModel,
  toAvailabilityBlockDto,
  toAvailabilityBlockModel,
} from "@/availability/availability.models";

export const useAvailabilityStore = defineStore("availability", () => {
  const { t } = useI18n();

  const slots = ref([]) as Ref<AvailabilityBlockModel[]>;
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  async function fetchAvailability(userId: string) {
    loading.value = true;
    error.value = null;

    try {
      const { data } = await api.get<InstructorAvailabilityDto[]>(
        `/users/instructors/${userId}/availability`,
      );
      slots.value = data.map(toAvailabilityBlockModel);
    } catch {
      error.value = t("teacher_availability_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  async function setAvailability(
    userId: string,
    blocks: AvailabilityBlockModel[],
  ) {
    saving.value = true;
    const { data } = await api.put<InstructorAvailabilityDto[]>(
      `/users/instructors/${userId}/availability`,
      { slots: blocks.map(toAvailabilityBlockDto) },
    );

    slots.value = data.map(toAvailabilityBlockModel);
    saving.value = false;

    return slots.value;
  }

  return {
    slots,
    loading,
    saving,
    error,
    fetchAvailability,
    setAvailability,
  };
});
