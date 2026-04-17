<template>
  <div class="text-muted-foreground py-12 text-center">
    {{ t("common_loading") }}
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>
