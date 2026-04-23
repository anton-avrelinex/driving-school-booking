<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ $t("teacher_availability_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("teacher_availability_description") }}
        </DialogDescription>
      </DialogHeader>

      <p v-if="availabilityStore.loading" class="text-muted-foreground">
        {{ $t("common_loading") }}
      </p>

      <form v-else @submit.prevent="handleSave" class="flex flex-col gap-4">
        <AvailabilityForm v-model="formSlots" />

        <DialogFooter>
          <Button type="submit" :disabled="availabilityStore.saving">
            {{
              availabilityStore.saving ? $t("common_saving") : $t("common_save")
            }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import type { UserDto } from "@driving-school-booking/shared-types";
import { toast } from "vue-sonner";
import { useAvailabilityStore } from "@/availability/availability.store";
import type { AvailabilityBlockModel } from "@/availability/availability.models";
import AvailabilityForm from "@/availability/AvailabilityForm.vue";
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
const availabilityStore = useAvailabilityStore();
const formSlots = ref([]) as Ref<AvailabilityBlockModel[]>;

watch(
  () => [open.value, props.user] as const,
  async ([isOpen, user]) => {
    if (isOpen && user) {
      await availabilityStore.fetchAvailability(user.id);

      formSlots.value = [...availabilityStore.slots];
    }
  },
);

async function handleSave() {
  if (!props.user) return;

  try {
    await availabilityStore.setAvailability(props.user.id, formSlots.value);

    open.value = false;
    toast.success(t("teacher_availability_updated"));
  } catch {
    toast.error(t("teacher_availability_update_failed"));
  }
}
</script>
