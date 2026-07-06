import { extname } from "node:path";
import sharp from "sharp";

const RASTER_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".avif", ".tif", ".tiff", ".webp"]);
const PASSTHROUGH_EXTENSIONS = new Set([".svg", ".mp4", ".webm", ".mov", ".ico"]);

function slugBase(originalName: string) {
  const withoutExtensions = originalName.replace(/\.[a-z0-9]+$/gi, "").replace(/\.[a-z0-9]+$/gi, "");
  return (
    withoutExtensions
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "upload"
  );
}

export async function processUploadedMedia(buffer: Buffer, originalName: string) {
  const ext = extname(originalName).toLowerCase();
  const slug = slugBase(originalName);
  const stamp = Date.now();

  if (PASSTHROUGH_EXTENSIONS.has(ext)) {
    return {
      buffer,
      filename: `${stamp}-${slug}${ext}`,
      size: buffer.length
    };
  }

  if (!RASTER_EXTENSIONS.has(ext)) {
    throw new Error("Bestandstype niet ondersteund. Gebruik JPG, PNG, WEBP, GIF of SVG.");
  }

  const webpBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer();

  return {
    buffer: webpBuffer,
    filename: `${stamp}-${slug}.webp`,
    size: webpBuffer.length
  };
}
