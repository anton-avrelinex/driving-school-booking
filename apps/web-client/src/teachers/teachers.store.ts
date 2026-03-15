import { ref } from "vue";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import {
  ROLES,
  type UserDto,
  type CreateInstructorDto,
  type UpdateInstructorDto,
  type CreateUserResponseDto,
  type CategoryDto,
  type UpdateSchoolCategoriesDto,
  type CourseDto,
  type CreateCourseDto,
  type UpdateCourseDto,
  type VehicleDto,
  type CreateVehicleDto,
  type UpdateVehicleDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";

export const useTeacherStore = defineStore("teachers", () => {
  const { t } = useI18n();

  const teachers = ref<UserDto[]>([]);
  const allCategories = ref<CategoryDto[]>([]);
  const schoolCategories = ref<CategoryDto[]>([]);
  const courses = ref<CourseDto[]>([]);
  const vehicles = ref<VehicleDto[]>([]);
  const loading = ref(false);
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

  async function fetchAllCategories() {
    const { data } = await api.get<CategoryDto[]>("/categories");
    allCategories.value = data;
  }

  async function fetchSchoolCategories() {
    const { data } = await api.get<CategoryDto[]>("/categories/school");
    schoolCategories.value = data;
  }

  async function updateSchoolCategories(categoryIds: string[]) {
    const payload: UpdateSchoolCategoriesDto = { categoryIds };
    await api.put("/categories/school", payload);
    await fetchSchoolCategories();
  }

  async function fetchCourses() {
    const { data } = await api.get<CourseDto[]>("/courses");
    courses.value = data;
  }

  async function createCourse(payload: CreateCourseDto) {
    const { data } = await api.post<CourseDto>("/courses", payload);
    await fetchCourses();
    return data;
  }

  async function updateCourse(id: string, payload: UpdateCourseDto) {
    const { data } = await api.patch<CourseDto>(`/courses/${id}`, payload);
    await fetchCourses();
    return data;
  }

  async function deleteCourse(id: string) {
    await api.delete(`/courses/${id}`);
    await fetchCourses();
  }

  async function fetchVehicles() {
    const { data } = await api.get<VehicleDto[]>("/vehicles");
    vehicles.value = data;
  }

  async function createVehicle(payload: CreateVehicleDto) {
    const { data } = await api.post<VehicleDto>("/vehicles", payload);
    await fetchVehicles();
    return data;
  }

  async function updateVehicle(id: string, payload: UpdateVehicleDto) {
    const { data } = await api.patch<VehicleDto>(`/vehicles/${id}`, payload);
    await fetchVehicles();
    return data;
  }

  async function deleteVehicle(id: string) {
    await api.delete(`/vehicles/${id}`);
    await fetchVehicles();
  }

  return {
    teachers,
    allCategories,
    schoolCategories,
    courses,
    vehicles,
    loading,
    error,
    fetchTeachers,
    createTeacher,
    updateTeacher,
    deactivateTeacher,
    fetchAllCategories,
    fetchSchoolCategories,
    updateSchoolCategories,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
  };
});
