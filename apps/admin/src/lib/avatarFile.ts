const RASTER = /image\/(png|jpeg|jpg|webp|gif)/i;
const EXT = /\.(png|jpe?g|webp|gif)$/i;

/** Verkleint een foto tot een PNG- of JPEG-data-URL voor het kanbanbord. */
export async function readAvatarFile(file: File): Promise<string> {
  if (!RASTER.test(file.type) && !EXT.test(file.name)) {
    throw new Error("Gebruik een PNG-, JPEG-, WebP- of GIF-bestand.");
  }
  if (file.size > 12_000_000) {
    throw new Error("Foto is te groot. Gebruik een bestand van maximaal 12 MB.");
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("Deze foto kan niet worden gelezen. Probeer PNG of JPEG.");
  try {
    let edge = 320;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Deze foto kan niet worden gelezen.");
      ctx.drawImage(bitmap, 0, 0, width, height);
      const jpeg = canvas.toDataURL("image/jpeg", 0.86);
      if (/^data:image\/jpeg;base64,/.test(jpeg) && jpeg.length <= 900_000) return jpeg;
      edge = Math.round(edge * 0.7);
    }
    throw new Error("Foto is te groot na verkleinen. Gebruik een eenvoudiger afbeelding.");
  } finally {
    bitmap.close?.();
  }
}
