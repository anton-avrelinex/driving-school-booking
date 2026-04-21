<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t("student_add_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("student_add_description") }}
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
          <Label>{{ $t("student_courses") }}</Label>
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
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useStudentStore } from "@/students/students.store";
import { useCourseStore } from "@/courses/courses.store";
import type {
  CreateStudentDto,
  CreateUserResponseDto,
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
const emit = defineEmits<{
  created: [result: CreateUserResponseDto];
}>();

const { t } = useI18n();
const studentStore = useStudentStore();
const courseStore = useCourseStore();
const creating = ref(false);
const selectedCourseIds = ref<string[]>([]);
const toggleCourseId = makeToggle(selectedCourseIds);

watch(open, async (isOpen) => {
  if (isOpen) {
    await courseStore.fetchCourses();
  }
});
const form = ref<Omit<CreateStudentDto, "enrollmentCourseIds">>({
  email: "",
  firstName: "",
  lastName: "",
});

async function handleCreate() {
  creating.value = true;
  try {
    const payload: CreateStudentDto = {
      ...form.value,
      enrollmentCourseIds: selectedCourseIds.value,
    };
    const result = await studentStore.createStudent(payload);

    open.value = false;
    form.value = {
      email: "",
      firstName: "",
      lastName: "",
    };
    selectedCourseIds.value = [];

    toast.success(t("student_created"));
    emit("created", result);
  } catch {
    toast.error(t("student_create_failed"));
  } finally {
    creating.value = false;
  }
}
</script>
