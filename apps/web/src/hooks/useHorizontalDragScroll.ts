import { useEffect, useRef } from "react";

/**
 * Horizontal carousel that never blocks vertical page scroll on mobile.
 * Browser handles pan-y; we drive pan-x via pointer drag when the gesture is mostly horizontal.
 */
export function useHorizontalDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const track = ref.current;
    if (!track) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let startScroll = 0;
    let axis: "undecided" | "x" | "y" = "undecided";
    let dragged = false;

    const end = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      axis = "undecided";
      try {
        track.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startScroll = track.scrollLeft;
      axis = "undecided";
      dragged = false;
    };

    const onMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (axis === "undecided") {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (axis === "x") {
          track.setPointerCapture(event.pointerId);
        }
      }

      if (axis !== "x") return;

      dragged = true;
      event.preventDefault();
      track.scrollLeft = startScroll - dx;
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    };

    track.addEventListener("pointerdown", onDown);
    track.addEventListener("pointermove", onMove, { passive: false });
    track.addEventListener("pointerup", end);
    track.addEventListener("pointercancel", end);
    track.addEventListener("click", onClickCapture, true);

    return () => {
      track.removeEventListener("pointerdown", onDown);
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", end);
      track.removeEventListener("pointercancel", end);
      track.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return ref;
}
