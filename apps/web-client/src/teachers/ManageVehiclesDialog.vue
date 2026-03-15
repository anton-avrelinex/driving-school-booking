<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{{ $t("vehicle_manage_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("vehicle_manage_description") }}
        </DialogDescription>
      </DialogHeader>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ $t("vehicle_make") }}</TableHead>
            <TableHead>{{ $t("vehicle_model") }}</TableHead>
            <TableHead>{{ $t("vehicle_license_plate") }}</TableHead>
            <TableHead>{{ $t("vehicle_transmission") }}</TableHead>
            <TableHead>{{ $t("vehicle_category") }}</TableHead>
            <TableHead>{{ $t("common_actions") }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="vehicle in store.vehicles" :key="vehicle.id">
            <template v-if="editingId === vehicle.id">
              <TableCell>
                <Input v-model="editForm.make" required />
              </TableCell>
              <TableCell>
                <Input v-model="editForm.model" required />
              </TableCell>
              <TableCell>
                <Input v-model="editForm.licensePlate" required />
              </TableCell>
              <TableCell>
                <select
                  v-model="editForm.transmission"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="AUTOMATIC">
                    {{ $t("vehicle_transmission_automatic") }}
                  </option>
                  <option value="MANUAL">
                    {{ $t("vehicle_transmission_manual") }}
                  </option>
                </select>
              </TableCell>
              <TableCell>
                <select
                  v-model="editForm.categoryId"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  required
                >
                  <option
                    v-for="category in store.schoolCategories"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name }}
                  </option>
                </select>
              </TableCell>
              <TableCell class="flex gap-2">
                <Button size="sm" @click="handleUpdate(vehicle.id)">
                  {{ $t("common_save") }}
                </Button>
                <Button size="sm" variant="outline" @click="cancelEdit">
                  {{ $t("common_cancel") }}
                </Button>
              </TableCell>
            </template>
            <template v-else>
              <TableCell>{{ vehicle.make }}</TableCell>
              <TableCell>{{ vehicle.model }}</TableCell>
              <TableCell>{{ vehicle.licensePlate }}</TableCell>
              <TableCell>
                {{
                  vehicle.transmission === TRANSMISSIONS.AUTOMATIC
                    ? $t("vehicle_transmission_automatic")
                    : $t("vehicle_transmission_manual")
                }}
              </TableCell>
              <TableCell>{{ getCategoryName(vehicle.categoryId) }}</TableCell>
              <TableCell class="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  @click="startEdit(vehicle)"
                >
                  {{ $t("common_edit") }}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  @click="handleDelete(vehicle)"
                >
                  {{ $t("common_delete") }}
                </Button>
              </TableCell>
            </template>
          </TableRow>
        </TableBody>
      </Table>

      <form
        @submit.prevent="handleCreate"
        class="flex items-end gap-3 pt-4 border-t"
      >
        <div class="flex flex-col gap-1">
          <Label for="new-make">{{ $t("vehicle_make") }}</Label>
          <Input id="new-make" v-model="newForm.make" required />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="new-model">{{ $t("vehicle_model") }}</Label>
          <Input id="new-model" v-model="newForm.model" required />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="new-license-plate">
            {{ $t("vehicle_license_plate") }}
          </Label>
          <Input
            id="new-license-plate"
            v-model="newForm.licensePlate"
            required
          />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="new-transmission">
            {{ $t("vehicle_transmission") }}
          </Label>
          <select
            id="new-transmission"
            v-model="newForm.transmission"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="AUTOMATIC">
              {{ $t("vehicle_transmission_automatic") }}
            </option>
            <option value="MANUAL">
              {{ $t("vehicle_transmission_manual") }}
            </option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <Label for="new-category">
            {{ $t("vehicle_category") }}
          </Label>
          <select
            id="new-category"
            v-model="newForm.categoryId"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            required
          >
            <option
              v-for="category in store.schoolCategories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>
        <Button type="submit">
          {{ $t("vehicle_add") }}
        </Button>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { useTeacherStore } from "@/teachers/teachers.store";
import {
  TRANSMISSIONS,
  type VehicleDto,
  type Transmission,
} from "@driving-school-booking/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const open = defineModel<boolean>("open", { required: true });

const { t } = useI18n();
const store = useTeacherStore();

const editingId = ref<string | null>(null);
const editForm = reactive({
  make: "",
  model: "",
  licensePlate: "",
  transmission: TRANSMISSIONS.AUTOMATIC as Transmission,
  categoryId: "",
});
const newForm = reactive({
  make: "",
  model: "",
  licensePlate: "",
  transmission: TRANSMISSIONS.AUTOMATIC as Transmission,
  categoryId: "",
});

watch(open, async (isOpen) => {
  if (isOpen) {
    await Promise.all([store.fetchVehicles(), store.fetchSchoolCategories()]);
    cancelEdit();
  }
});

function getCategoryName(categoryId: string): string {
  const category = store.schoolCategories.find((c) => c.id === categoryId);
  return category?.name ?? "";
}

function startEdit(vehicle: VehicleDto) {
  editingId.value = vehicle.id;
  editForm.make = vehicle.make;
  editForm.model = vehicle.model;
  editForm.licensePlate = vehicle.licensePlate;
  editForm.transmission = vehicle.transmission;
  editForm.categoryId = vehicle.categoryId;
}

function cancelEdit() {
  editingId.value = null;
  editForm.make = "";
  editForm.model = "";
  editForm.licensePlate = "";
  editForm.transmission = TRANSMISSIONS.AUTOMATIC;
  editForm.categoryId = "";
}

async function handleUpdate(id: string) {
  try {
    await store.updateVehicle(id, {
      make: editForm.make,
      model: editForm.model,
      licensePlate: editForm.licensePlate,
      transmission: editForm.transmission,
      categoryId: editForm.categoryId,
    });
    cancelEdit();
    toast.success(t("vehicle_updated"));
  } catch {
    toast.error(t("vehicle_update_failed"));
  }
}

async function handleDelete(vehicle: VehicleDto) {
  if (
    !globalThis.confirm(
      t("vehicle_delete_confirm", {
        make: vehicle.make,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
      }),
    )
  ) {
    return;
  }

  try {
    await store.deleteVehicle(vehicle.id);
    toast.success(t("vehicle_deleted"));
  } catch {
    toast.error(t("vehicle_delete_failed"));
  }
}

async function handleCreate() {
  try {
    await store.createVehicle({
      make: newForm.make,
      model: newForm.model,
      licensePlate: newForm.licensePlate,
      transmission: newForm.transmission,
      categoryId: newForm.categoryId,
    });
    newForm.make = "";
    newForm.model = "";
    newForm.licensePlate = "";
    newForm.transmission = TRANSMISSIONS.AUTOMATIC;
    newForm.categoryId = "";
    toast.success(t("vehicle_created"));
  } catch {
    toast.error(t("vehicle_create_failed"));
  }
}
</script>
