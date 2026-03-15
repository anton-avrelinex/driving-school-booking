<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t("teacher_add_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("teacher_add_description") }}
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="handleCreate" class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Label for="create-email">{{ $t("common_email") }}</Label>
          <Input id="create-email" v-model="form.email" type="email" required />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="create-first-name">{{ $t("common_first_name") }}</Label>
          <Input id="create-first-name" v-model="form.firstName" required />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="create-last-name">{{ $t("common_last_name") }}</Label>
          <Input id="create-last-name" v-model="form.lastName" required />
        </div>
        <div class="flex flex-col gap-2">
          <Label>{{ $t("teacher_courses") }}</Label>
          <div class="flex flex-col gap-1">
            <label
              v-for="course in courseStore.courses"
              :key="course.id"
              class="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                :value="course.id"
                v-model="selectedCourseIds"
              />
              {{ course.name }}
            </label>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <Label>{{ $t("teacher_vehicles") }}</Label>
          <div class="flex flex-col gap-1">
            <label
              v-for="vehicle in vehicleStore.vehicles"
              :key="vehicle.id"
              class="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                :value="vehicle.id"
                v-model="selectedVehicleIds"
              />
              {{ vehicle.make }} {{ vehicle.model }} ({{
                vehicle.licensePlate
              }})
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" :disabled="creating">
            {{ creating ? $t("common_creating") : $t("common_create") }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTeacherStore } from "@/teachers/teachers.store";
import { useCourseStore } from "@/courses/courses.store";
import { useVehicleStore } from "@/vehicles/vehicles.store";
import type {
  CreateInstructorDto,
  CreateUserResponseDto,
} from "@driving-school-booking/shared-types";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{
  created: [result: CreateUserResponseDto];
}>();

const { t } = useI18n();
const teacherStore = useTeacherStore();
const courseStore = useCourseStore();
const vehicleStore = useVehicleStore();
const creating = ref(false);
const selectedCourseIds = ref<string[]>([]);
const selectedVehicleIds = ref<string[]>([]);
const form = ref<Omit<CreateInstructorDto, "courseIds" | "vehicleIds">>({
  email: "",
  firstName: "",
  lastName: "",
});

async function handleCreate() {
  creating.value = true;
  try {
    const payload: CreateInstructorDto = {
      ...form.value,
      courseIds: selectedCourseIds.value,
      vehicleIds: selectedVehicleIds.value,
    };
    const result = await teacherStore.createTeacher(payload);

    open.value = false;
    form.value = {
      email: "",
      firstName: "",
      lastName: "",
    };
    selectedCourseIds.value = [];
    selectedVehicleIds.value = [];

    toast.success(t("teacher_created"));
    emit("created", result);
  } catch {
    toast.error(t("teacher_create_failed"));
  } finally {
    creating.value = false;
  }
}
</script>
