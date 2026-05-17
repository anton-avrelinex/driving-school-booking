import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Sse,
  UseGuards,
} from "@nestjs/common";
import { map, type Observable } from "rxjs";
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from "@driving-school-booking/nestjs-auth";
import type { MessagingEvent } from "@driving-school-booking/shared-types";
import { MessagingService } from "./messaging.service";
import { MessagingEvents } from "./messaging.events";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { SendMessageDto } from "./dto/send-message.dto";

@Controller("conversations")
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(
    private readonly messaging: MessagingService,
    private readonly events: MessagingEvents,
  ) {}

  @Get()
  list(@Request() req: AuthenticatedRequest) {
    return this.messaging.listConversations(req.user.schoolId, req.user.sub);
  }

  @Get("recipients")
  recipients(@Request() req: AuthenticatedRequest) {
    return this.messaging.listRecipients(req.user.schoolId, req.user.sub);
  }

  @Post()
  create(
    @Body() dto: CreateConversationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.messaging.createOrFindConversation(
      req.user.schoolId,
      req.user.sub,
      dto.otherUserId,
    );
  }

  @Get(":id/messages")
  messages(
    @Param("id") id: string,
    @Query("before") before: string | undefined,
    @Query("limit") limit: string | undefined,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.messaging.listMessages(req.user.schoolId, id, req.user.sub, {
      before: before ? new Date(before) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post(":id/messages")
  send(
    @Param("id") id: string,
    @Body() dto: SendMessageDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.messaging.sendMessage(
      req.user.schoolId,
      id,
      req.user.sub,
      dto.body,
    );
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.messaging.markRead(req.user.schoolId, id, req.user.sub);
  }

  @Sse("events")
  events$(
    @Request() req: AuthenticatedRequest,
  ): Observable<{ data: MessagingEvent }> {
    const stream = this.events.subscribe(req.user.sub);
    return stream.asObservable().pipe(map((data) => ({ data })));
  }
}
