<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Student</DialogTitle>
        <DialogDescription>Update student information.</DialogDescription>
      </DialogHeader>
      <form @submit.prevent="handleEdit" class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Label for="edit-email">Email</Label>
          <Input
            id="edit-email"
            v-model="form.email"
            type="email"
            required
          />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="edit-first-name">First Name</Label>
          <Input id="edit-first-name" v-model="form.firstName" required />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="edit-last-name">Last Name</Label>
          <Input id="edit-last-name" v-model="form.lastName" required />
        </div>
        <DialogFooter>
          <Button type="submit" :disabled="updating">
            {{ updating ? "Saving..." : "Save" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useUserStore } from "@/users/users.store";
import type { UserDto, UpdateUserDto } from "@driving-school-booking/shared-types";
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

const userStore = useUserStore();
const updating = ref(false);
const form = ref<UpdateUserDto>({
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
    await userStore.updateUser(props.user.id, form.value);
    open.value = false;
    toast.success("Student updated successfully");
  } catch (e: any) {
    toast.error(e.response?.data?.message ?? "Failed to update student");
  } finally {
    updating.value = false;
  }
}
</script>
