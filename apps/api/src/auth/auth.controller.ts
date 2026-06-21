import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Ip,
  Post
} from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("api/admin")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() body: { email?: string; password?: string }, @Ip() ip: string) {
    const allowed = await this.authService.checkRateLimit(ip);
    if (!allowed) {
      throw new HttpException({ message: "Te veel pogingen. Probeer later opnieuw." }, HttpStatus.TOO_MANY_REQUESTS);
    }

    const password = String(body?.password || "");
    const result = await this.authService.login(body?.email, password);
    if (!result) {
      throw new HttpException({ message: "Login mislukt." }, HttpStatus.UNAUTHORIZED);
    }

    return result;
  }

  @Get("me")
  async me(@Headers("authorization") authorization = "") {
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    const session = await this.authService.getSession(token);
    if (!session) {
      throw new HttpException({ message: "Login vereist." }, HttpStatus.UNAUTHORIZED);
    }
    return { user: this.authService.toSessionUser(session) };
  }

  @Post("logout")
  async logout(@Headers("authorization") authorization = "") {
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    await this.authService.logout(token);
    return { message: "Uitgelogd." };
  }
}
