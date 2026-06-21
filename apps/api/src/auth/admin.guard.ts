import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { AuthService } from "./auth.service";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      adminSession?: Awaited<ReturnType<AuthService["getSession"]>>;
    }>();
    const auth = request.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const session = await this.authService.getSession(token);
    if (!session) throw new UnauthorizedException({ message: "Login vereist." });
    request.adminSession = session;
    return true;
  }
}
