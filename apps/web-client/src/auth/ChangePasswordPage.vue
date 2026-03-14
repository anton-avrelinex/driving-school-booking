<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle class="text-2xl">
          {{ $t("auth_change_password_title") }}
        </CardTitle>
        <CardDescription>
          {{ $t("auth_change_password_description") }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <Label for="currentPassword">
              {{ $t("auth_current_password") }}
            </Label>
            <Input
              id="currentPassword"
              v-model="currentPassword"
              type="password"
              required
            />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="newPassword">{{ $t("auth_new_password") }}</Label>
            <Input
              id="newPassword"
              v-model="newPassword"
              type="password"
              minlength="8"
              required
            />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="confirmPassword">
              {{ $t("auth_confirm_password") }}
            </Label>
            <Input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              minlength="8"
              required
            />
          </div>
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
          <Button type="submit" class="w-full" :disabled="loading">
            {{
              loading
                ? $t("auth_changing_password")
                : $t("auth_change_password_submit")
            }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { useAuthStore } from "@/auth/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const error = ref("");
const loading = ref(false);

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
    void router.push("/");
  } catch {
    error.value = t("auth_change_password_failed");
  } finally {
    loading.value = false;
  }
}
</script>
