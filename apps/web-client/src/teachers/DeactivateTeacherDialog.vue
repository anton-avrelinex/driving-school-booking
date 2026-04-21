<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ $t("teacher_deactivate_title") }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{
            $t("teacher_deactivate_confirm", {
              firstName: user?.firstName,
              lastName: user?.lastName,
            })
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ $t("common_cancel") }}</AlertDialogCancel>
        <AlertDialogAction
          :class="buttonVariants({ variant: 'destructive' })"
          @click="handleDeactivate"
        >
          {{ $t("common_deactivate") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useTeacherStore } from "@/teachers/teachers.store";
import type { UserDto } from "@driving-school-booking/shared-types";
import { toast } from "vue-sonner";
import { buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{
  user: UserDto | null;
}>();

const { t } = useI18n();
const teacherStore = useTeacherStore();

async function handleDeactivate() {
  if (!props.user) {
    return;
  }

  try {
    await teacherStore.deactivateTeacher(props.user.id);
    toast.success(t("teacher_deactivated"));
  } catch {
    toast.error(t("teacher_deactivate_failed"));
  }
}
</script>
