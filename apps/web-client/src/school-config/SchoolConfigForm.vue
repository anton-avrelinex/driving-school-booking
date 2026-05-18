<template>
  <Transition name="fade" mode="out-in">
    <div v-if="store.loading && !store.config" class="flex flex-col gap-4">
      <Skeleton class="h-48 w-full" />
      <Skeleton class="h-48 w-full" />
    </div>
    <div v-else-if="store.error" class="text-destructive">
      {{ store.error }}
    </div>
    <form
      v-else-if="store.config"
      class="flex flex-col gap-6"
      @submit.prevent="handleSave"
    >
      <Card>
        <CardHeader>
          <CardTitle>{{ $t("school_config_timezone_title") }}</CardTitle>
          <CardDescription>
            {{ $t("school_config_timezone_description") }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col gap-2 max-w-sm">
            <Label for="timezone">{{ $t("school_config_timezone") }}</Label>
            <Select v-model="form.timezone">
              <SelectTrigger id="timezone" class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent class="max-h-80">
                <SelectItem v-for="tz in TIMEZONES" :key="tz" :value="tz">
                  {{ tz }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">
              {{ $t("school_config_timezone_hint") }}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{{ $t("school_config_lessons_title") }}</CardTitle>
          <CardDescription>
            {{ $t("school_config_lessons_description") }}
          </CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <Label for="duration">
              {{ $t("school_config_default_duration") }}
            </Label>
            <Input
              id="duration"
              v-model.number="form.defaultLessonDurationMin"
              type="number"
              min="15"
              max="480"
            />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="leadHours">
              {{ $t("school_config_min_booking_lead_hours") }}
            </Label>
            <Input
              id="leadHours"
              v-model.number="form.minBookingLeadHours"
              type="number"
              min="0"
              max="168"
            />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="cancelDays">
              {{ $t("school_config_cancel_days") }}
            </Label>
            <Input
              id="cancelDays"
              v-model.number="form.cancelDeadlineDaysBefore"
              type="number"
              min="0"
              max="30"
            />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="cancelTime">
              {{ $t("school_config_cancel_time") }}
            </Label>
            <Input id="cancelTime" v-model="form.cancelDeadlineTime" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="penalty">
              {{ $t("school_config_late_penalty") }}
            </Label>
            <Input
              id="penalty"
              v-model.number="form.lateCancelPenaltyPerHour"
              type="number"
              min="0"
              step="0.01"
            />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="currency">{{ $t("school_config_currency") }}</Label>
            <Select v-model="form.currency">
              <SelectTrigger id="currency" class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="code in CURRENCY_CODES"
                  :key="code"
                  :value="code"
                >
                  {{ code }} — {{ currencyDisplayName(code, locale) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div class="flex justify-end">
        <Button type="submit" :disabled="store.saving">
          {{ store.saving ? $t("common_saving") : $t("common_save") }}
        </Button>
      </div>
    </form>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import type { SchoolConfigDto } from "@driving-school-booking/shared-types";
import { useSchoolConfigStore } from "@/school-config/school-config.store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CURRENCY_CODES, currencyDisplayName } from "@/lib/currency";

const { t, locale } = useI18n();
const store = useSchoolConfigStore();

const TIMEZONES = Intl.supportedValuesOf("timeZone");

const form = reactive<SchoolConfigDto>({
  cancelDeadlineDaysBefore: 1,
  cancelDeadlineTime: "15:00",
  lateCancelPenaltyPerHour: 0,
  defaultLessonDurationMin: 120,
  minBookingLeadHours: 2,
  timezone: "UTC",
  currency: "EUR",
});

onMounted(() => store.fetchConfig());

watch(
  () => store.config,
  (c) => {
    if (c) {
      Object.assign(form, c);
    }
  },
  { immediate: true },
);

async function handleSave() {
  try {
    await store.updateConfig({ ...form });
    toast.success(t("school_config_saved"));
  } catch {
    toast.error(t("school_config_save_failed"));
  }
}
</script>
