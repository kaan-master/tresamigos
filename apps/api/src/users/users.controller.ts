import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import type { CreateAdminUserInput, UpdateAdminUserInput } from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { UsersService } from "./users.service";

@Controller("api/admin/users")
@UseGuards(AdminGuard, PermissionsGuard)
@RequirePermissions("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list() {
    return this.usersService.list().then((users) => ({ users }));
  }

  @Post()
  async create(@Body() body: CreateAdminUserInput) {
    try {
      const user = await this.usersService.create(body);
      return { user, message: "Gebruiker aangemaakt." };
    } catch (error) {
      throw new HttpException(
        { message: error instanceof Error ? error.message : "Aanmaken mislukt." },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: UpdateAdminUserInput) {
    try {
      const user = await this.usersService.update(id, body);
      return { user, message: "Gebruiker bijgewerkt." };
    } catch (error) {
      throw new HttpException(
        { message: error instanceof Error ? error.message : "Bijwerken mislukt." },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
