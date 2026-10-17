import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AdminGuard } from "../auth/admin.guard";
import type { AdminSessionPayload } from "../auth/auth.service";
import { RequirePermissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { TasksService, type TodoActor } from "./tasks.service";

type AdminRequest = { adminSession?: AdminSessionPayload | null };

function actor(req: AdminRequest): TodoActor {
  const session = req.adminSession;
  return { id: session?.userId ?? null, name: session?.name || "Beheerder" };
}

@Controller("api/admin/tasks")
@UseGuards(AdminGuard, PermissionsGuard)
@RequirePermissions("todo")
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list() {
    return this.tasks.list();
  }

  @Get("customers")
  customers() {
    return this.tasks.listCustomers();
  }

  @Post("customers")
  createCustomer(@Body() body: { companyName?: unknown; city?: unknown }) {
    return this.tasks.createCustomer(body);
  }

  @Post("boards")
  createBoard(@Body() body: { name?: unknown }) {
    return this.tasks.createBoard(body);
  }

  @Post("boards/reorder")
  reorderBoards(@Body() body: { orderedIds?: unknown }) {
    return this.tasks.reorderBoards(body);
  }

  @Patch("boards/:id")
  patchBoard(@Param("id") id: string, @Body() body: { name?: unknown; grouped?: unknown; starred?: unknown; columns?: unknown }) {
    return this.tasks.patchBoard(id, body);
  }

  @Delete("boards/:id")
  deleteBoard(@Param("id") id: string) {
    return this.tasks.deleteBoard(id);
  }

  @Post("categories")
  createCategory(@Body() body: { name?: unknown; color?: unknown; boardId?: unknown }) {
    return this.tasks.createCategory(body);
  }

  @Post("categories/reorder")
  reorderCategories(@Body() body: { boardId?: unknown; orderedIds?: unknown }) {
    return this.tasks.reorderCategories(body);
  }

  @Patch("categories/:id")
  patchCategory(@Param("id") id: string, @Body() body: { name?: unknown; color?: unknown }) {
    return this.tasks.patchCategory(id, body);
  }

  @Delete("categories/:id")
  deleteCategory(@Param("id") id: string) {
    return this.tasks.deleteCategory(id);
  }

  @Post()
  create(@Body() body: { boardId?: unknown; categoryId?: unknown; title?: unknown }) {
    return this.tasks.createTask(body);
  }

  @Post("reorder")
  reorder(@Body() body: { boardId?: unknown; items?: unknown }) {
    return this.tasks.reorderTasks(body);
  }

  @Patch(":id")
  patch(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.tasks.patchTask(id, body);
  }

  @Get(":id/activity")
  activity(@Param("id") id: string) {
    return this.tasks.activity(id);
  }

  @Post(":id/comments")
  comment(@Param("id") id: string, @Body() body: { body?: unknown }, @Req() req: AdminRequest) {
    return this.tasks.addComment(id, body, actor(req));
  }

  @Delete(":id/comments/:commentId")
  deleteComment(@Param("id") id: string, @Param("commentId") commentId: string) {
    return this.tasks.deleteComment(id, commentId);
  }

  @Post(":id/files")
  upload(@Param("id") id: string, @Body() body: { name?: unknown; mime?: unknown; data?: unknown }, @Req() req: AdminRequest) {
    return this.tasks.addFile(id, body, actor(req));
  }

  @Get(":id/files/:fileId")
  async download(@Param("id") id: string, @Param("fileId") fileId: string, @Res() res: Response) {
    const file = await this.tasks.readFile(id, fileId);
    res.setHeader("Content-Type", file.mime);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.send(Buffer.from(file.data));
  }

  @Delete(":id/files/:fileId")
  deleteFile(@Param("id") id: string, @Param("fileId") fileId: string) {
    return this.tasks.deleteFile(id, fileId);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tasks.deleteTask(id);
  }
}
