<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t("lesson_confirm_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("lesson_confirm_choose_vehicle") }}
        </DialogDescription>
      </DialogHeader>

      <Select v-model="selectedVehicleId">
        <SelectTrigger class="w-full">
          <SelectValue :placeholder="$t('lesson_select_vehicle')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="vehicle in vehicles"
            :key="vehicle.id"
            :value="vehicle.id"
          >
            {{ vehicle.make }} {{ vehicle.model }} ({{ vehicle.licensePlate }})
          </SelectItem>
        </SelectContent>
      </Select>

      <DialogFooter>
        <Button variant="outline" :disabled="saving" @click="open = false">
          {{ $t("common_cancel") }}
        </Button>
        <Button :disabled="!selectedVehicleId || saving" @click="onSubmit">
          {{ saving ? $t("common_saving") : $t("lesson_confirm") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { VehicleDto } from "@driving-school-booking/shared-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const open = defineModel<boolean>("open", { required: true });
defineProps<{
  vehicles: VehicleDto[];
  saving: boolean;
}>();
const emit = defineEmits<{ confirm: [vehicleId: string] }>();

const selectedVehicleId = ref<string | null>(null);

watch(open, (isOpen) => {
  if (isOpen) {
    selectedVehicleId.value = null;
  }
});

function onSubmit() {
  if (selectedVehicleId.value) {
    emit("confirm", selectedVehicleId.value);
  }
}
</script>
