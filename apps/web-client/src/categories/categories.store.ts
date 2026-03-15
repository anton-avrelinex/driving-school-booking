import { ref } from "vue";
import { defineStore } from "pinia";
import {
  type CategoryDto,
  type UpdateSchoolCategoriesDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";

export const useCategoryStore = defineStore("categories", () => {
  const allCategories = ref<CategoryDto[]>([]);
  const schoolCategories = ref<CategoryDto[]>([]);

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

  return {
    allCategories,
    schoolCategories,
    fetchAllCategories,
    fetchSchoolCategories,
    updateSchoolCategories,
  };
});
