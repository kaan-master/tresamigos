import {
  Body,
  Controller,
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
  async login(@Body() body: { password?: string }, @Ip() ip: string) {
    const allowed = await this.authService.checkRateLimit(ip);
    if (!allowed) {
      throw new HttpException({ message: "Te veel pogingen. Probeer later opnieuw." }, HttpStatus.TOO_MANY_REQUESTS);
    }

    const password = String(body?.password || "");
    const token = await this.authService.login(password);
    if (!token) {
      throw new HttpException({ message: "Login mislukt." }, HttpStatus.UNAUTHORIZED);
    }

    return { token };
  }
}
