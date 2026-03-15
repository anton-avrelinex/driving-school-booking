<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t("teacher_created_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("teacher_created_save_password") }}
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-2">
        <p class="text-sm text-muted-foreground">
          {{ $t("teacher_created_account", { email }) }}
        </p>
        <div class="flex items-center gap-2">
          <code class="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
            {{ password }}
          </code>
          <Button variant="outline" size="sm" @click="copyPassword">
            {{ $t("common_copy") }}
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button @click="open = false">{{ $t("common_done") }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
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

const { t } = useI18n();
const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{
  email: string;
  password: string;
}>();

async function copyPassword() {
  await navigator.clipboard.writeText(props.password);
  toast.success(t("teacher_password_copied"));
}
</script>
