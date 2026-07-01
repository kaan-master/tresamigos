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
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.body.classList.remove("is-leaving");

    const observed = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
            observed.delete(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -4% 0px" }
    );

    const bind = () => {
      document.querySelectorAll(REVEAL_SELECTOR).forEach((element) => {
        element.classList.remove("in-view");
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
