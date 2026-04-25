<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t("student_manage_title") }}</h1>
      <Button @click="showCreateDialog = true">{{ $t("student_add") }}</Button>
    </div>

    <Transition name="fade" mode="out-in">
      <TableSkeleton
        v-if="studentStore.loading && studentStore.users.length === 0"
        :columns="6"
      />
      <p v-else-if="studentStore.error" class="text-destructive">
        {{ studentStore.error }}
      </p>
      <EmptyState
        v-else-if="studentStore.users.length === 0"
        :title="$t('student_empty_title')"
        :description="$t('student_empty_description')"
        :icon="GraduationCapIcon"
      >
        <Button @click="showCreateDialog = true">
          {{ $t("student_add") }}
        </Button>
      </EmptyState>

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
          <TableRow v-for="user in studentStore.users" :key="user.id">
            <TableCell>{{ user.firstName }}</TableCell>
            <TableCell>{{ user.lastName }}</TableCell>
            <TableCell>{{ user.email }}</TableCell>
            <TableCell class="space-x-1">
              <Badge
                v-for="enrollment in user.studentProfile?.enrollments"
                :key="enrollment.id"
                variant="secondary"
              >
                {{
                  $t("student_enrollment_hours", {
                    course: enrollment.course.name,
                    completed: enrollment.hoursCompleted,
                    purchased: enrollment.hoursPurchased,
                  })
                }}
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
import { useStudentStore } from "@/students/students.store";
import {
  ROLES,
  USER_STATUSES,
  type UserDto,
  type CreateUserResponseDto,
} from "@driving-school-booking/shared-types";
import { GraduationCapIcon } from "lucide-vue-next";
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
import CreateStudentDialog from "@/students/CreateStudentDialog.vue";
import TempPasswordDialog from "@/students/TempPasswordDialog.vue";
import EditStudentDialog from "@/students/EditStudentDialog.vue";
import DeactivateStudentDialog from "@/students/DeactivateStudentDialog.vue";

const studentStore = useStudentStore();

const showCreateDialog = ref(false);
const showTempPasswordDialog = ref(false);
const tempPassword = ref("");
const tempPasswordEmail = ref("");

const showEditDialog = ref(false);
const editingUser = ref<UserDto | null>(null);

const showDeactivateDialog = ref(false);
const deactivatingUser = ref<UserDto | null>(null);

onMounted(async () => {
  await studentStore.fetchUsers(ROLES.STUDENT);
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
