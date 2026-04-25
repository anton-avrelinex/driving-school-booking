<template>
  <span
    data-slot="avatar"
    :class="cn(avatarVariants({ size, role: roleKey }), props.class)"
  >
    {{ initials }}
  </span>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { computed } from "vue";
import { ROLES, type Role } from "@driving-school-booking/shared-types";
import { cn } from "@/lib/utils";
import { avatarVariants, type AvatarVariants } from ".";

const props = defineProps<{
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  role?: Role | null;
  size?: AvatarVariants["size"];
  class?: HTMLAttributes["class"];
}>();

const initials = computed(() => {
  const first = props.firstName?.trim();
  const last = props.lastName?.trim();
  if (first || last) {
    return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
  }
  const full = props.name?.trim();
  if (full) {
    const parts = full.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
    }
    return full.slice(0, 2).toUpperCase();
  }
  return "?";
});

const roleKey = computed<AvatarVariants["role"]>(() => {
  switch (props.role) {
    case ROLES.ADMIN:
      return "admin";
    case ROLES.INSTRUCTOR:
      return "instructor";
    case ROLES.STUDENT:
      return "student";
    default:
      return "neutral";
  }
});
</script>
