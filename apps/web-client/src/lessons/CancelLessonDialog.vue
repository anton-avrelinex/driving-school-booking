<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t("lesson_cancel_dialog_title") }}</DialogTitle>
        <DialogDescription>
          {{
            info && info.deadlineAt
              ? $t("lesson_cancel_dialog_description")
              : $t("lesson_cancel_dialog_description_no_policy")
          }}
        </DialogDescription>
      </DialogHeader>

      <Skeleton v-if="loading" class="h-20 w-full" />
      <div
        v-else-if="info && info.deadlineAt"
        class="flex flex-col gap-3 text-sm"
      >
        <p>
          <span class="text-muted-foreground">
            {{ $t("lesson_cancel_deadline_at") }}:
          </span>
          {{ $d(new Date(info.deadlineAt), "datetime") }}
        </p>
        <p
          v-if="info.fee > 0"
          class="rounded-md bg-destructive/10 text-destructive p-3"
        >
          {{ $t("lesson_cancel_late_fee_warning", { fee: formattedFee }) }}
        </p>
        <p v-else class="text-muted-foreground">
          {{ $t("lesson_cancel_no_fee") }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="saving" @click="open = false">
          {{ $t("common_cancel") }}
        </Button>
        <Button
          variant="destructive"
          :disabled="loading || saving"
          @click="onConfirm"
        >
          {{ saving ? $t("common_saving") : $t("lesson_cancel_confirm") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import type { CancellationInfoDto } from "@driving-school-booking/shared-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";
import { useLessonStore } from "@/lessons/lessons.store";
import { useSchoolConfigStore } from "@/school-config/school-config.store";

const props = defineProps<{ lessonId: string | null }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ cancelled: [] }>();

const { t, locale } = useI18n();
const lessonStore = useLessonStore();
const schoolConfigStore = useSchoolConfigStore();

const info = ref<CancellationInfoDto | null>(null);
const loading = ref(false);
const saving = ref(false);

const formattedFee = computed(() =>
  info.value
    ? formatCurrency(
        info.value.fee,
        schoolConfigStore.config?.currency ?? "EUR",
        locale.value,
      )
    : "",
);

watch(open, async (isOpen) => {
  if (!isOpen || !props.lessonId) {
    return;
  }

  info.value = null;
  loading.value = true;

  try {
    info.value = await lessonStore.fetchCancellationInfo(props.lessonId);
  } catch {
    toast.error(t("lesson_cancel_fetch_failed"));
    open.value = false;
  } finally {
    loading.value = false;
  }
});

async function onConfirm() {
  if (!props.lessonId) {
    return;
  }

  saving.value = true;

  try {
    await lessonStore.cancelLesson(props.lessonId);

    toast.success(t("lesson_cancel_success"));
    emit("cancelled");
    open.value = false;
  } catch {
    toast.error(t("lesson_cancel_failed"));
  } finally {
    saving.value = false;
  }
}
</script>
