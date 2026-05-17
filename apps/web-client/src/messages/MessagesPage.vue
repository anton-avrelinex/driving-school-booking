<template>
  <div class="flex flex-col gap-4 flex-1 min-h-0">
    <PageHeader
      :title="$t('messages_title')"
      :description="$t('messages_description')"
    />

    <Card class="flex-1 min-h-0 overflow-hidden py-0">
      <div class="grid grid-cols-1 md:grid-cols-[320px_1fr] h-full min-h-0">
        <ConversationList
          :conversations="messagesStore.conversations"
          :active-id="activeId"
          :loading="messagesStore.loading"
          @select="onSelect"
          @compose="composeOpen = true"
        />

        <MessageThread
          :conversation="activeConversation"
          :messages="activeMessages"
          :current-user-id="authStore.user?.id ?? ''"
          :saving="messagesStore.saving"
          @send="onSend"
        />
      </div>
    </Card>

    <NewConversationDialog v-model:open="composeOpen" @created="onSelect" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader.vue";
import { useAuthStore } from "@/auth/auth.store";
import { useMessagesStore } from "@/messages/messages.store";
import ConversationList from "@/messages/ConversationList.vue";
import MessageThread from "@/messages/MessageThread.vue";
import NewConversationDialog from "@/messages/NewConversationDialog.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const messagesStore = useMessagesStore();

const composeOpen = ref(false);

const activeId = computed<string | null>(() => {
  const c = route.query.c;
  return typeof c === "string" ? c : null;
});

const activeConversation = computed(() =>
  activeId.value
    ? (messagesStore.conversations.find((c) => c.id === activeId.value) ?? null)
    : null,
);

const activeMessages = computed(() =>
  activeId.value
    ? (messagesStore.messagesByConversation[activeId.value] ?? [])
    : [],
);

onMounted(async () => {
  await messagesStore.fetchConversations();
  await viewConversation(activeId.value);
});

watch(activeId, viewConversation);

onBeforeUnmount(() => {
  messagesStore.setActiveConversation(null);
});

async function viewConversation(id: string | null) {
  messagesStore.setActiveConversation(id);
  if (id) {
    await messagesStore.fetchMessages(id);
    await messagesStore.markRead(id);
  }
}

async function onSelect(id: string) {
  await router.replace({ query: { ...route.query, c: id } });
}

async function onSend(body: string) {
  if (!activeId.value) {
    return;
  }
  await messagesStore.sendMessage(activeId.value, body);
}
</script>
