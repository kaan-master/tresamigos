import type { PageMediaSlot } from "@tresamigos/types";

export function clampFocal(value: number, fallback = 50): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function pageMediaObjectPosition(slot?: Pick<PageMediaSlot, "focalPointX" | "focalPointY"> | null): string {
  const x = clampFocal(slot?.focalPointX ?? 50);
  const y = clampFocal(slot?.focalPointY ?? 50);
  return `${x}% ${y}%`;
}

export function pageMediaImgStyle(slot?: Pick<PageMediaSlot, "focalPointX" | "focalPointY"> | null) {
  return { objectPosition: pageMediaObjectPosition(slot) };
}

export function resolvePageMediaSrc(slot: PageMediaSlot | undefined, fallback: string): string {
  return slot?.src || fallback;
}
