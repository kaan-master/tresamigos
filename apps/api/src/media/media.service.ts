import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import { join, relative } from "node:path";
import type { MediaAsset, MediaLibraryResponse } from "@tresamigos/types";

const MEDIA_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".mp4",
  ".webm",
  ".mov"
]);

@Injectable()
export class MediaService {
  private readonly assetsRoot = join(__dirname, "../../../assets");

  private uploadsDir() {
    return join(this.assetsRoot, "uploads");
  }

  private async walkSection(sectionDir: string, section: MediaAsset["section"], removable: boolean): Promise<MediaAsset[]> {
    const assetsRoot = this.assetsRoot;
    const assets: MediaAsset[] = [];

    async function walk(currentDir: string) {
      let entries: string[] = [];
      try {
        entries = await readdir(currentDir);
      } catch {
        return;
      }

      for (const entry of entries) {
        const fullPath = join(currentDir, entry);
        const info = await stat(fullPath);
        if (info.isDirectory()) {
          await walk(fullPath);
          continue;
        }

        const ext = entry.slice(entry.lastIndexOf(".")).toLowerCase();
        if (!MEDIA_EXTENSIONS.has(ext)) continue;

        const relativePath = relative(assetsRoot, fullPath).replace(/\\/g, "/");
        assets.push({
          url: `/assets/${relativePath}`,
          filename: entry,
          size: info.size,
          section,
          kind: [".mp4", ".webm", ".mov"].includes(ext) ? "video" : "image",
          removable
        });
      }
    }

    await walk(sectionDir);
    return assets.sort((left, right) => right.filename.localeCompare(left.filename));
  }

  async list(): Promise<MediaLibraryResponse> {
    await mkdir(this.uploadsDir(), { recursive: true });
    const [site, brand, uploads] = await Promise.all([
      this.walkSection(join(this.assetsRoot, "site"), "site", false),
      this.walkSection(join(this.assetsRoot, "brand"), "brand", false),
      this.walkSection(this.uploadsDir(), "uploads", true)
    ]);

    return { assets: [...uploads, ...site, ...brand] };
  }

  async registerUpload(filename: string, size: number): Promise<MediaAsset> {
    return {
      url: `/assets/uploads/${filename}`,
      filename,
      size,
      section: "uploads",
      kind: [".mp4", ".webm", ".mov"].includes(filename.slice(filename.lastIndexOf(".")).toLowerCase()) ? "video" : "image",
      removable: true
    };
  }

  async delete(url: string) {
    if (!url.startsWith("/assets/uploads/")) {
      throw new BadRequestException("Alleen geüploade bestanden kunnen worden verwijderd.");
    }

    const relativePath = url.replace(/^\/assets\//, "");
    const fullPath = join(this.assetsRoot, relativePath);
    try {
      await unlink(fullPath);
    } catch {
      throw new NotFoundException("Bestand niet gevonden.");
    }

    return { message: "Bestand verwijderd." };
  }

  getUploadsDir() {
    return this.uploadsDir();
  }
}
