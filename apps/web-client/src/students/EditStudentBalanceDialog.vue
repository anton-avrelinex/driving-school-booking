<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t("student_balance_edit_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("student_balance_edit_description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-2">
        <Label for="balance">{{ $t("student_balance_label") }}</Label>
        <Input
          id="balance"
          v-model.number="balance"
          type="number"
          min="0"
          step="0.01"
        />
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="saving" @click="open = false">
          {{ $t("common_cancel") }}
        </Button>
        <Button :disabled="saving || balance < 0" @click="onSubmit">
          {{ saving ? $t("common_saving") : $t("common_save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudentStore } from "@/students/students.store";

const props = defineProps<{
  studentId: string | null;
  initialBalance: number;
}>();
const open = defineModel<boolean>("open", { required: true });

const { t } = useI18n();
const studentStore = useStudentStore();

const balance = ref(0);
const saving = ref(false);

watch(open, (isOpen) => {
  if (isOpen) {
    balance.value = props.initialBalance;
  }
});

async function onSubmit() {
  if (!props.studentId) {
    return;
  }
  saving.value = true;
  try {
    await studentStore.setBalance(props.studentId, balance.value);
    toast.success(t("student_balance_edit_success"));
    open.value = false;
  } catch {
    toast.error(t("student_balance_edit_failed"));
  } finally {
    saving.value = false;
  }
}
</script>
