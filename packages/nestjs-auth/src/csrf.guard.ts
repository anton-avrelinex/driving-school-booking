import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";

export const CSRF_TOKEN_COOKIE = "csrfToken";
export const CSRF_TOKEN_HEADER = "x-csrf-token";

const EXEMPT_PATHS = new Set(["/api/auth/login", "/api/auth/refresh"]);

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(req.method)) {
      return true;
    }
    if (EXEMPT_PATHS.has(req.path)) {
      return true;
    }

    const cookies = req.cookies as
      | Record<string, string | undefined>
      | undefined;
    const cookie = cookies?.[CSRF_TOKEN_COOKIE];
    const header = req.headers[CSRF_TOKEN_HEADER];
    const headerValue = Array.isArray(header) ? header[0] : header;

    if (!cookie || !headerValue || cookie !== headerValue) {
      throw new ForbiddenException("Invalid CSRF token");
    }
    return true;
  }
}
