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

const DELETABLE_PREFIXES = ["/assets/uploads/", "/assets/catering/"];

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
    return assets;
  }

  async list(): Promise<MediaLibraryResponse> {
    await mkdir(UPLOADS_DIR, { recursive: true });

    const sectionSpecs: Array<{
      dir: string;
      section: MediaAsset["section"];
      removable: boolean;
      root: string;
    }> = [
      { dir: join(ASSETS_ROOT, "site"), section: "site", removable: false, root: ASSETS_ROOT },
      { dir: join(ASSETS_ROOT, "brand"), section: "brand", removable: false, root: ASSETS_ROOT },
      { dir: join(ASSETS_ROOT, "catering"), section: "catering", removable: true, root: ASSETS_ROOT },
      { dir: join(ASSETS_ROOT, "menu"), section: "menu", removable: false, root: ASSETS_ROOT },
      { dir: UPLOADS_DIR, section: "uploads", removable: true, root: ASSETS_ROOT },
      { dir: join(PUBLIC_ASSETS_ROOT, "site"), section: "site", removable: false, root: PUBLIC_ASSETS_ROOT },
      { dir: join(PUBLIC_ASSETS_ROOT, "brand"), section: "brand", removable: false, root: PUBLIC_ASSETS_ROOT },
      { dir: join(PUBLIC_ASSETS_ROOT, "catering"), section: "catering", removable: true, root: PUBLIC_ASSETS_ROOT },
      { dir: join(PUBLIC_ASSETS_ROOT, "menu"), section: "menu", removable: false, root: PUBLIC_ASSETS_ROOT }
    ];

    const batches = await Promise.all(
      sectionSpecs.map((spec) => this.walkSection(spec.dir, spec.section, spec.removable, spec.root))
    );

    const merged = new Map<string, MediaAsset>();
    // Prefer removable entries when the same URL appears in both roots.
    for (const asset of batches.flat()) {
      const previous = merged.get(asset.url);
      if (!previous || (asset.removable && !previous.removable)) {
        merged.set(asset.url, asset);
      }
    }

    const assets = [...merged.values()].sort((left, right) => {
      const sectionCmp = left.section.localeCompare(right.section);
      if (sectionCmp !== 0) return sectionCmp;
      return left.filename.localeCompare(right.filename);
    });

    return { assets };
  }

  async registerUpload(filename: string, size: number): Promise<MediaAsset> {
    return {
      url: `/assets/uploads/${filename}`,
      filename,
      size,
      section: "uploads",
      kind: [".mp4", ".webm", ".mov"].includes(filename.slice(filename.lastIndexOf(".")).toLowerCase())
        ? "video"
        : "image",
      removable: true
    };
  }

  async delete(url: string) {
    if (!DELETABLE_PREFIXES.some((prefix) => url.startsWith(prefix))) {
      throw new BadRequestException("Alleen uploads en cateringbestanden kunnen worden verwijderd.");
    }

    const relativePath = url.replace(/^\/assets\//, "");
    const candidates = [join(ASSETS_ROOT, relativePath), join(PUBLIC_ASSETS_ROOT, relativePath)];
    let removed = false;

    for (const fullPath of candidates) {
      try {
        await unlink(fullPath);
        removed = true;
      } catch {
        // try next root
      }
    }

    if (!removed) {
      throw new NotFoundException("Bestand niet gevonden.");
    }

    return { message: "Bestand verwijderd." };
  }

  getUploadsDir() {
    return UPLOADS_DIR;
  }
}
