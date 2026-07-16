import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const REVEAL_SELECTOR = [
  ".hero",
  ".page-head",
  ".section",
  ".card",
  ".product-card",
  ".order-card",
  ".location-card",
  ".photo-block",
  ".map",
  ".notice",
  ".feature-card",
  ".location-preview",
  ".menu-showcase",
  ".accent-card",
  ".compact-menu-item",
  ".portrait-video-card",
  ".hero-card",
  ".showcase-panel",
  ".brand-strip",
  ".catering-landing",
  ".catering-page"
].join(", ");

export function usePageMotion() {
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("animate-ready");
    return () => {
      document.documentElement.classList.remove("animate-ready");
    };
  }, []);

  useEffect(() => {
    const observed = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Any visible pixel counts — tall sections (e.g. full menu) never reach 10% on phones.
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
            observed.delete(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -8px 0px" }
    );

    const revealNow = (element: Element) => {
      element.classList.add("in-view");
      observer.unobserve(element);
      observed.delete(element);
    };

    const bind = () => {
      const viewportH = window.innerHeight || 1;

      document.querySelectorAll(REVEAL_SELECTOR).forEach((element) => {
        element.classList.remove("in-view");
        // Tall blocks can't meet percentage thresholds on small screens — show immediately.
        if (element.getBoundingClientRect().height > viewportH * 0.85) {
          revealNow(element);
          return;
        }
        observer.observe(element);
        observed.add(element);
      });

      document.querySelectorAll(".hero-copy, .page-head .shell").forEach((element) => {
        element.classList.remove("in-view");
        observer.observe(element);
        observed.add(element);
      });
    };

    const frame = window.requestAnimationFrame(bind);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      observed.clear();
    };
  }, [location.pathname]);
}
