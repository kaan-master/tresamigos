/** Returns true when a media path looks like a video file. */
export function isVideoSrc(src: string | undefined | null) {
  if (!src) return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(src);
}
