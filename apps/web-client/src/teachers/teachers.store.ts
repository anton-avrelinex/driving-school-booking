import { ref } from "vue";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import {
  ROLES,
  type UserDto,
  type CreateInstructorDto,
  type UpdateInstructorDto,
  type CreateUserResponseDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";

export const useTeacherStore = defineStore("teachers", () => {
  const { t } = useI18n();

  const teachers = ref<UserDto[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  async function fetchTeachers() {
    loading.value = true;
    error.value = null;

    try {
      const { data } = await api.get<UserDto[]>("/users", {
        params: { role: ROLES.INSTRUCTOR },
      });
      teachers.value = data;
    } catch {
      error.value = t("teacher_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  async function createTeacher(
    payload: CreateInstructorDto,
  ): Promise<CreateUserResponseDto> {
    const { data } = await api.post<CreateUserResponseDto>(
      "/users/instructors",
      payload,
    );
    await fetchTeachers();
    return data;
  }

  async function updateTeacher(id: string, payload: UpdateInstructorDto) {
    const { data } = await api.patch<UserDto>(
      `/users/instructors/${id}`,
      payload,
    );
    await fetchTeachers();
    return data;
  }

  async function deactivateTeacher(id: string) {
    const { data } = await api.patch<UserDto>(`/users/${id}/deactivate`);
    await fetchTeachers();
    return data;
  }

  return {
    teachers,
    loading,
    error,
    fetchTeachers,
    createTeacher,
    updateTeacher,
    deactivateTeacher,
  };
});
