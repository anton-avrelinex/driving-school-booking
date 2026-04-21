<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t("teacher_edit_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("teacher_edit_description") }}
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="handleEdit" class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Label for="edit-email">{{ $t("common_email") }}</Label>
          <Input id="edit-email" v-model="form.email" type="email" required />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="edit-first-name">{{ $t("common_first_name") }}</Label>
          <Input id="edit-first-name" v-model="form.firstName" required />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="edit-last-name">{{ $t("common_last_name") }}</Label>
          <Input id="edit-last-name" v-model="form.lastName" required />
        </div>
        <div class="flex flex-col gap-2">
          <Label>{{ $t("teacher_courses") }}</Label>
          <div class="flex flex-col gap-1">
            <div
              v-for="course in courseStore.courses"
              :key="course.id"
              class="flex items-center gap-2"
            >
              <Checkbox
                :id="`course-${course.id}`"
                :model-value="selectedCourseIds.includes(course.id)"
                @update:model-value="(v) => toggleCourseId(course.id, v)"
              />
              <Label :for="`course-${course.id}`" class="text-sm font-normal">
                {{ course.name }}
              </Label>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <Label>{{ $t("teacher_vehicles") }}</Label>
          <div class="flex flex-col gap-1">
            <div
              v-for="vehicle in vehicleStore.vehicles"
              :key="vehicle.id"
              class="flex items-center gap-2"
            >
              <Checkbox
                :id="`vehicle-${vehicle.id}`"
                :model-value="selectedVehicleIds.includes(vehicle.id)"
                @update:model-value="(v) => toggleVehicleId(vehicle.id, v)"
              />
              <Label :for="`vehicle-${vehicle.id}`" class="text-sm font-normal">
                {{ vehicle.make }} {{ vehicle.model }} ({{
                  vehicle.licensePlate
                }})
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" :disabled="updating">
            {{ updating ? $t("common_saving") : $t("common_save") }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useTeacherStore } from "@/teachers/teachers.store";
import { useCourseStore } from "@/courses/courses.store";
import { useVehicleStore } from "@/vehicles/vehicles.store";
import type {
  UserDto,
  UpdateInstructorDto,
} from "@driving-school-booking/shared-types";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { makeToggle } from "@/lib/toggle-list";

const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{
  user: UserDto | null;
}>();

const { t } = useI18n();
const teacherStore = useTeacherStore();
const courseStore = useCourseStore();
const vehicleStore = useVehicleStore();
const updating = ref(false);
const selectedCourseIds = ref<string[]>([]);
const selectedVehicleIds = ref<string[]>([]);
const toggleCourseId = makeToggle(selectedCourseIds);
const toggleVehicleId = makeToggle(selectedVehicleIds);
const form = ref<UpdateInstructorDto>({
  email: "",
  firstName: "",
  lastName: "",
});

watch(
  () => props.user,
  (user) => {
    if (user) {
      form.value = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      selectedCourseIds.value =
        user.instructorProfile?.courses.map((c) => c.id) ?? [];
      selectedVehicleIds.value =
        user.instructorProfile?.vehicles.map((v) => v.id) ?? [];
    }
  },
);

async function handleEdit() {
  if (!props.user) {
    return;
  }
  updating.value = true;

  try {
    await teacherStore.updateTeacher(props.user.id, {
      ...form.value,
      courseIds: selectedCourseIds.value,
      vehicleIds: selectedVehicleIds.value,
    });

    open.value = false;
    toast.success(t("teacher_updated"));
  } catch {
    toast.error(t("teacher_update_failed"));
  } finally {
    updating.value = false;
  }
}
</script>
