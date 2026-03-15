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
            <label
              v-for="course in userStore.courses"
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
import { useUserStore } from "@/users/users.store";
import type {
  CreateStudentDto,
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
const userStore = useUserStore();
const creating = ref(false);
const selectedCourseIds = ref<string[]>([]);

watch(open, async (isOpen) => {
  if (isOpen) {
    await userStore.fetchCourses();
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
    const result = await userStore.createStudent(payload);
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
