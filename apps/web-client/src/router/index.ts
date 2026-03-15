import { createRouter, createWebHistory } from "vue-router";
import { ROLES } from "@driving-school-booking/shared-types";
import { useAuthStore } from "@/auth/auth.store";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/auth/LoginPage.vue"),
      meta: { public: true },
    },
    {
      path: "/change-password",
      name: "change-password",
      component: () => import("@/auth/ChangePasswordPage.vue"),
    },
    {
      path: "/",
      component: () => import("@/layouts/AppLayout.vue"),
      children: [
        {
          path: "",
          name: "dashboard",
          component: () => import("@/dashboard/DashboardPage.vue"),
        },
        {
          path: "admin/students",
          name: "manage-students",
          component: () => import("@/users/ManageStudentsPage.vue"),
          meta: { role: ROLES.ADMIN },
        },
        {
          path: "admin/teachers",
          name: "manage-teachers",
          component: () => import("@/teachers/ManageTeachersPage.vue"),
          meta: { role: ROLES.ADMIN },
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.public) {
    if (auth.isAuthenticated) {
      return { name: "dashboard" };
    }

    return true;
  }

  if (!auth.isAuthenticated) {
    return { name: "login" };
  }

  if (auth.mustChangePassword) {
    if (to.name === "change-password") {
      return true;
    }

    return { name: "change-password" };
  }

  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return { name: "dashboard" };
  }

  return true;
});

export default router;
