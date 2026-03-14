import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthenticatedRequest } from "./authenticated-request.interface";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>("roles", context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Partial<AuthenticatedRequest>>();

    return roles.includes(request.user?.role ?? "");
  }
}
