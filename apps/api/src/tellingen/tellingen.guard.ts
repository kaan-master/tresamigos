import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { TellingenAuthService } from "./tellingen-auth.service";

@Injectable()
export class TellingStaffGuard implements CanActivate {
  constructor(private readonly auth: TellingenAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      tellingSession?: Awaited<ReturnType<TellingenAuthService["getSession"]>>;
    }>();
    const auth = request.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const session = await this.auth.getSession(token);
    if (!session) throw new UnauthorizedException({ message: "Login vereist." });
    request.tellingSession = session;
    return true;
  }
}
