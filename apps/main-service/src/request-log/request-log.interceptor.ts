import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Observable, tap } from "rxjs";
import { Request, Response } from "express";
import {
  OBS_LOGS_QUEUE,
  LOG_TYPES,
  SERVICES,
  type RequestLogDto,
} from "@driving-school-booking/shared-types";

@Injectable()
export class RequestLogInterceptor implements NestInterceptor {
  constructor(@InjectQueue(OBS_LOGS_QUEUE) private readonly logQueue: Queue) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const pushLog = (statusCode: number) => {
      const user = request.user as
        | { sub: string; schoolId: string }
        | undefined;
      const log: RequestLogDto = {
        type: LOG_TYPES.REQUEST,
        service: SERVICES.MAIN,
        method: request.method,
        path: request.originalUrl,
        statusCode,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
        userId: user?.sub ?? null,
        schoolId: user?.schoolId ?? null,
      };
      void this.logQueue.add(LOG_TYPES.REQUEST, log);
    };

    return next.handle().pipe(
      tap({
        next: () => pushLog(response.statusCode),
        error: (err: unknown) => {
          const status = err instanceof HttpException ? err.getStatus() : 500;
          pushLog(status);
        },
      }),
    );
  }
}
