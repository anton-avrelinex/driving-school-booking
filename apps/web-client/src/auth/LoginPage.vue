<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle class="text-2xl">{{ $t("auth_login") }}</CardTitle>
        <CardDescription>
          {{ $t("auth_login_description") }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <Label for="email">{{ $t("common_email") }}</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="admin@demo.com"
              required
            />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="password">{{ $t("auth_password") }}</Label>
            <Input id="password" v-model="password" type="password" required />
          </div>
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? $t("auth_logging_in") : $t("auth_login") }}
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

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleSubmit() {
  error.value = "";
  loading.value = true;

  try {
    await auth.login(email.value, password.value);

    if (auth.mustChangePassword) {
      void router.push("/change-password");
    } else {
      void router.push("/");
    }
  } catch {
    error.value = t("auth_login_failed");
  } finally {
    loading.value = false;
  }
}
</script>
