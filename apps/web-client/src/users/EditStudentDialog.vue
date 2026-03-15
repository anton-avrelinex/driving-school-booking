<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t("student_edit_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("student_edit_description") }}
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
import { useUserStore } from "@/users/users.store";
import type {
  UserDto,
  UpdateStudentDto,
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
const props = defineProps<{
  user: UserDto | null;
}>();

const { t } = useI18n();
const userStore = useUserStore();
const updating = ref(false);
const form = ref<UpdateStudentDto>({
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
    }
  },
);

async function handleEdit() {
  if (!props.user) {
    return;
  }
  updating.value = true;

  try {
    await userStore.updateStudent(props.user.id, form.value);
    open.value = false;
    toast.success(t("student_updated"));
  } catch {
    toast.error(t("student_update_failed"));
  } finally {
    updating.value = false;
  }
}
</script>
