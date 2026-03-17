<template>
  <div class="flex min-h-screen">
    <aside class="w-60 border-r bg-muted/40 p-4 flex flex-col gap-2">
      <div class="flex flex-row justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">{{ $t("app_name") }}</h2>
        <Button @click="toggleTheme" variant="ghost">
          <MoonIcon v-if="mode === 'dark'" />
          <SunIcon v-else />
        </Button>
      </div>

      <RouterLink
        to="/"
        class="block rounded-md px-3 py-2 text-sm hover:bg-accent"
      >
        {{ $t("nav_dashboard") }}
      </RouterLink>

      <template v-if="auth.isAdmin">
        <RouterLink
          to="/admin/students"
          class="block rounded-md px-3 py-2 text-sm hover:bg-accent"
        >
          {{ $t("nav_manage_students") }}
        </RouterLink>
        <RouterLink
          to="/admin/teachers"
          class="block rounded-md px-3 py-2 text-sm hover:bg-accent"
        >
          {{ $t("nav_manage_teachers") }}
        </RouterLink>
      </template>

      <template v-if="auth.isInstructor">
        <RouterLink
          to="/instructor/availability"
          class="block rounded-md px-3 py-2 text-sm hover:bg-accent"
        >
          {{ $t("nav_my_availability") }}
        </RouterLink>
      </template>

      <div class="mt-auto">
        <p class="mb-2 text-xs text-muted-foreground truncate">
          {{ auth.user?.role }}
        </p>
        <Button
          variant="outline"
          size="sm"
          class="w-full"
          @click="auth.logout()"
        >
          {{ $t("common_logout") }}
        </Button>
      </div>
    </aside>

    <main class="flex-1 p-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/auth/auth.store";
import { Button } from "@/components/ui/button";
import { useColorMode } from "@vueuse/core";
import { MoonIcon, SunIcon } from "lucide-vue-next";

const auth = useAuthStore();

const mode = useColorMode();

function toggleTheme() {
  mode.value = mode.value === "light" ? "dark" : "light";
}
</script>
