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
import { join } from "node:path";
import { AdminGuard } from "../auth/admin.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { UPLOADS_DIR } from "../paths";
import { processUploadedMedia } from "./imageProcessing";
import { MediaService } from "./media.service";

@Controller("api/admin/media")
@UseGuards(AdminGuard, PermissionsGuard)
@RequirePermissions("media")
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

    let processed;
    try {
      processed = await processUploadedMedia(file.buffer, file.originalname);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "Afbeelding verwerken mislukt.");
    }

    await mkdir(UPLOADS_DIR, { recursive: true });
    await writeFile(join(UPLOADS_DIR, processed.filename), processed.buffer);
    const asset = await this.mediaService.registerUpload(processed.filename, processed.size);
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
