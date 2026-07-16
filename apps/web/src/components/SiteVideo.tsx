import { useAutoplayInView } from "../hooks/useAutoplayInView";
import type { ReactNode } from "react";

type Props = {
  src?: string;
  className?: string;
  poster?: string;
  /** Block site-boot until this clip can play (hero only). */
  bootCritical?: boolean;
  /** Never block boot (below-fold / carousels). */
  bootDefer?: boolean;
  preload?: "none" | "metadata" | "auto";
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
  children?: ReactNode;
};

/**
 * Site video: muted loop, preload metadata by default, pause when off-screen.
 */
export function SiteVideo({
  src,
  className,
  poster,
  bootCritical,
  bootDefer,
  preload = "metadata",
  children,
  ...aria
}: Props) {
  const ref = useAutoplayInView<HTMLVideoElement>();

  return (
    <video
      ref={ref}
      className={className}
      src={children ? undefined : src}
      poster={poster}
      muted
      loop
      playsInline
      preload={preload}
      controls={false}
      disablePictureInPicture
      data-boot-critical={bootCritical ? "1" : undefined}
      data-boot-defer={bootDefer ? "1" : undefined}
      {...aria}
    >
      {children}
    </video>
  );
}
