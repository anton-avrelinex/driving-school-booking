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
import { useUserStore } from "@/users/users.store";
import {
  ROLES,
  type CreateUserDto,
  type CreateUserResponseDto,
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
const form = ref<CreateUserDto>({
  email: "",
  firstName: "",
  lastName: "",
  role: ROLES.STUDENT,
});

async function handleCreate() {
  creating.value = true;
  try {
    const result = await userStore.createUser(form.value);
    open.value = false;
    form.value = {
      email: "",
      firstName: "",
      lastName: "",
      role: ROLES.STUDENT,
    };
    toast.success(t("student_created"));
    emit("created", result);
  } catch {
    toast.error(t("student_create_failed"));
  } finally {
    creating.value = false;
  }
}
</script>
