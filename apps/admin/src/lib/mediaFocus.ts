export function clampFocal(value: number, fallback = 50): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function mediaFocusStyle(focalX: number, focalY: number): { objectPosition: string } {
  return {
    objectPosition: `${clampFocal(focalX)}% ${clampFocal(focalY)}%`
  };
}

export function mediaBackgroundPosition(focalX: number, focalY: number): string {
  return `${clampFocal(focalX)}% ${clampFocal(focalY)}%`;
}

/** Map pointer to focal % on an object-fit:contain image inside a container. */
export function focalFromContainImagePointer(input: {
  containerWidth: number;
  containerHeight: number;
  naturalWidth: number;
  naturalHeight: number;
  pointerX: number;
  pointerY: number;
  containerLeft: number;
  containerTop: number;
}): { x: number; y: number } {
  const { containerWidth, containerHeight, naturalWidth, naturalHeight } = input;
  if (!containerWidth || !containerHeight || !naturalWidth || !naturalHeight) {
    return { x: 50, y: 50 };
  }

  const scale = Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight);
  const drawnWidth = naturalWidth * scale;
  const drawnHeight = naturalHeight * scale;
  const offsetX = (containerWidth - drawnWidth) / 2;
  const offsetY = (containerHeight - drawnHeight) / 2;

  const localX = input.pointerX - input.containerLeft - offsetX;
  const localY = input.pointerY - input.containerTop - offsetY;

  const x = clampFocal((localX / drawnWidth) * 100);
  const y = clampFocal((localY / drawnHeight) * 100);
  return { x, y };
}
