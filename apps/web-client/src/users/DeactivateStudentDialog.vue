<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t("student_deactivate_title") }}</DialogTitle>
        <DialogDescription>
          {{
            $t("student_deactivate_confirm", {
              firstName: user?.firstName,
              lastName: user?.lastName,
            })
          }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="open = false">
          {{ $t("common_cancel") }}
        </Button>
        <Button variant="destructive" @click="handleDeactivate">
          {{ $t("common_deactivate") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
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

const { t } = useI18n();
const userStore = useUserStore();

async function handleDeactivate() {
  if (!props.user) {
    return;
  }

  try {
    await userStore.deactivateUser(props.user.id);
    open.value = false;
    toast.success(t("student_deactivated"));
  } catch {
    toast.error(t("student_deactivate_failed"));
  }
}
</script>
