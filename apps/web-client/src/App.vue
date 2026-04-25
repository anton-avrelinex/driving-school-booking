<template>
  <TooltipProvider>
    <RouterView />
    <Toaster rich-colors />
  </TooltipProvider>
</template>

<script setup lang="ts">
import "vue-sonner/style.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "vue-sonner";
import { onErrorCaptured } from "vue";
import { useI18n } from "vue-i18n";
import { logError } from "@/observability";

const { t } = useI18n();

globalThis.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();

  const reason: unknown = event.reason;
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;

  toast.error(t("common_something_went_wrong"));
  logError(`Unhandled rejection: ${message}`, undefined, stack);
});

globalThis.addEventListener("error", (event) => {
  const err: unknown = event.error;
  const stack = err instanceof Error ? err.stack : undefined;

  toast.error(t("common_something_went_wrong"));
  logError(
    event.message,
    { filename: event.filename, lineno: event.lineno },
    stack,
  );
});

onErrorCaptured((e) => {
  const error = e instanceof Error ? e : new Error(String(e));

  toast.error(t("common_something_went_wrong"));
  logError(error.message, undefined, error.stack);

  return false;
});
</script>
