import { ref } from "vue";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import type {
  InstructorAvailabilityDto,
  SetInstructorAvailabilityDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";

export const useAvailabilityStore = defineStore("availability", () => {
  const { t } = useI18n();

  const slots = ref<InstructorAvailabilityDto[]>([]);
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
      slots.value = data;
    } catch {
      error.value = t("teacher_availability_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  async function setAvailability(
    userId: string,
    payload: SetInstructorAvailabilityDto,
  ) {
    saving.value = true;
    const { data } = await api.put<InstructorAvailabilityDto[]>(
      `/users/instructors/${userId}/availability`,
      payload,
    );

    slots.value = data;
    saving.value = false;

    return data;
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
