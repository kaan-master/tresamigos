import type { ReactNode } from "react";
import { AdminTabletSearch } from "./AdminTabletSearch";
import { useAdminTablet } from "../../context/AdminTabletContext";
import type { AdminSearchItem } from "../../lib/adminTabletSearch";

interface Props {
  children: ReactNode;
  footer?: ReactNode;
  searchItems?: AdminSearchItem[];
  onSearchSelect?: (item: AdminSearchItem) => void;
}

export function AdminStartDock({ children, footer, searchItems, onSearchSelect }: Props) {
  const { enabled, menuOpen, toggleMenu, setMenuOpen } = useAdminTablet();

  if (!enabled) return null;

  return (
    <>
      {menuOpen ? (
        <button type="button" className="ta-start-backdrop" aria-label="Sluiten" onClick={() => setMenuOpen(false)} />
      ) : null}
      <div className={`ta-start-dock${menuOpen ? " is-open" : ""}`}>
        {menuOpen ? (
          <div className="ta-start-menu" role="dialog" aria-label="Startmenu">
            <header className="ta-start-menu-head">
              <strong>Startmenu</strong>
              <button type="button" className="ta-start-menu-close" onClick={() => setMenuOpen(false)}>
                Sluiten
              </button>
            </header>
            {searchItems && onSearchSelect ? (
              <AdminTabletSearch items={searchItems} onSelect={onSearchSelect} compact placeholder="Zoeken..." />
            ) : null}
            <div className="ta-start-menu-grid">{children}</div>
            {footer ? <footer className="ta-start-menu-foot">{footer}</footer> : null}
          </div>
        ) : null}
        <button type="button" className="ta-start-btn" onClick={toggleMenu} aria-expanded={menuOpen} aria-label="Startmenu">
          <span className="ta-start-btn-icon" aria-hidden="true" />
          <span>Start</span>
        </button>
      </div>
    </>
  );
}
