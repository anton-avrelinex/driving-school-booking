<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ $t("settings_change_password_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("settings_change_password_description") }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Label for="cp-current">{{ $t("auth_current_password") }}</Label>
          <Input
            id="cp-current"
            v-model="currentPassword"
            type="password"
            required
          />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="cp-new">{{ $t("auth_new_password") }}</Label>
          <Input
            id="cp-new"
            v-model="newPassword"
            type="password"
            minlength="8"
            required
          />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="cp-confirm">{{ $t("auth_confirm_password") }}</Label>
          <Input
            id="cp-confirm"
            v-model="confirmPassword"
            type="password"
            minlength="8"
            required
          />
        </div>

        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

        <DialogFooter>
          <Button type="submit" :disabled="loading">
            {{
              loading
                ? $t("auth_changing_password")
                : $t("auth_change_password_submit")
            }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { useAuthStore } from "@/auth/auth.store";
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

const { t } = useI18n();
const auth = useAuthStore();

const open = defineModel<boolean>("open", { required: true });

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const error = ref("");
const loading = ref(false);

watch(open, (isOpen) => {
  if (isOpen) {
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    error.value = "";
  }
});

async function handleSubmit() {
  error.value = "";

  if (newPassword.value !== confirmPassword.value) {
    error.value = t("auth_passwords_dont_match");
    return;
  }

  loading.value = true;

  try {
    await auth.changePassword(currentPassword.value, newPassword.value);
    toast.success(t("auth_password_changed"));
    open.value = false;
  } catch {
    error.value = t("auth_change_password_failed");
  } finally {
    loading.value = false;
  }
}
</script>
