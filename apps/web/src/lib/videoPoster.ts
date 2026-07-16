/** Derive a static poster path from a video src (same basename, .jpg). */
export function videoPosterUrl(src: string) {
  return src.replace(/\.(mp4|webm|mov)(\?.*)?$/i, ".jpg$2");
}
