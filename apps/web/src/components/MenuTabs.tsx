import { useEffect, useState } from "react";
import { resetMenuSection } from "../hooks/useMenuSectionCollapse";

interface Tab {
  id: string;
  title: string;
}

function clipLine() {
  const sticky = document.querySelector(".menu-tabs-sticky");
  if (!sticky) return 90;
  const tabs = sticky.querySelector(".menu-tabs");
  return tabs ? tabs.getBoundingClientRect().bottom + 8 : sticky.getBoundingClientRect().bottom;
}

function resolveActiveSection(titles: string[]) {
  const line = clipLine();
  let active = titles[0] ?? "";

  for (const title of titles) {
    const section = document.getElementById(title);
    if (!section) continue;
    if (section.getBoundingClientRect().top <= line) {
      active = title;
    }
  }

  return active;
}

function scrollToSection(title: string) {
  resetMenuSection(title);
  const section = document.getElementById(title);
  if (!section) return;

  const sticky = document.querySelector(".menu-tabs-sticky");
  const offset = sticky ? sticky.getBoundingClientRect().height + 22 + 16 : 100;
  const top = section.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function MenuTabs({ tabs }: { tabs: Tab[] }) {
  const titles = tabs.map((tab) => tab.title);
  const [active, setActive] = useState(titles[0] ?? "");

  useEffect(() => {
    setActive(resolveActiveSection(titles));
  }, [titles.join("|")]);

  useEffect(() => {
    let frame = 0;

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setActive(resolveActiveSection(titles));
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [titles.join("|")]);

  return (
    <div className="menu-tabs-sticky">
      <div className="menu-tabs" role="tablist" aria-label="Menu categorieën">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.title}
            className={active === tab.title ? "active" : ""}
            onClick={() => {
              setActive(tab.title);
              scrollToSection(tab.title);
            }}
          >
            {tab.title}
          </button>
        ))}
      </div>
    </div>
  );
}
