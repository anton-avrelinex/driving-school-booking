<template>
  <div class="flex min-h-screen">
    <aside class="w-60 border-r bg-muted/40 p-4 flex flex-col gap-2">
      <h2 class="mb-4 text-lg font-semibold">Driving School</h2>

      <RouterLink to="/" class="block rounded-md px-3 py-2 text-sm hover:bg-accent">
        Dashboard
      </RouterLink>

      <template v-if="auth.isAdmin">
        <RouterLink
          to="/admin/students"
          class="block rounded-md px-3 py-2 text-sm hover:bg-accent"
        >
          Manage Students
        </RouterLink>
      </template>

      <div class="mt-auto">
        <p class="mb-2 text-xs text-muted-foreground truncate">{{ auth.user?.role }}</p>
        <Button variant="outline" size="sm" class="w-full" @click="auth.logout()">
          Logout
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

const auth = useAuthStore();
</script>
