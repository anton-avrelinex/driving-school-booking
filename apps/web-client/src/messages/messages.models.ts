import type { ZonedDateTime } from "@internationalized/date";
import type {
  ConversationDto,
  MessageDto,
  RecipientDto,
} from "@driving-school-booking/shared-types";
import { parseISOToZoned } from "@/lib/date-utils";

export interface ConversationModel {
  id: string;
  otherUser: RecipientDto;
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    createdAt: ZonedDateTime;
  } | null;
  unreadCount: number;
}

export interface MessageModel {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: ZonedDateTime;
}

export function toConversationModel(dto: ConversationDto): ConversationModel {
  return {
    id: dto.id,
    otherUser: dto.otherUser,
    lastMessage: dto.lastMessage
      ? {
          id: dto.lastMessage.id,
          body: dto.lastMessage.body,
          senderId: dto.lastMessage.senderId,
          createdAt: parseISOToZoned(dto.lastMessage.createdAt),
        }
      : null,
    unreadCount: dto.unreadCount,
  };
}

export function toMessageModel(dto: MessageDto): MessageModel {
  return {
    id: dto.id,
    conversationId: dto.conversationId,
    senderId: dto.senderId,
    body: dto.body,
    createdAt: parseISOToZoned(dto.createdAt),
  };
}
