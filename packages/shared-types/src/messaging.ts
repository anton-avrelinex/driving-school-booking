import type { Role } from "./constants";

export interface RecipientDto {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface ConversationLastMessageDto {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  otherUser: RecipientDto;
  lastMessage: ConversationLastMessageDto | null;
  unreadCount: number;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface CreateConversationDto {
  otherUserId: string;
}

export interface SendMessageDto {
  body: string;
}

export interface MessagingEvent {
  conversationId: string;
  message: MessageDto;
}
