import type { AdminSessionUser, CateringOrder } from "@tresamigos/types";
import { AdminStartMenu } from "./AdminStartMenu";
import { useAdminTablet } from "../../context/AdminTabletContext";
import type { AdminSearchItem } from "../../lib/adminTabletSearch";
import type { AdminTabletHubItem } from "./AdminTabletHub";

interface Props {
  hubItems: AdminTabletHubItem[];
  activeId?: string;
  onSelectTab: (id: string) => void;
  searchItems: AdminSearchItem[];
  onSearchSelect: (item: AdminSearchItem) => void;
  user: AdminSessionUser | null;
  onLogout: () => void;
  recentOrders: CateringOrder[];
  onOpenOrders: () => void;
  onOpenOrder: (orderId: string) => void;
}

export function AdminStartDock(props: Props) {
  const { enabled, menuOpen, toggleMenu, setMenuOpen } = useAdminTablet();

  if (!enabled) return null;

  return (
    <>
      {menuOpen ? (
        <button type="button" className="ta-start-backdrop" aria-label="Sluiten" onClick={() => setMenuOpen(false)} />
      ) : null}

      {menuOpen ? (
        <div className="ta-start-overlay">
          <AdminStartMenu {...props} />
        </div>
      ) : null}

      <div className={`ta-start-dock${menuOpen ? " is-open" : ""}`}>
        <button type="button" className="ta-start-btn" onClick={toggleMenu} aria-expanded={menuOpen} aria-label="Startmenu">
          <span className="ta-start-btn-icon" aria-hidden="true" />
          <span>Start</span>
        </button>
      </div>
    </>
  );
}
