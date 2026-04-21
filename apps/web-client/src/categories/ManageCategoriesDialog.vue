<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ $t("category_manage_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("category_manage_description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-3">
        <div
          v-for="category in categoryStore.allCategories"
          :key="category.id"
          class="flex items-center gap-2"
        >
          <Checkbox
            :id="`category-${category.id}`"
            :model-value="selectedIds.includes(category.id)"
            @update:model-value="(v) => toggleCategoryId(category.id, v)"
          />
          <Label :for="`category-${category.id}`" class="text-sm font-normal">
            {{ category.name }}
          </Label>
        </div>
      </div>

      <div class="flex justify-end pt-4 border-t">
        <Button :disabled="saving" @click="handleSave">
          {{ saving ? $t("common_saving") : $t("common_save") }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { useCategoryStore } from "@/categories/categories.store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { makeToggle } from "@/lib/toggle-list";

const open = defineModel<boolean>("open", { required: true });

const { t } = useI18n();
const categoryStore = useCategoryStore();

const selectedIds = ref<string[]>([]);
const toggleCategoryId = makeToggle(selectedIds);
const saving = ref(false);

watch(open, async (isOpen) => {
  if (isOpen) {
    await Promise.all([
      categoryStore.fetchAllCategories(),
      categoryStore.fetchSchoolCategories(),
    ]);
    selectedIds.value = categoryStore.schoolCategories.map((c) => c.id);
  }
});

async function handleSave() {
  saving.value = true;
  try {
    await categoryStore.updateSchoolCategories(selectedIds.value);
    toast.success(t("category_school_updated"));
    open.value = false;
  } catch {
    toast.error(t("category_school_update_failed"));
  } finally {
    saving.value = false;
  }
}
</script>
