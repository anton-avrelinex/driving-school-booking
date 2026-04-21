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
          <TableRow v-for="vehicle in vehicleStore.vehicles" :key="vehicle.id">
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
                <Select v-model="editForm.transmission">
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="TRANSMISSIONS.AUTOMATIC">
                      {{ $t("vehicle_transmission_automatic") }}
                    </SelectItem>
                    <SelectItem :value="TRANSMISSIONS.MANUAL">
                      {{ $t("vehicle_transmission_manual") }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select v-model="editForm.categoryId">
                  <SelectTrigger class="w-full">
                    <SelectValue :placeholder="$t('vehicle_category')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="category in categoryStore.schoolCategories"
                      :key="category.id"
                      :value="category.id"
                    >
                      {{ category.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                <Button size="sm" variant="outline" @click="startEdit(vehicle)">
                  {{ $t("common_edit") }}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger as-child>
                    <Button size="sm" variant="destructive">
                      {{ $t("common_delete") }}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {{ $t("common_confirm_delete") }}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {{
                          $t("vehicle_delete_confirm", {
                            make: vehicle.make,
                            model: vehicle.model,
                            licensePlate: vehicle.licensePlate,
                          })
                        }}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {{ $t("common_cancel") }}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        :class="buttonVariants({ variant: 'destructive' })"
                        @click="handleDelete(vehicle)"
                      >
                        {{ $t("common_delete") }}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
          <Select v-model="newForm.transmission">
            <SelectTrigger id="new-transmission" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="TRANSMISSIONS.AUTOMATIC">
                {{ $t("vehicle_transmission_automatic") }}
              </SelectItem>
              <SelectItem :value="TRANSMISSIONS.MANUAL">
                {{ $t("vehicle_transmission_manual") }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex flex-col gap-1">
          <Label for="new-category">
            {{ $t("vehicle_category") }}
          </Label>
          <Select v-model="newForm.categoryId">
            <SelectTrigger id="new-category" class="w-full">
              <SelectValue :placeholder="$t('vehicle_category')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="category in categoryStore.schoolCategories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" :disabled="!newForm.categoryId">
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
import { useVehicleStore } from "@/vehicles/vehicles.store";
import { useCategoryStore } from "@/categories/categories.store";
import {
  TRANSMISSIONS,
  type VehicleDto,
  type Transmission,
} from "@driving-school-booking/shared-types";
import { Button, buttonVariants } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const open = defineModel<boolean>("open", { required: true });

const { t } = useI18n();
const vehicleStore = useVehicleStore();
const categoryStore = useCategoryStore();

const editingId = ref<string | null>(null);
const editForm = reactive<{
  make: string;
  model: string;
  licensePlate: string;
  transmission: Transmission;
  categoryId: string | null;
}>({
  make: "",
  model: "",
  licensePlate: "",
  transmission: TRANSMISSIONS.AUTOMATIC,
  categoryId: null,
});
const newForm = reactive<{
  make: string;
  model: string;
  licensePlate: string;
  transmission: Transmission;
  categoryId: string | null;
}>({
  make: "",
  model: "",
  licensePlate: "",
  transmission: TRANSMISSIONS.AUTOMATIC,
  categoryId: null,
});

watch(open, async (isOpen) => {
  if (isOpen) {
    await Promise.all([
      vehicleStore.fetchVehicles(),
      categoryStore.fetchSchoolCategories(),
    ]);
    cancelEdit();
  }
});

function getCategoryName(categoryId: string): string {
  const category = categoryStore.schoolCategories.find(
    (c) => c.id === categoryId,
  );
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
  editForm.categoryId = null;
}

async function handleUpdate(id: string) {
  if (!editForm.categoryId) return;
  try {
    await vehicleStore.updateVehicle(id, {
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
  try {
    await vehicleStore.deleteVehicle(vehicle.id);
    toast.success(t("vehicle_deleted"));
  } catch {
    toast.error(t("vehicle_delete_failed"));
  }
}

async function handleCreate() {
  if (!newForm.categoryId) return;
  try {
    await vehicleStore.createVehicle({
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
    newForm.categoryId = null;

    toast.success(t("vehicle_created"));
  } catch {
    toast.error(t("vehicle_create_failed"));
  }
}
</script>
