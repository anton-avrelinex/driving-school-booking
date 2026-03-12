<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Deactivate Student</DialogTitle>
        <DialogDescription>
          Are you sure you want to deactivate
          {{ user?.firstName }} {{ user?.lastName }}?
          They will no longer be able to log in.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="open = false">
          Cancel
        </Button>
        <Button variant="destructive" @click="handleDeactivate">
          Deactivate
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useUserStore } from "@/users/users.store";
import type { UserDto } from "@driving-school-booking/shared-types";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
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

async function handleDeactivate() {
  if (!props.user) {
    return;
  }

  try {
    await userStore.deactivateUser(props.user.id);
    open.value = false;
    toast.success("Student deactivated");
  } catch (e: any) {
    toast.error(e.response?.data?.message ?? "Failed to deactivate student");
  }
}
</script>
