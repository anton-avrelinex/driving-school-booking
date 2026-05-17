<template>
  <div class="flex flex-col h-full min-h-0 border-r min-w-0">
    <div class="flex items-center justify-between gap-2 px-3 py-2 border-b">
      <h2 class="text-sm font-semibold">{{ $t("messages_title") }}</h2>
      <Button size="sm" @click="$emit('compose')">
        <PlusIcon class="size-4" />
        {{ $t("messages_compose") }}
      </Button>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto">
      <p
        v-if="!loading && conversations.length === 0"
        class="px-3 py-8 text-center text-sm text-muted-foreground"
      >
        {{ $t("messages_empty") }}
      </p>

      <button
        v-for="conv in conversations"
        :key="conv.id"
        type="button"
        class="flex items-start gap-2.5 w-full px-3 py-2.5 text-left border-b hover:bg-accent transition-colors"
        :class="{ 'bg-accent': conv.id === activeId }"
        @click="$emit('select', conv.id)"
      >
        <Avatar
          :first-name="conv.otherUser.firstName"
          :last-name="conv.otherUser.lastName"
          :role="conv.otherUser.role"
        />
        <div class="flex flex-col min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium truncate">
              {{ conv.otherUser.firstName }} {{ conv.otherUser.lastName }}
            </span>
            <Badge
              v-if="conv.unreadCount > 0"
              variant="default"
              class="ml-auto"
            >
              {{ conv.unreadCount }}
            </Badge>
          </div>
          <span class="text-xs text-muted-foreground truncate">
            {{ conv.lastMessage?.body ?? $t("messages_no_messages_yet") }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon } from "lucide-vue-next";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ConversationModel } from "@/messages/messages.models";

defineProps<{
  conversations: ConversationModel[];
  activeId: string | null;
  loading: boolean;
}>();

defineEmits<{ select: [string]; compose: [] }>();
</script>
