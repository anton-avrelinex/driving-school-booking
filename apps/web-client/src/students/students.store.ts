import { ref } from "vue";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import {
  ROLES,
  type UserDto,
  type CreateStudentDto,
  type UpdateStudentDto,
  type CreateUserResponseDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";

export const useStudentStore = defineStore("students", () => {
  const { t } = useI18n();

  const users = ref<UserDto[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  async function fetchUsers(role?: string) {
    loading.value = true;
    error.value = null;

    try {
      const params = role ? { role } : {};
      const { data } = await api.get<UserDto[]>("/users", { params });

      users.value = data;
    } catch {
      error.value = t("student_fetch_failed");
    } finally {
      loading.value = false;
    }
  }

  async function createStudent(
    payload: CreateStudentDto,
  ): Promise<CreateUserResponseDto> {
    const { data } = await api.post<CreateUserResponseDto>(
      "/users/students",
      payload,
    );

    await fetchUsers(ROLES.STUDENT);
    return data;
  }

  async function updateStudent(id: string, payload: UpdateStudentDto) {
    const { data } = await api.patch<UserDto>(`/users/students/${id}`, payload);

    await fetchUsers(ROLES.STUDENT);
    return data;
  }

  async function deactivateUser(id: string) {
    const { data } = await api.patch<UserDto>(`/users/${id}/deactivate`);

    await fetchUsers(ROLES.STUDENT);
    return data;
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    createStudent,
    updateStudent,
    deactivateUser,
  };
});
