<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t("teacher_manage_title") }}</h1>
      <div class="space-x-2">
        <Button variant="outline" @click="showCategoriesDialog = true">
          {{ $t("category_manage") }}
        </Button>
        <Button variant="outline" @click="showCoursesDialog = true">
          {{ $t("course_manage") }}
        </Button>
        <Button variant="outline" @click="showVehiclesDialog = true">
          {{ $t("vehicle_manage") }}
        </Button>
        <Button @click="showCreateDialog = true">
          {{ $t("teacher_add") }}
        </Button>
      </div>
    </div>

    <p v-if="teacherStore.loading" class="text-muted-foreground">
      {{ $t("common_loading") }}
    </p>
    <p v-else-if="teacherStore.error" class="text-destructive">
      {{ teacherStore.error }}
    </p>

    <Table v-else>
      <TableHeader>
        <TableRow>
          <TableHead>{{ $t("common_first_name") }}</TableHead>
          <TableHead>{{ $t("common_last_name") }}</TableHead>
          <TableHead>{{ $t("common_email") }}</TableHead>
          <TableHead>{{ $t("teacher_courses") }}</TableHead>
          <TableHead>{{ $t("teacher_vehicles") }}</TableHead>
          <TableHead>{{ $t("common_status") }}</TableHead>
          <TableHead class="text-right">{{ $t("common_actions") }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="user in teacherStore.teachers" :key="user.id">
          <TableCell>{{ user.firstName }}</TableCell>
          <TableCell>{{ user.lastName }}</TableCell>
          <TableCell>{{ user.email }}</TableCell>
          <TableCell>
            <span
              v-for="course in user.courses"
              :key="course.id"
              class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mr-1"
            >
              {{ course.name }}
            </span>
          </TableCell>
          <TableCell>
            <span
              v-for="vehicle in user.vehicles"
              :key="vehicle.id"
              class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mr-1"
            >
              {{ vehicle.make }} {{ vehicle.model }}
            </span>
          </TableCell>
          <TableCell>
            <span
              :class="
                user.status === USER_STATUSES.ACTIVE
                  ? 'text-green-600'
                  : 'text-muted-foreground'
              "
            >
              {{ user.status }}
            </span>
          </TableCell>
          <TableCell class="text-right space-x-2">
            <Button variant="outline" size="sm" @click="openEditDialog(user)">
              {{ $t("common_edit") }}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              :disabled="user.status === USER_STATUSES.INACTIVE"
              @click="openDeactivateDialog(user)"
            >
              {{ $t("common_deactivate") }}
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <CreateTeacherDialog
      v-model:open="showCreateDialog"
      @created="onTeacherCreated"
    />

    <TempPasswordDialog
      v-model:open="showTempPasswordDialog"
      :email="tempPasswordEmail"
      :password="tempPassword"
    />

    <EditTeacherDialog v-model:open="showEditDialog" :user="editingUser" />

    <DeactivateTeacherDialog
      v-model:open="showDeactivateDialog"
      :user="deactivatingUser"
    />

    <ManageCategoriesDialog v-model:open="showCategoriesDialog" />

    <ManageCoursesDialog v-model:open="showCoursesDialog" />

    <ManageVehiclesDialog v-model:open="showVehiclesDialog" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useTeacherStore } from "@/teachers/teachers.store";
import {
  USER_STATUSES,
  type UserDto,
  type CreateUserResponseDto,
} from "@driving-school-booking/shared-types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CreateTeacherDialog from "@/teachers/CreateTeacherDialog.vue";
import TempPasswordDialog from "@/teachers/TempPasswordDialog.vue";
import EditTeacherDialog from "@/teachers/EditTeacherDialog.vue";
import DeactivateTeacherDialog from "@/teachers/DeactivateTeacherDialog.vue";
import ManageCategoriesDialog from "@/teachers/ManageCategoriesDialog.vue";
import ManageCoursesDialog from "@/teachers/ManageCoursesDialog.vue";
import ManageVehiclesDialog from "@/teachers/ManageVehiclesDialog.vue";

const teacherStore = useTeacherStore();

const showCreateDialog = ref(false);
const showTempPasswordDialog = ref(false);
const tempPassword = ref("");
const tempPasswordEmail = ref("");

const showEditDialog = ref(false);
const editingUser = ref<UserDto | null>(null);

const showDeactivateDialog = ref(false);
const deactivatingUser = ref<UserDto | null>(null);

const showCategoriesDialog = ref(false);
const showCoursesDialog = ref(false);
const showVehiclesDialog = ref(false);

onMounted(async () => {
  await Promise.all([
    teacherStore.fetchTeachers(),
    teacherStore.fetchAllCategories(),
    teacherStore.fetchSchoolCategories(),
    teacherStore.fetchCourses(),
    teacherStore.fetchVehicles(),
  ]);
});

function onTeacherCreated(result: CreateUserResponseDto) {
  tempPassword.value = result.temporaryPassword;
  tempPasswordEmail.value = result.email;
  showTempPasswordDialog.value = true;
}

function openEditDialog(user: UserDto) {
  editingUser.value = user;
  showEditDialog.value = true;
}

function openDeactivateDialog(user: UserDto) {
  deactivatingUser.value = user;
  showDeactivateDialog.value = true;
}
</script>
