import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  ConversationDto,
  MessageDto,
  RecipientDto,
} from "@driving-school-booking/shared-types";
import { Prisma } from "../generated/prisma/client";
import { UserStatus } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { MessagingEvents } from "./messaging.events";

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: MessagingEvents,
  ) {}

  async listConversations(
    schoolId: string,
    userId: string,
  ): Promise<ConversationDto[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        schoolId,
        participants: { some: { userId } },
      },
      select: CONVERSATION_LIST_SELECT,
      orderBy: { lastMessageAt: "desc" },
    });

    return Promise.all(
      conversations.map((c) => this.toConversationDto(c, userId)),
    );
  }

  async listRecipients(
    schoolId: string,
    userId: string,
  ): Promise<RecipientDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        schoolId,
        status: UserStatus.ACTIVE,
        id: { not: userId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
    }));
  }

  async createOrFindConversation(
    schoolId: string,
    userId: string,
    otherUserId: string,
  ): Promise<ConversationDto> {
    if (otherUserId === userId) {
      throw new BadRequestException(
        "Cannot start a conversation with yourself",
      );
    }

    const other = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, schoolId: true },
    });
    if (other?.schoolId !== schoolId) {
      throw new NotFoundException("Recipient not found");
    }

    const existing = await this.prisma.conversation.findFirst({
      where: {
        schoolId,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      select: { id: true },
    });

    const conversationId =
      existing?.id ??
      (
        await this.prisma.conversation.create({
          data: {
            schoolId,
            participants: {
              create: [{ userId }, { userId: otherUserId }],
            },
          },
          select: { id: true },
        })
      ).id;

    const list = await this.listConversations(schoolId, userId);
    const found = list.find((c) => c.id === conversationId);
    if (!found) {
      throw new Error("conversation creation failed");
    }
    return found;
  }

  async listMessages(
    schoolId: string,
    conversationId: string,
    userId: string,
    opts: { before?: Date; limit?: number },
  ): Promise<MessageDto[]> {
    await this.assertParticipant(schoolId, conversationId, userId);

    const limit = Math.min(
      opts.limit ?? DEFAULT_MESSAGE_PAGE_SIZE,
      MAX_MESSAGE_PAGE_SIZE,
    );

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        ...(opts.before ? { createdAt: { lt: opts.before } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        body: true,
        createdAt: true,
      },
    });

    return messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async sendMessage(
    schoolId: string,
    conversationId: string,
    userId: string,
    body: string,
  ): Promise<MessageDto> {
    const conv = await this.assertParticipant(schoolId, conversationId, userId);

    const now = new Date();
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          body,
        },
        select: {
          id: true,
          conversationId: true,
          senderId: true,
          body: true,
          createdAt: true,
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: now },
      }),
      this.prisma.conversationParticipant.update({
        where: {
          conversationId_userId: { conversationId, userId },
        },
        data: { readAt: now },
      }),
    ]);

    const dto: MessageDto = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    };

    for (const p of conv.participants) {
      if (p.userId !== userId) {
        this.events.pushTo(p.userId, { conversationId, message: dto });
      }
    }

    return dto;
  }

  async markRead(
    schoolId: string,
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.assertParticipant(schoolId, conversationId, userId);

    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { readAt: new Date() },
    });
  }

  private async assertParticipant(
    schoolId: string,
    conversationId: string,
    userId: string,
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        schoolId: true,
        participants: { select: { userId: true } },
      },
    });
    if (conv?.schoolId !== schoolId) {
      throw new NotFoundException("Conversation not found");
    }
    if (!conv.participants.some((p) => p.userId === userId)) {
      throw new ForbiddenException("Not a participant");
    }
    return conv;
  }

  private async toConversationDto(
    c: ConversationListRow,
    userId: string,
  ): Promise<ConversationDto> {
    const other = c.participants.find((p) => p.userId !== userId);
    const me = c.participants.find((p) => p.userId === userId);
    if (!other || !me) {
      throw new Error(`malformed conversation ${c.id}`);
    }

    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId: c.id,
        senderId: { not: userId },
        ...(me.readAt ? { createdAt: { gt: me.readAt } } : {}),
      },
    });

    const last = c.messages[0];
    return {
      id: c.id,
      otherUser: {
        id: other.user.id,
        firstName: other.user.firstName,
        lastName: other.user.lastName,
        role: other.user.role,
      },
      lastMessage: last
        ? {
            id: last.id,
            body: last.body,
            senderId: last.senderId,
            createdAt: last.createdAt.toISOString(),
          }
        : null,
      unreadCount,
    };
  }
}

const DEFAULT_MESSAGE_PAGE_SIZE = 50;
const MAX_MESSAGE_PAGE_SIZE = 200;

const CONVERSATION_LIST_SELECT = {
  id: true,
  participants: {
    select: {
      userId: true,
      readAt: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  },
  messages: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: {
      id: true,
      body: true,
      senderId: true,
      createdAt: true,
    },
  },
} satisfies Prisma.ConversationSelect;

type ConversationListRow = Prisma.ConversationGetPayload<{
  select: typeof CONVERSATION_LIST_SELECT;
}>;
