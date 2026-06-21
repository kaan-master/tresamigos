import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AdminTabId } from "@tresamigos/types";
import { AuthService } from "./auth.service";
import { PERMISSIONS_KEY } from "./permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminTabId[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{ adminSession?: Awaited<ReturnType<AuthService["getSession"]>> }>();
    const session = request.adminSession;
    if (!this.authService.hasAnyPermission(session || null, required)) {
      throw new ForbiddenException({ message: "Geen toegang tot deze actie." });
    }
    return true;
  }
}
