import { useEffect } from "react";

const FADE_PX = 96;
const MIN_OPACITY = 0.18;

function tabsBottomLine() {
  const tabs = document.querySelector(".menu-tabs");
  return tabs ? tabs.getBoundingClientRect().bottom : 104;
}

function syncSections() {
  const line = tabsBottomLine();

  document.querySelectorAll<HTMLElement>(".menu-section").forEach((section) => {
    const inner = section.querySelector<HTMLElement>(".menu-section-inner");
    if (!inner) return;

    const rect = section.getBoundingClientRect();
    const overlap = line - rect.top;

    if (overlap <= 0) {
      inner.style.opacity = "1";
      inner.style.maskImage = "none";
      inner.style.webkitMaskImage = "none";
      return;
    }

    if (rect.bottom <= line) {
      const passed = line - rect.bottom;
      const opacity = Math.max(MIN_OPACITY, 1 - passed / FADE_PX);
      inner.style.opacity = String(opacity);
      inner.style.maskImage = "none";
      inner.style.webkitMaskImage = "none";
      return;
    }

    const fadeEnd = Math.min(rect.height, overlap + FADE_PX);
    const gradient = `linear-gradient(to bottom, transparent 0px, transparent ${overlap}px, black ${fadeEnd}px)`;
    inner.style.opacity = "1";
    inner.style.maskImage = gradient;
    inner.style.webkitMaskImage = gradient;
  });
}

export function useMenuSectionCollapse() {
  useEffect(() => {
    let frame = 0;

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        syncSections();
      });
    }

    syncSections();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", syncSections);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", syncSections);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
}

export function resetMenuSection(sectionId: string) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const inner = section.querySelector<HTMLElement>(".menu-section-inner");
  if (inner) {
    inner.style.opacity = "";
    inner.style.maskImage = "";
    inner.style.webkitMaskImage = "";
  }
}
