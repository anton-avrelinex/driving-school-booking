<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t("student_manage_title") }}</h1>
      <Button @click="showCreateDialog = true">{{ $t("student_add") }}</Button>
    </div>

    <p v-if="userStore.loading" class="text-muted-foreground">
      {{ $t("common_loading") }}
    </p>
    <p v-else-if="userStore.error" class="text-destructive">
      {{ userStore.error }}
    </p>

    <Table v-else>
      <TableHeader>
        <TableRow>
          <TableHead>{{ $t("common_first_name") }}</TableHead>
          <TableHead>{{ $t("common_last_name") }}</TableHead>
          <TableHead>{{ $t("common_email") }}</TableHead>
          <TableHead>{{ $t("student_enrollments") }}</TableHead>
          <TableHead>{{ $t("common_status") }}</TableHead>
          <TableHead class="text-right">{{ $t("common_actions") }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="user in userStore.users" :key="user.id">
          <TableCell>{{ user.firstName }}</TableCell>
          <TableCell>{{ user.lastName }}</TableCell>
          <TableCell>{{ user.email }}</TableCell>
          <TableCell>
            <span
              v-for="enrollment in user.studentProfile?.enrollments"
              :key="enrollment.id"
              class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mr-1"
            >
              {{ enrollment.course.name }} ({{ enrollment.hoursCompleted }}/{{ enrollment.hoursPurchased }}h)
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

    <CreateStudentDialog
      v-model:open="showCreateDialog"
      @created="onStudentCreated"
    />

    <TempPasswordDialog
      v-model:open="showTempPasswordDialog"
      :email="tempPasswordEmail"
      :password="tempPassword"
    />

    <EditStudentDialog v-model:open="showEditDialog" :user="editingUser" />

    <DeactivateStudentDialog
      v-model:open="showDeactivateDialog"
      :user="deactivatingUser"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useUserStore } from "@/users/users.store";
import {
  ROLES,
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
import CreateStudentDialog from "@/users/CreateStudentDialog.vue";
import TempPasswordDialog from "@/users/TempPasswordDialog.vue";
import EditStudentDialog from "@/users/EditStudentDialog.vue";
import DeactivateStudentDialog from "@/users/DeactivateStudentDialog.vue";

const userStore = useUserStore();

const showCreateDialog = ref(false);
const showTempPasswordDialog = ref(false);
const tempPassword = ref("");
const tempPasswordEmail = ref("");

const showEditDialog = ref(false);
const editingUser = ref<UserDto | null>(null);

const showDeactivateDialog = ref(false);
const deactivatingUser = ref<UserDto | null>(null);

onMounted(async () => {
  await userStore.fetchUsers(ROLES.STUDENT);
});

function onStudentCreated(result: CreateUserResponseDto) {
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
