import { ref, type Ref } from "vue";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import type {
  AvailableInstructorDto,
  AvailableSlotDto,
  CreateLessonDto,
  LessonDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";
import {
  type AvailableSlotModel,
  type LessonModel,
  toAvailableSlotModel,
  toLessonModel,
} from "@/lessons/lessons.models";

export const useLessonStore = defineStore("lessons", () => {
  const { t } = useI18n();

  const lessons = ref<LessonModel[]>([]) as Ref<LessonModel[]>;
  const availableInstructors = ref<AvailableInstructorDto[]>([]);
  const availableSlots = ref([]) as Ref<AvailableSlotModel[]>;
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  async function fetchLessons(filters?: {
    status?: string;
    from?: string;
    to?: string;
  }) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get<LessonDto[]>("/lessons", {
        params: filters,
      });
      lessons.value = data.map(toLessonModel);
    } catch {
      error.value = t("lesson_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  async function fetchAvailableInstructors(enrollmentId: string) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get<AvailableInstructorDto[]>(
        "/lessons/available-instructors",
        { params: { enrollmentId } },
      );
      availableInstructors.value = data;
    } catch {
      error.value = t("lesson_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  async function fetchAvailableSlots(
    enrollmentId: string,
    instructorId: string,
    date: string,
  ) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get<AvailableSlotDto[]>(
        "/lessons/available-slots",
        { params: { enrollmentId, instructorId, date } },
      );
      availableSlots.value = data.map(toAvailableSlotModel);
    } catch {
      error.value = t("lesson_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  async function bookLesson(dto: CreateLessonDto): Promise<LessonModel> {
    saving.value = true;
    try {
      const { data } = await api.post<LessonDto>("/lessons", dto);
      return toLessonModel(data);
    } finally {
      saving.value = false;
    }
  }

  async function completeLesson(lessonId: string): Promise<LessonModel> {
    const { data } = await api.patch<LessonDto>(
      `/lessons/${lessonId}/complete`,
    );
    await fetchLessons();
    return toLessonModel(data);
  }

  async function cancelLesson(lessonId: string): Promise<LessonModel> {
    const { data } = await api.patch<LessonDto>(`/lessons/${lessonId}/cancel`);
    await fetchLessons();
    return toLessonModel(data);
  }

  async function assignVehicle(
    lessonId: string,
    vehicleId: string,
  ): Promise<LessonModel> {
    const { data } = await api.patch<LessonDto>(
      `/lessons/${lessonId}/vehicle`,
      { vehicleId },
    );
    await fetchLessons();
    return toLessonModel(data);
  }

  return {
    lessons,
    availableInstructors,
    availableSlots,
    loading,
    saving,
    error,
    fetchLessons,
    fetchAvailableInstructors,
    fetchAvailableSlots,
    bookLesson,
    completeLesson,
    cancelLesson,
    assignVehicle,
  };
});
