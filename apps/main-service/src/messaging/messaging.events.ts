import { Injectable, Logger } from "@nestjs/common";
import { Subject } from "rxjs";
import type { MessagingEvent } from "@driving-school-booking/shared-types";

@Injectable()
export class MessagingEvents {
  private readonly logger = new Logger(MessagingEvents.name);
  private readonly streams = new Map<string, Subject<MessagingEvent>>();

  subscribe(userId: string): Subject<MessagingEvent> {
    let stream = this.streams.get(userId);
    if (!stream) {
      stream = new Subject<MessagingEvent>();
      this.streams.set(userId, stream);
    }
    return stream;
  }

  unsubscribe(userId: string): void {
    const stream = this.streams.get(userId);
    if (stream && !stream.observed) {
      stream.complete();
      this.streams.delete(userId);
    }
  }

  pushTo(userId: string, event: MessagingEvent): void {
    const stream = this.streams.get(userId);
    if (stream) {
      stream.next(event);
    } else {
      this.logger.debug(`no active stream for user ${userId}; event dropped`);
    }
  }
}
