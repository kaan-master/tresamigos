import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { AdminGuard } from "../auth/admin.guard";
import { UPLOADS_DIR } from "../paths";
import { MediaService } from "./media.service";

function safeFilename(originalName: string) {
  const ext = extname(originalName).toLowerCase();
  const base = originalName
    .replace(ext, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${Date.now()}-${base || "upload"}${ext || ".jpg"}`;
}

@Controller("api/admin/media")
@UseGuards(AdminGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  list() {
    return this.mediaService.list();
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 40 * 1024 * 1024 } }))
  async upload(@UploadedFile() file?: { originalname: string; buffer: Buffer; size: number }) {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Geen bestand ontvangen.");
    }

    await mkdir(UPLOADS_DIR, { recursive: true });
    const filename = safeFilename(file.originalname);
    await writeFile(join(UPLOADS_DIR, filename), file.buffer);
    const asset = await this.mediaService.registerUpload(filename, file.size);
    return { asset, message: "Upload voltooid." };
  }

  @Delete()
  remove(@Body() body: { url?: string }) {
    if (!body?.url) {
      throw new BadRequestException("URL is verplicht.");
    }
    return this.mediaService.delete(body.url);
  }
}
