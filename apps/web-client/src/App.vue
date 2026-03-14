<template>
  <RouterView />
  <Toaster rich-colors />
</template>

<script setup lang="ts">
import "vue-sonner/style.css";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "vue-sonner";
import { onErrorCaptured } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

globalThis.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();

  toast.error(t("common_something_went_wrong"));
  console.error(event.reason);
});

onErrorCaptured((e) => {
  toast.error(t("common_something_went_wrong"));
  console.error(e);

  return false;
});
</script>
