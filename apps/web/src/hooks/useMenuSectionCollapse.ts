import { useEffect } from "react";

const STICKY_TOP = 22;

function syncSticky() {
  const sticky = document.querySelector<HTMLElement>(".menu-tabs-sticky");
  if (!sticky) return null;

  const stickyRect = sticky.getBoundingClientRect();
  sticky.classList.toggle("is-stuck", stickyRect.top <= STICKY_TOP + 0.5);

  const tabs = sticky.querySelector<HTMLElement>(".menu-tabs");
  return tabs ? tabs.getBoundingClientRect().bottom : stickyRect.bottom;
}

function syncSections() {
  const line = syncSticky();
  if (line === null) return;

  document.querySelectorAll<HTMLElement>(".menu-section").forEach((section) => {
    const inner = section.querySelector<HTMLElement>(".menu-section-inner");
    if (!inner) return;

    const rect = section.getBoundingClientRect();

    if (rect.bottom <= line) {
      inner.style.opacity = "0";
      inner.style.clipPath = "none";
      inner.style.pointerEvents = "none";
      return;
    }

    if (rect.top >= line) {
      inner.style.opacity = "1";
      inner.style.clipPath = "none";
      inner.style.pointerEvents = "";
      return;
    }

    const clipTop = Math.max(0, line - rect.top);
    inner.style.opacity = "1";
    inner.style.clipPath = `inset(${clipTop}px 0 0 0)`;
    inner.style.pointerEvents = "";
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
      document.querySelector(".menu-tabs-sticky")?.classList.remove("is-stuck");
    };
  }, []);
}

export function resetMenuSection(sectionId: string) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const inner = section.querySelector<HTMLElement>(".menu-section-inner");
  if (inner) {
    inner.style.opacity = "";
    inner.style.clipPath = "";
    inner.style.pointerEvents = "";
  }
}
