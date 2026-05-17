import { ref, computed, watch, type Ref } from "vue";
import { defineStore } from "pinia";
import { useEventSource } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import type {
  ConversationDto,
  MessageDto,
  MessagingEvent,
  RecipientDto,
} from "@driving-school-booking/shared-types";
import api from "@/api/api";
import {
  type ConversationModel,
  type MessageModel,
  toConversationModel,
  toMessageModel,
} from "@/messages/messages.models";

const SSE_URL = "/api/conversations/events";

export const useMessagesStore = defineStore("messages", () => {
  const { t } = useI18n();

  const conversations = ref<ConversationModel[]>([]) as Ref<
    ConversationModel[]
  >;
  const messagesByConversation = ref<Record<string, MessageModel[]>>({});
  const loading = ref(false);
  const saving = ref(false);
  const activeConversationId = ref<string | null>(null);

  const {
    data: sseData,
    open: startSse,
    close: stopSse,
  } = useEventSource<[], string>(SSE_URL, [], {
    withCredentials: true,
    immediate: false,
  });

  watch(sseData, (raw) => {
    if (raw === null) {
      return;
    }
    try {
      applyServerEvent(JSON.parse(raw) as MessagingEvent);
    } catch {
      // ignore malformed event
    }
  });

  const totalUnread = computed(() =>
    conversations.value.reduce((sum, c) => sum + c.unreadCount, 0),
  );

  async function fetchConversations() {
    loading.value = true;
    try {
      const { data } = await api.get<ConversationDto[]>("/conversations");
      conversations.value = data.map(toConversationModel);
    } catch {
      toast.error(t("messages_load_failed"));
    } finally {
      loading.value = false;
    }
  }

  async function fetchMessages(conversationId: string) {
    try {
      const { data } = await api.get<MessageDto[]>(
        `/conversations/${conversationId}/messages`,
      );
      messagesByConversation.value[conversationId] = data.map(toMessageModel);
    } catch {
      toast.error(t("messages_load_failed"));
    }
  }

  async function fetchRecipients(): Promise<RecipientDto[]> {
    const { data } = await api.get<RecipientDto[]>("/conversations/recipients");
    return data;
  }

  async function sendMessage(
    conversationId: string,
    body: string,
  ): Promise<MessageModel> {
    saving.value = true;
    try {
      const { data } = await api.post<MessageDto>(
        `/conversations/${conversationId}/messages`,
        { body },
      );

      const message = toMessageModel(data);
      applyNewMessage(conversationId, message);
      return message;
    } finally {
      saving.value = false;
    }
  }

  async function markRead(conversationId: string) {
    await api.patch(`/conversations/${conversationId}/read`);

    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (conversation) {
      conversation.unreadCount = 0;
    }
  }

  async function createConversation(
    otherUserId: string,
  ): Promise<ConversationModel> {
    const { data } = await api.post<ConversationDto>("/conversations", {
      otherUserId,
    });

    const conversation = toConversationModel(data);
    const existing = conversations.value.find((c) => c.id === conversation.id);
    if (!existing) {
      conversations.value = [conversation, ...conversations.value];
    }

    return conversation;
  }

  function setActiveConversation(conversationId: string | null) {
    activeConversationId.value = conversationId;
  }

  function applyServerEvent(event: MessagingEvent) {
    const incoming = toMessageModel(event.message);
    applyNewMessage(event.conversationId, incoming);

    if (activeConversationId.value === event.conversationId) {
      void markRead(event.conversationId);
      return;
    }

    const conversation = conversations.value.find(
      (c) => c.id === event.conversationId,
    );
    if (conversation) {
      conversation.unreadCount += 1;
    } else {
      void fetchConversations();
    }
  }

  function applyNewMessage(conversationId: string, message: MessageModel) {
    const existing = messagesByConversation.value[conversationId] ?? [];
    messagesByConversation.value[conversationId] = [message, ...existing];

    const conversation = conversations.value.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) {
      return;
    }
    conversation.lastMessage = {
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      createdAt: message.createdAt,
    };
    conversations.value = [
      conversation,
      ...conversations.value.filter((c) => c.id !== conversationId),
    ];
  }

  return {
    conversations,
    messagesByConversation,
    loading,
    saving,
    activeConversationId,
    totalUnread,
    fetchConversations,
    fetchMessages,
    fetchRecipients,
    sendMessage,
    markRead,
    createConversation,
    setActiveConversation,
    startSse,
    stopSse,
  };
});
