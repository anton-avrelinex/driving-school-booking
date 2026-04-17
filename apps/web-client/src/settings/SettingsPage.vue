<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold mb-6">{{ $t("settings_title") }}</h1>

    <div v-if="settings.loading" class="text-muted-foreground">
      {{ $t("common_loading") }}
    </div>
    <div v-else-if="settings.error" class="text-destructive">
      {{ settings.error }}
    </div>
    <div v-else-if="settings.profile" class="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{{ $t("settings_profile_title") }}</CardTitle>
          <CardDescription>
            {{ $t("settings_profile_description") }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleSave" class="flex flex-col gap-4">
            <div class="flex gap-4">
              <div class="flex flex-col gap-2 flex-1">
                <Label>{{ $t("settings_role") }}</Label>
                <Input :model-value="settings.profile.role" disabled />
              </div>
              <div class="flex flex-col gap-2 flex-1">
                <Label>{{ $t("settings_status") }}</Label>
                <Input :model-value="settings.profile.status" disabled />
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex flex-col gap-2 flex-1">
                <Label for="firstName">{{ $t("common_first_name") }}</Label>
                <Input id="firstName" v-model="firstName" required />
              </div>
              <div class="flex flex-col gap-2 flex-1">
                <Label for="lastName">{{ $t("common_last_name") }}</Label>
                <Input id="lastName" v-model="lastName" required />
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <Label for="email">{{ $t("common_email") }}</Label>
              <Input id="email" v-model="email" type="email" required />
            </div>

            <div class="flex justify-end">
              <Button type="submit" :disabled="settings.saving">
                {{ settings.saving ? $t("common_saving") : $t("common_save") }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{{ $t("settings_security_title") }}</CardTitle>
          <CardDescription>
            {{ $t("settings_security_description") }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" @click="passwordDialogOpen = true">
            {{ $t("settings_change_password") }}
          </Button>
        </CardContent>
      </Card>
    </div>

    <ChangePasswordDialog v-model:open="passwordDialogOpen" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { useSettingsStore } from "@/settings/settings.store";
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
import ChangePasswordDialog from "@/settings/ChangePasswordDialog.vue";

const { t } = useI18n();
const settings = useSettingsStore();

const firstName = ref("");
const lastName = ref("");
const email = ref("");
const passwordDialogOpen = ref(false);

onMounted(async () => {
  await settings.fetchProfile();
  if (settings.profile) {
    firstName.value = settings.profile.firstName;
    lastName.value = settings.profile.lastName;
    email.value = settings.profile.email;
  }
});

async function handleSave() {
  try {
    await settings.updateProfile({
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
    });
    toast.success(t("settings_saved"));
  } catch {
    toast.error(t("settings_save_failed"));
  }
}
</script>
