import type { ComponentType, SVGProps } from "react";
import { useAdminTablet } from "../../context/AdminTabletContext";

export interface AdminTabletHubItem {
  id: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: number;
  tone?: "yellow" | "blue" | "green" | "red" | "brand";
}

interface Props {
  items: AdminTabletHubItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  variant?: "page" | "menu";
}

const TONES = ["yellow", "blue", "green", "red", "brand"] as const;

export function AdminTabletHub({ items, activeId, onSelect, variant = "page" }: Props) {
  const { setMenuOpen, openPanel } = useAdminTablet();

  function pick(id: string) {
    setMenuOpen(false);
    onSelect(id);
    openPanel();
  }

  const rootClass = variant === "menu" ? "ta-tile-grid ta-tile-grid-menu" : "ta-tile-hub";

  return (
    <div className={rootClass}>
      {variant === "page" ? (
        <div className="ta-tile-hub-intro">
          <p className="ta-eyebrow">Dashboard</p>
          <h2>Kies een onderdeel</h2>
          <p>Grote tegels voor snelle navigatie op iPad of tablet.</p>
        </div>
      ) : null}

      <div className="ta-tile-grid">
        {items.map((item, index) => {
          const tone = item.tone || TONES[index % TONES.length];
          return (
            <button
              key={item.id}
              type="button"
              className={`ta-tile tone-${tone}${activeId === item.id ? " is-active" : ""}`}
              style={{ animationDelay: `${index * 45}ms` }}
              onClick={() => pick(item.id)}
            >
              <span className="ta-tile-icon">
                <item.Icon width={26} height={26} />
              </span>
              <strong>{item.label}</strong>
              {item.badge && item.badge > 0 ? <em className="ta-tile-badge">{item.badge}</em> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
