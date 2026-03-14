import { ref } from "vue";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import {
  ROLES,
  type UserDto,
  type CreateUserDto,
  type UpdateUserDto,
  type CreateUserResponseDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";

export const useUserStore = defineStore("users", () => {
  const { t } = useI18n();

  const users = ref<UserDto[]>([]);
  const loading = ref(false);
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

  async function createUser(
    payload: CreateUserDto,
  ): Promise<CreateUserResponseDto> {
    const { data } = await api.post<CreateUserResponseDto>("/users", payload);

    await fetchUsers(ROLES.STUDENT);
    return data;
  }

  async function updateUser(id: string, payload: UpdateUserDto) {
    const { data } = await api.patch<UserDto>(`/users/${id}`, payload);

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
    createUser,
    updateUser,
    deactivateUser,
  };
});
