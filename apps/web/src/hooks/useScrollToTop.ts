import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Clear leftover scroll locks that can freeze scrolling after modals/nav. */
export function unlockDocumentScroll() {
  document.body.classList.remove(
    "nav-open",
    "catering-drawer-open",
    "catering-modal-open",
    "is-leaving"
  );
  document.body.style.removeProperty("position");
  document.body.style.removeProperty("top");
  document.body.style.removeProperty("left");
  document.body.style.removeProperty("right");
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("padding-right");
  document.body.style.removeProperty("touch-action");
  document.body.style.removeProperty("width");
  delete document.body.dataset.applicationOpen;
}

/**
 * Always start at the top on route change, and disable the browser restoring
 * the previous scroll position (which fights with SPAs on mobile).
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    unlockDocumentScroll();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);
}
