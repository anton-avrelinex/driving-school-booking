<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t("teacher_manage_title") }}</h1>
      <Button @click="showCreateDialog = true">{{ $t("teacher_add") }}</Button>
    </div>

    <Transition name="fade" mode="out-in">
      <TableSkeleton
        v-if="teacherStore.loading && teacherStore.teachers.length === 0"
        :columns="7"
      />
      <p v-else-if="teacherStore.error" class="text-destructive">
        {{ teacherStore.error }}
      </p>
      <EmptyState
        v-else-if="teacherStore.teachers.length === 0"
        :title="$t('teacher_empty_title')"
        :description="$t('teacher_empty_description')"
        :icon="UsersIcon"
      >
        <Button @click="showCreateDialog = true">
          {{ $t("teacher_add") }}
        </Button>
      </EmptyState>

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
            <TableCell class="space-x-1">
              <Badge
                v-for="course in user.instructorProfile?.courses"
                :key="course.id"
                variant="secondary"
              >
                {{ course.name }}
              </Badge>
            </TableCell>
            <TableCell class="space-x-1">
              <Badge
                v-for="vehicle in user.instructorProfile?.vehicles"
                :key="vehicle.id"
                variant="secondary"
              >
                {{ vehicle.make }} {{ vehicle.model }}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                :variant="
                  user.status === USER_STATUSES.ACTIVE ? 'success' : 'secondary'
                "
              >
                {{ user.status }}
              </Badge>
            </TableCell>
            <TableCell class="text-right space-x-2">
              <Button
                variant="outline"
                size="sm"
                @click="openAvailabilityDialog(user)"
              >
                {{ $t("teacher_availability") }}
              </Button>
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
    </Transition>

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

    <SetAvailabilityDialog
      v-model:open="showAvailabilityDialog"
      :user="availabilityUser"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useTeacherStore } from "@/teachers/teachers.store";
import { useCourseStore } from "@/courses/courses.store";
import { useVehicleStore } from "@/vehicles/vehicles.store";
import {
  USER_STATUSES,
  type UserDto,
  type CreateUserResponseDto,
} from "@driving-school-booking/shared-types";
import { UsersIcon } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EmptyState from "@/components/EmptyState.vue";
import TableSkeleton from "@/components/TableSkeleton.vue";
import CreateTeacherDialog from "@/teachers/CreateTeacherDialog.vue";
import TempPasswordDialog from "@/teachers/TempPasswordDialog.vue";
import EditTeacherDialog from "@/teachers/EditTeacherDialog.vue";
import DeactivateTeacherDialog from "@/teachers/DeactivateTeacherDialog.vue";
import SetAvailabilityDialog from "@/availability/SetAvailabilityDialog.vue";

const teacherStore = useTeacherStore();
const courseStore = useCourseStore();
const vehicleStore = useVehicleStore();

const showCreateDialog = ref(false);
const showTempPasswordDialog = ref(false);
const tempPassword = ref("");
const tempPasswordEmail = ref("");

const showEditDialog = ref(false);
const editingUser = ref<UserDto | null>(null);

const showDeactivateDialog = ref(false);
const deactivatingUser = ref<UserDto | null>(null);

const showAvailabilityDialog = ref(false);
const availabilityUser = ref<UserDto | null>(null);

onMounted(async () => {
  await Promise.all([
    teacherStore.fetchTeachers(),
    courseStore.fetchCourses(),
    vehicleStore.fetchVehicles(),
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

function openAvailabilityDialog(user: UserDto) {
  availabilityUser.value = user;
  showAvailabilityDialog.value = true;
}
</script>
