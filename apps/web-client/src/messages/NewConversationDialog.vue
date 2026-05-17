<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t("messages_new_conversation_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("messages_pick_recipient") }}
        </DialogDescription>
      </DialogHeader>

      <Skeleton v-if="loading" class="h-9 w-full" />
      <Select v-else v-model="selectedId">
        <SelectTrigger class="w-full">
          <SelectValue :placeholder="$t('messages_pick_recipient')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="r in recipients" :key="r.id" :value="r.id">
            {{ r.firstName }} {{ r.lastName }}
            <span class="text-muted-foreground">· {{ r.role }}</span>
          </SelectItem>
        </SelectContent>
      </Select>

      <DialogFooter>
        <Button variant="outline" :disabled="saving" @click="open = false">
          {{ $t("common_cancel") }}
        </Button>
        <Button :disabled="!selectedId || saving" @click="onSubmit">
          {{ saving ? $t("common_saving") : $t("messages_start") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { RecipientDto } from "@driving-school-booking/shared-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMessagesStore } from "@/messages/messages.store";

const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ created: [conversationId: string] }>();

const messagesStore = useMessagesStore();
const recipients = ref<RecipientDto[]>([]);
const selectedId = ref<string | null>(null);
const loading = ref(false);
const saving = ref(false);

watch(open, async (isOpen) => {
  if (!isOpen) {
    return;
  }
  selectedId.value = null;
  loading.value = true;
  try {
    recipients.value = await messagesStore.fetchRecipients();
  } finally {
    loading.value = false;
  }
});

async function onSubmit() {
  if (!selectedId.value) {
    return;
  }
  saving.value = true;
  try {
    const conv = await messagesStore.createConversation(selectedId.value);
    open.value = false;
    emit("created", conv.id);
  } finally {
    saving.value = false;
  }
}
</script>
