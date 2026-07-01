import { resetMenuSection } from "../hooks/useMenuSectionCollapse";

interface Tab {
  id: string;
  title: string;
}

export function MenuTabs({ tabs }: { tabs: Tab[] }) {
  return (
    <div className="menu-tabs-sticky">
      <div className="menu-tabs">
        {tabs.map((tab) => (
          <a href={`#${tab.title}`} key={tab.id} onClick={() => resetMenuSection(tab.title)}>
            {tab.title}
          </a>
        ))}
      </div>
    </div>
  );
}
