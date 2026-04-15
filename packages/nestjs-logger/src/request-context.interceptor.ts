import { AsyncLocalStorage } from "node:async_hooks";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Request } from "express";
import { Observable, type Subscriber } from "rxjs";

export interface RequestContext {
  userId: string | null;
  schoolId: string | null;
}

export const RequestContextStore = new AsyncLocalStorage<RequestContext>();

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const user = (req as Request & { user?: { sub: string; schoolId: string } })
      .user;

    const reqContext: RequestContext = {
      userId: user?.sub ?? null,
      schoolId: user?.schoolId ?? null,
    };

    return new Observable((subscriber: Subscriber<unknown>) => {
      RequestContextStore.run(reqContext, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
