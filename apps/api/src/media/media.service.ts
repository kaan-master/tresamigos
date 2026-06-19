import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import { join, relative } from "node:path";
import type { MediaAsset, MediaLibraryResponse } from "@tresamigos/types";
import { ASSETS_ROOT, PUBLIC_ASSETS_ROOT, UPLOADS_DIR } from "../paths";

const MEDIA_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".mp4",
  ".webm",
  ".mov",
  ".ico"
]);

@Injectable()
export class MediaService {
  private async walkSection(
    sectionDir: string,
    section: MediaAsset["section"],
    removable: boolean,
    assetsRoot: string
  ): Promise<MediaAsset[]> {
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
    await mkdir(UPLOADS_DIR, { recursive: true });
    const [site, brand, uploads, publicSite, publicBrand] = await Promise.all([
      this.walkSection(join(ASSETS_ROOT, "site"), "site", false, ASSETS_ROOT),
      this.walkSection(join(ASSETS_ROOT, "brand"), "brand", false, ASSETS_ROOT),
      this.walkSection(UPLOADS_DIR, "uploads", true, ASSETS_ROOT),
      this.walkSection(join(PUBLIC_ASSETS_ROOT, "site"), "site", false, PUBLIC_ASSETS_ROOT),
      this.walkSection(join(PUBLIC_ASSETS_ROOT, "brand"), "brand", false, PUBLIC_ASSETS_ROOT)
    ]);

    const merged = new Map<string, MediaAsset>();
    for (const asset of [...uploads, ...site, ...brand, ...publicSite, ...publicBrand]) {
      merged.set(asset.url, asset);
    }

    return { assets: [...merged.values()] };
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
    const fullPath = join(ASSETS_ROOT, relativePath);
    try {
      await unlink(fullPath);
    } catch {
      throw new NotFoundException("Bestand niet gevonden.");
    }

    return { message: "Bestand verwijderd." };
  }

  getUploadsDir() {
    return UPLOADS_DIR;
  }
}
