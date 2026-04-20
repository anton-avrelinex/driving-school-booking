<template>
  <div class="relative">
    <Input
      v-model="model"
      v-bind="$attrs"
      :type="showPassword ? 'text' : 'password'"
      class="pr-10"
    />
    <button
      type="button"
      class="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
      :aria-label="showPassword ? $t('password_hide') : $t('password_show')"
      @click="showPassword = !showPassword"
    >
      <EyeIcon v-if="showPassword" class="size-4" />
      <EyeClosedIcon v-else class="size-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { EyeClosedIcon, EyeIcon } from "lucide-vue-next";
import { Input } from "@/components/ui/input";

defineOptions({ inheritAttrs: false });

const model = defineModel<string>({ required: true });

const showPassword = ref(false);
</script>
