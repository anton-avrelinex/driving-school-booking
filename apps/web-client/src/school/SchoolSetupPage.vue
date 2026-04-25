<template>
  <div>
    <PageHeader
      :title="$t('school_setup_title')"
      :description="$t('school_setup_description')"
    />

    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <FolderTreeIcon class="size-4 text-muted-foreground" />
            {{ $t("category_manage_title") }}
          </CardTitle>
          <CardDescription>
            {{ $t("category_manage_description") }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            {{
              $t("school_setup_count_categories", {
                count: categoryStore.schoolCategories.length,
              })
            }}
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" @click="categoriesOpen = true">
            {{ $t("category_manage") }}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <BookOpenIcon class="size-4 text-muted-foreground" />
            {{ $t("course_manage_title") }}
          </CardTitle>
          <CardDescription>
            {{ $t("course_manage_description") }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            {{
              $t("school_setup_count_courses", {
                count: courseStore.courses.length,
              })
            }}
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" @click="coursesOpen = true">
            {{ $t("course_manage") }}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <CarIcon class="size-4 text-muted-foreground" />
            {{ $t("vehicle_manage_title") }}
          </CardTitle>
          <CardDescription>
            {{ $t("vehicle_manage_description") }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            {{
              $t("school_setup_count_vehicles", {
                count: vehicleStore.vehicles.length,
              })
            }}
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" @click="vehiclesOpen = true">
            {{ $t("vehicle_manage") }}
          </Button>
        </CardFooter>
      </Card>
    </div>

    <ManageCategoriesDialog v-model:open="categoriesOpen" />
    <ManageCoursesDialog v-model:open="coursesOpen" />
    <ManageVehiclesDialog v-model:open="vehiclesOpen" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { BookOpenIcon, CarIcon, FolderTreeIcon } from "lucide-vue-next";
import { useCategoryStore } from "@/categories/categories.store";
import { useCourseStore } from "@/courses/courses.store";
import { useVehicleStore } from "@/vehicles/vehicles.store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PageHeader from "@/components/PageHeader.vue";
import ManageCategoriesDialog from "@/categories/ManageCategoriesDialog.vue";
import ManageCoursesDialog from "@/courses/ManageCoursesDialog.vue";
import ManageVehiclesDialog from "@/vehicles/ManageVehiclesDialog.vue";

const categoryStore = useCategoryStore();
const courseStore = useCourseStore();
const vehicleStore = useVehicleStore();

const categoriesOpen = ref(false);
const coursesOpen = ref(false);
const vehiclesOpen = ref(false);

onMounted(async () => {
  await Promise.all([
    categoryStore.fetchSchoolCategories(),
    courseStore.fetchCourses(),
    vehicleStore.fetchVehicles(),
  ]);
});
</script>
