<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{{ $t("course_manage_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("course_manage_description") }}
        </DialogDescription>
      </DialogHeader>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ $t("course_name") }}</TableHead>
            <TableHead>{{ $t("course_price") }}</TableHead>
            <TableHead>{{ $t("course_hours") }}</TableHead>
            <TableHead>{{ $t("course_category") }}</TableHead>
            <TableHead>{{ $t("course_transmission") }}</TableHead>
            <TableHead>{{ $t("common_actions") }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="course in store.courses" :key="course.id">
            <template v-if="editingId === course.id">
              <TableCell>
                <Input v-model="editForm.name" required />
              </TableCell>
              <TableCell>
                <Input
                  v-model.number="editForm.price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
              </TableCell>
              <TableCell>
                <Input
                  v-model.number="editForm.hours"
                  type="number"
                  min="0"
                  required
                />
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
              <TableCell class="flex gap-2">
                <Button size="sm" @click="handleUpdate(course.id)">
                  {{ $t("common_save") }}
                </Button>
                <Button size="sm" variant="outline" @click="cancelEdit">
                  {{ $t("common_cancel") }}
                </Button>
              </TableCell>
            </template>
            <template v-else>
              <TableCell>{{ course.name }}</TableCell>
              <TableCell>{{ course.price }}</TableCell>
              <TableCell>{{ course.hours }}</TableCell>
              <TableCell>{{ getCategoryName(course.categoryId) }}</TableCell>
              <TableCell>
                {{
                  course.transmission === TRANSMISSIONS.AUTOMATIC
                    ? $t("vehicle_transmission_automatic")
                    : $t("vehicle_transmission_manual")
                }}
              </TableCell>
              <TableCell class="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  @click="startEdit(course)"
                >
                  {{ $t("common_edit") }}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  @click="handleDelete(course)"
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
          <Label for="new-course-name">{{ $t("course_name") }}</Label>
          <Input id="new-course-name" v-model="newForm.name" required />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="new-course-price">{{ $t("course_price") }}</Label>
          <Input
            id="new-course-price"
            v-model.number="newForm.price"
            type="number"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="new-course-hours">{{ $t("course_hours") }}</Label>
          <Input
            id="new-course-hours"
            v-model.number="newForm.hours"
            type="number"
            min="0"
            required
          />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="new-course-category">{{ $t("course_category") }}</Label>
          <select
            id="new-course-category"
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
        <div class="flex flex-col gap-1">
          <Label for="new-course-transmission">
            {{ $t("course_transmission") }}
          </Label>
          <select
            id="new-course-transmission"
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
        <Button type="submit">
          {{ $t("course_add") }}
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
  type CourseDto,
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
  name: "",
  price: 0,
  hours: 0,
  categoryId: "",
  transmission: TRANSMISSIONS.AUTOMATIC as Transmission,
});
const newForm = reactive({
  name: "",
  price: 0,
  hours: 0,
  categoryId: "",
  transmission: TRANSMISSIONS.AUTOMATIC as Transmission,
});

watch(open, async (isOpen) => {
  if (isOpen) {
    await Promise.all([store.fetchCourses(), store.fetchSchoolCategories()]);
    cancelEdit();
  }
});

function getCategoryName(categoryId: string): string {
  const category = store.schoolCategories.find((c) => c.id === categoryId);
  return category?.name ?? "";
}

function startEdit(course: CourseDto) {
  editingId.value = course.id;
  editForm.name = course.name;
  editForm.price = course.price;
  editForm.hours = course.hours;
  editForm.categoryId = course.categoryId;
  editForm.transmission = course.transmission;
}

function cancelEdit() {
  editingId.value = null;
  editForm.name = "";
  editForm.price = 0;
  editForm.hours = 0;
  editForm.categoryId = "";
  editForm.transmission = TRANSMISSIONS.AUTOMATIC;
}

async function handleUpdate(id: string) {
  try {
    await store.updateCourse(id, {
      name: editForm.name,
      price: editForm.price,
      hours: editForm.hours,
      categoryId: editForm.categoryId,
      transmission: editForm.transmission,
    });
    cancelEdit();
    toast.success(t("course_updated"));
  } catch {
    toast.error(t("course_update_failed"));
  }
}

async function handleDelete(course: CourseDto) {
  if (
    !globalThis.confirm(t("course_delete_confirm", { name: course.name }))
  ) {
    return;
  }

  try {
    await store.deleteCourse(course.id);
    toast.success(t("course_deleted"));
  } catch {
    toast.error(t("course_delete_failed"));
  }
}

async function handleCreate() {
  try {
    await store.createCourse({
      name: newForm.name,
      price: newForm.price,
      hours: newForm.hours,
      categoryId: newForm.categoryId,
      transmission: newForm.transmission,
    });
    newForm.name = "";
    newForm.price = 0;
    newForm.hours = 0;
    newForm.categoryId = "";
    newForm.transmission = TRANSMISSIONS.AUTOMATIC;
    toast.success(t("course_created"));
  } catch {
    toast.error(t("course_create_failed"));
  }
}
</script>
