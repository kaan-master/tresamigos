import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { FranchiseShopAuthService } from "./franchise-shop-auth.service";

@Injectable()
export class FranchiseShopGuard implements CanActivate {
  constructor(private readonly auth: FranchiseShopAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      franchiseSession?: Awaited<ReturnType<FranchiseShopAuthService["getSession"]>>;
    }>();
    const auth = request.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const session = await this.auth.getSession(token);
    if (!session) throw new UnauthorizedException({ message: "Franchise login vereist." });
    request.franchiseSession = session;
    return true;
  }
}
