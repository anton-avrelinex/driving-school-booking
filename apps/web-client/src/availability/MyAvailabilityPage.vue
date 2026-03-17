<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t("nav_my_availability") }}</h1>
    </div>

    <p v-if="availabilityStore.loading" class="text-muted-foreground">
      {{ $t("common_loading") }}
    </p>
    <p v-else-if="availabilityStore.error" class="text-destructive">
      {{ availabilityStore.error }}
    </p>

    <form v-else @submit.prevent="handleSave" class="flex flex-col gap-4">
      <AvailabilityForm v-model="formSlots" />

      <div>
        <Button type="submit" :disabled="availabilityStore.saving">
          {{
            availabilityStore.saving ? $t("common_saving") : $t("common_save")
          }}
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { InstructorAvailabilityDto } from "@driving-school-booking/shared-types";
import { toast } from "vue-sonner";
import { useAuthStore } from "@/auth/auth.store";
import { useAvailabilityStore } from "@/availability/availability.store";
import AvailabilityForm from "@/availability/AvailabilityForm.vue";
import { Button } from "@/components/ui/button";

const { t } = useI18n();
const authStore = useAuthStore();
const availabilityStore = useAvailabilityStore();
const formSlots = ref<InstructorAvailabilityDto[]>([]);

onMounted(async () => {
  const userId = authStore.user!.id;
  await availabilityStore.fetchAvailability(userId);

  formSlots.value = [...availabilityStore.slots];
});

async function handleSave() {
  const userId = authStore.user!.id;

  try {
    await availabilityStore.setAvailability(userId, {
      slots: formSlots.value,
    });
    formSlots.value = [...availabilityStore.slots];
    toast.success(t("teacher_availability_updated"));
  } catch {
    toast.error(t("teacher_availability_update_failed"));
  }
}
</script>
