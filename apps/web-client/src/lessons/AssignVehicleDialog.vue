<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t("lesson_assign_vehicle_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("lesson_assign_vehicle_description") }}
        </DialogDescription>
      </DialogHeader>

      <p v-if="loading" class="text-muted-foreground">
        {{ $t("common_loading") }}
      </p>

      <div v-else>
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
      </div>

      <DialogFooter>
        <Button :disabled="!selectedVehicleId || saving" @click="handleAssign">
          {{ saving ? $t("common_saving") : $t("lesson_assign_vehicle") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { VehicleDto } from "@driving-school-booking/shared-types";
import type { LessonModel } from "@/lessons/lessons.models";
import { toast } from "vue-sonner";
import { useLessonStore } from "@/lessons/lessons.store";
import api from "@/api/api";
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
const props = defineProps<{
  lesson: LessonModel | null;
}>();
const emit = defineEmits<{ assigned: [] }>();

const { t } = useI18n();
const lessonStore = useLessonStore();

const vehicles = ref<VehicleDto[]>([]);
const selectedVehicleId = ref<string | null>(null);
const loading = ref(false);
const saving = ref(false);

watch(
  () => [open.value, props.lesson] as const,
  async ([isOpen, lesson]) => {
    if (isOpen && lesson) {
      loading.value = true;
      selectedVehicleId.value = null;
      try {
        const { data } = await api.get<VehicleDto[]>("/vehicles");
        vehicles.value = data;
      } finally {
        loading.value = false;
      }
    }
  },
);

async function handleAssign() {
  if (!props.lesson || !selectedVehicleId.value) return;

  saving.value = true;
  try {
    await lessonStore.assignVehicle(props.lesson.id, selectedVehicleId.value);
    open.value = false;
    toast.success(t("lesson_vehicle_assigned"));
    emit("assigned");
  } catch {
    toast.error(t("lesson_vehicle_assign_failed"));
  } finally {
    saving.value = false;
  }
}
</script>
