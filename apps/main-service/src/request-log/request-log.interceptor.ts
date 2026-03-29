import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Observable, tap } from "rxjs";
import { Request, Response } from "express";
import {
  REQUEST_LOG_QUEUE,
  type RequestLogDto,
} from "@driving-school-booking/shared-types";

@Injectable()
export class RequestLogInterceptor implements NestInterceptor {
  constructor(
    @InjectQueue(REQUEST_LOG_QUEUE) private readonly logQueue: Queue,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        const user = request.user as
          | { sub: string; schoolId: string }
          | undefined;
        const log: RequestLogDto = {
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs: Date.now() - start,
          timestamp: new Date().toISOString(),
          userId: user?.sub ?? null,
          schoolId: user?.schoolId ?? null,
        };

        void this.logQueue.add("log", log);
      }),
    );
  }
}
