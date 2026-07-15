import { useEffect } from "react";
import { dismissSiteBoot, waitForPageImages } from "../lib/waitForPageImages";

interface Options {
  /** Content is ready to render (or failed) — start watching images / reveal. */
  active: boolean;
  /** Skip image wait and reveal immediately (error state). */
  skipImages?: boolean;
}

export function useSiteBoot({ active, skipImages = false }: Options) {
  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    async function reveal() {
      if (!skipImages) {
        const root = document.getElementById("root");
        if (root) await waitForPageImages(root);
        try {
          await document.fonts.ready;
        } catch {
          /* ignore */
        }
      }

      if (!cancelled) dismissSiteBoot();
    }

    void reveal();
    return () => {
      cancelled = true;
    };
  }, [active, skipImages]);
}
