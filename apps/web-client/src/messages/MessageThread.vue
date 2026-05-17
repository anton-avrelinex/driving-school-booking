<template>
  <div class="flex flex-col h-full min-h-0 min-w-0">
    <div v-if="!conversation" class="flex-1 grid place-items-center">
      <p class="text-sm text-muted-foreground">{{ $t("messages_pick_one") }}</p>
    </div>

    <template v-else>
      <div class="flex items-center gap-2.5 px-4 py-3 border-b">
        <Avatar
          :first-name="conversation.otherUser.firstName"
          :last-name="conversation.otherUser.lastName"
          :role="conversation.otherUser.role"
        />
        <div class="flex flex-col min-w-0">
          <span class="text-sm font-medium truncate">
            {{ conversation.otherUser.firstName }}
            {{ conversation.otherUser.lastName }}
          </span>
          <span class="text-xs text-muted-foreground">
            {{ conversation.otherUser.role }}
          </span>
        </div>
      </div>

      <div
        class="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col-reverse gap-2"
      >
        <p
          v-if="messages.length === 0"
          class="text-center text-sm text-muted-foreground py-8"
        >
          {{ $t("messages_no_messages_yet") }}
        </p>
        <div
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="
            message.senderId === currentUserId ? 'justify-end' : 'justify-start'
          "
        >
          <div
            class="max-w-[75%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words"
            :class="
              message.senderId === currentUserId
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            "
          >
            {{ message.body }}
            <div
              class="text-[10px] mt-1 opacity-70"
              :class="message.senderId === currentUserId ? 'text-right' : ''"
            >
              {{ $d(message.createdAt.toDate(), "datetimeShort") }}
            </div>
          </div>
        </div>
      </div>

      <form
        class="flex items-end gap-2 px-3 py-2 border-t"
        @submit.prevent="onSubmit"
      >
        <textarea
          v-model="draft"
          rows="1"
          :placeholder="$t('messages_compose_placeholder')"
          class="flex-1 resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          @keydown="onKey"
        />
        <Button type="submit" size="sm" :disabled="!draft.trim() || saving">
          <SendIcon class="size-4" />
          {{ $t("messages_send") }}
        </Button>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { SendIcon } from "lucide-vue-next";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type {
  ConversationModel,
  MessageModel,
} from "@/messages/messages.models";

const props = defineProps<{
  conversation: ConversationModel | null;
  messages: MessageModel[];
  currentUserId: string;
  saving: boolean;
}>();

const emit = defineEmits<{ send: [body: string] }>();

const draft = ref("");

function onSubmit() {
  const trimmed = draft.value.trim();
  if (!trimmed || props.saving) {
    return;
  }
  emit("send", trimmed);
  draft.value = "";
}

function onKey(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    onSubmit();
  }
}
</script>
