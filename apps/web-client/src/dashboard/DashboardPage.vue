<template>
  <StudentDashboard v-if="auth.isStudent" />
  <InstructorDashboard v-else-if="auth.isInstructor" />
  <AdminDashboard v-else-if="auth.isAdmin" />
</template>

<script setup lang="ts">
import { useAuthStore } from "@/auth/auth.store";
import StudentDashboard from "@/dashboard/StudentDashboard.vue";
import InstructorDashboard from "@/dashboard/InstructorDashboard.vue";
import AdminDashboard from "@/dashboard/AdminDashboard.vue";

const auth = useAuthStore();
</script>
