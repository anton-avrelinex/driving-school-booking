import { Module } from "@nestjs/common";
import { MessagingController } from "./messaging.controller";
import { MessagingService } from "./messaging.service";
import { MessagingEvents } from "./messaging.events";

@Module({
  controllers: [MessagingController],
  providers: [MessagingService, MessagingEvents],
})
export class MessagingModule {}
