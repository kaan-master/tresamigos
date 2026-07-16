import { useEffect, useRef } from "react";

type Options = {
  /** Only autoplay when at least this fraction is visible. */
  threshold?: number;
  /** Start paused until in view (default true). */
  rootMargin?: string;
};

/**
 * Play muted looping videos only while (mostly) in the viewport.
 * Pauses decoding off-screen to reduce scroll jank and CPU/GPU load.
 */
export function useAutoplayInView<T extends HTMLVideoElement>(options?: Options) {
  const ref = useRef<T | null>(null);
  const threshold = options?.threshold ?? 0.35;
  const rootMargin = options?.rootMargin ?? "80px 0px";

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    const playSafe = () => {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        try {
          video.load();
        } catch {
          /* ignore */
        }
      }
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => undefined);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold * 0.5) {
            playSafe();
          } else {
            video.pause();
          }
        }
      },
      { threshold: [0, threshold], rootMargin }
    );

    io.observe(video);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}
