import { ref } from "vue";
import { defineStore } from "pinia";
import {
  type CourseDto,
  type CreateCourseDto,
  type UpdateCourseDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";

export const useCourseStore = defineStore("courses", () => {
  const courses = ref<CourseDto[]>([]);

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

  return {
    courses,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
  };
});
