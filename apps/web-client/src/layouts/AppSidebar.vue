<template>
  <aside
    class="sticky top-0 h-screen w-64 border-r bg-muted/40 flex flex-col gap-1 px-3 py-4 overflow-y-auto"
  >
    <div class="flex flex-row justify-between items-center mb-4 px-2">
      <h2 class="text-lg font-semibold">{{ $t("app_name") }}</h2>
      <Button @click="toggleTheme" variant="ghost" size="icon">
        <MoonIcon v-if="mode === 'dark'" />
        <SunIcon v-else />
      </Button>
    </div>

    <template v-for="section in sections" :key="section.key">
      <p
        class="mt-3 mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
      >
        {{ section.label }}
      </p>
      <RouterLink
        v-for="item in section.items"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        active-class=""
        exact-active-class="bg-accent text-foreground"
      >
        <component :is="item.icon" class="size-4" />
        {{ item.label }}
      </RouterLink>
    </template>

    <div class="mt-auto pt-3 border-t">
      <div class="flex items-center gap-2 px-2 py-2">
        <Avatar
          :first-name="settings.profile?.firstName"
          :last-name="settings.profile?.lastName"
          :role="auth.user?.role ?? null"
        />
        <Tooltip>
          <TooltipTrigger as-child>
            <div class="flex flex-col min-w-0 flex-1 text-left">
              <p class="text-sm font-medium truncate">
                {{ displayName }}
              </p>
              <p class="text-xs text-muted-foreground truncate">
                {{ auth.user?.role }}
              </p>
            </div>
          </TooltipTrigger>
          <TooltipContent v-if="displayName" side="top">
            {{ displayName }}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              :aria-label="$t('common_logout')"
              @click="auth.logout()"
            >
              <LogOutIcon class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {{ $t("common_logout") }}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, type FunctionalComponent } from "vue";
import { useColorMode } from "@vueuse/core";
import {
  ActivityIcon,
  BookOpenIcon,
  CalendarClockIcon,
  CalendarIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MoonIcon,
  PlusCircleIcon,
  SettingsIcon,
  SunIcon,
  UsersIcon,
} from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { ROLES, type Role } from "@driving-school-booking/shared-types";
import { useAuthStore } from "@/auth/auth.store";
import { useSettingsStore } from "@/settings/settings.store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const { t } = useI18n();
const auth = useAuthStore();
const settings = useSettingsStore();
const mode = useColorMode();

function toggleTheme() {
  mode.value = mode.value === "light" ? "dark" : "light";
}

onMounted(async () => {
  if (!settings.profile) {
    await settings.fetchProfile();
  }
});

const displayName = computed(() => {
  const p = settings.profile;
  if (!p) {
    return "";
  }

  return `${p.firstName} ${p.lastName}`.trim();
});

type IconComponent = FunctionalComponent;
type NavItem = { to: string; label: string; icon: IconComponent };
type NavSection = {
  key: string;
  label: string;
  role?: Role;
  items: NavItem[];
};

const sections = computed<NavSection[]>(() => {
  const userRole = auth.user?.role;
  const all: NavSection[] = [
    {
      key: "overview",
      label: t("nav_section_overview"),
      items: [
        {
          to: "/",
          label: t("nav_dashboard"),
          icon: markRaw(LayoutDashboardIcon),
        },
      ],
    },
    {
      key: "manage",
      label: t("nav_section_manage"),
      role: ROLES.ADMIN,
      items: [
        {
          to: "/admin/students",
          label: t("nav_manage_students"),
          icon: markRaw(GraduationCapIcon),
        },
        {
          to: "/admin/teachers",
          label: t("nav_manage_teachers"),
          icon: markRaw(UsersIcon),
        },
        {
          to: "/admin/lessons",
          label: t("nav_lessons"),
          icon: markRaw(CalendarIcon),
        },
        {
          to: "/admin/monitoring",
          label: t("nav_monitoring"),
          icon: markRaw(ActivityIcon),
        },
      ],
    },
    {
      key: "teaching",
      label: t("nav_section_teaching"),
      role: ROLES.INSTRUCTOR,
      items: [
        {
          to: "/instructor/availability",
          label: t("nav_my_availability"),
          icon: markRaw(CalendarClockIcon),
        },
        {
          to: "/instructor/lessons",
          label: t("nav_my_lessons"),
          icon: markRaw(BookOpenIcon),
        },
      ],
    },
    {
      key: "learning",
      label: t("nav_section_learning"),
      role: ROLES.STUDENT,
      items: [
        {
          to: "/lessons/book",
          label: t("nav_book_lesson"),
          icon: markRaw(PlusCircleIcon),
        },
        {
          to: "/lessons",
          label: t("nav_my_lessons"),
          icon: markRaw(BookOpenIcon),
        },
      ],
    },
    {
      key: "account",
      label: t("nav_section_account"),
      items: [
        {
          to: "/settings",
          label: t("nav_settings"),
          icon: markRaw(SettingsIcon),
        },
      ],
    },
  ];

  return all.filter((s) => !s.role || s.role === userRole);
});
</script>
