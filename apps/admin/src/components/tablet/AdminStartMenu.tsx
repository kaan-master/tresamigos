import type { AdminSessionUser, CateringOrder } from "@tresamigos/types";
import { IconLogout, IconSearch } from "../AdminIcons";
import { useAdminTablet } from "../../context/AdminTabletContext";
import { filterSearchItems, type AdminSearchItem } from "../../lib/adminTabletSearch";
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

const TONES = ["yellow", "blue", "green", "red", "brand", "yellow"] as const;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diff / 60_000));
  if (mins < 60) return `${mins} min geleden`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} uur geleden`;
  const days = Math.floor(hours / 24);
  return `${days} dag${days === 1 ? "" : "en"} geleden`;
}

function userInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function AdminStartMenu({
  hubItems,
  activeId,
  onSelectTab,
  searchItems,
  onSearchSelect,
  user,
  onLogout,
  recentOrders,
  onOpenOrders,
  onOpenOrder
}: Props) {
  const { searchQuery, setSearchQuery, setMenuOpen, openPanel, goHub } = useAdminTablet();

  const q = searchQuery.trim().toLowerCase();
  const pinnedItems = q ? hubItems.filter((item) => item.label.toLowerCase().includes(q)) : hubItems;
  const searchResults = q ? filterSearchItems(searchItems, searchQuery).slice(0, 6) : [];

  function pickTab(id: string) {
    setMenuOpen(false);
    onSelectTab(id);
    openPanel();
  }

  function pickSearch(item: AdminSearchItem) {
    onSearchSelect(item);
    setSearchQuery("");
    setMenuOpen(false);
  }

  function pickOrder(orderId: string) {
    setMenuOpen(false);
    onOpenOrder(orderId);
    openPanel();
  }

  return (
    <div className="ta-win-start" role="dialog" aria-label="Startmenu" onClick={(event) => event.stopPropagation()}>
      <div className="ta-win-start-search">
        <IconSearch width={18} height={18} />
        <input
          type="search"
          value={searchQuery}
          placeholder="Zoek apps, instellingen en bestellingen"
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label="Zoeken"
          autoComplete="off"
        />
        {searchQuery ? (
          <button type="button" className="ta-win-start-search-clear" onClick={() => setSearchQuery("")} aria-label="Wissen">
            ×
          </button>
        ) : null}
      </div>

      {searchResults.length ? (
        <section className="ta-win-start-section">
          <header className="ta-win-start-section-head">
            <h3>Zoekresultaten</h3>
          </header>
          <ul className="ta-win-start-search-list">
            {searchResults.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => pickSearch(item)}>
                  <strong>{item.label}</strong>
                  <span>{item.group}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <section className="ta-win-start-section">
            <header className="ta-win-start-section-head">
              <h3>Vastgezet</h3>
              <button type="button" className="ta-win-start-link" onClick={() => { setMenuOpen(false); goHub(); }}>
                Alles
              </button>
            </header>
            <div className="ta-win-pinned-grid">
              {pinnedItems.map((item, index) => {
                const tone = item.tone || TONES[index % TONES.length];
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`ta-win-app${activeId === item.id ? " is-active" : ""}`}
                    onClick={() => pickTab(item.id)}
                  >
                    <span className={`ta-win-app-icon tone-${tone}`}>
                      <item.Icon width={28} height={28} />
                    </span>
                    <span className="ta-win-app-label">{item.label}</span>
                    {item.badge && item.badge > 0 ? <em className="ta-win-app-badge">{item.badge}</em> : null}
                  </button>
                );
              })}
            </div>
            {!pinnedItems.length ? <p className="ta-win-start-empty">Geen onderdelen gevonden.</p> : null}
          </section>

          <section className="ta-win-start-section">
            <header className="ta-win-start-section-head">
              <h3>Aanbevolen</h3>
              <button type="button" className="ta-win-start-link" onClick={() => { setMenuOpen(false); onOpenOrders(); openPanel(); }}>
                Meer
              </button>
            </header>
            {recentOrders.length ? (
              <div className="ta-win-recommended-grid">
                {recentOrders.map((order) => (
                  <button key={order.id} type="button" className="ta-win-recommended-item" onClick={() => pickOrder(order.id)}>
                    <span className="ta-win-recommended-icon" aria-hidden="true">
                      {order.orderNumber.slice(-2)}
                    </span>
                    <span className="ta-win-recommended-copy">
                      <strong>{order.orderNumber}</strong>
                      <span>
                        {order.name} · {timeAgo(order.createdAt)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="ta-win-start-empty">Nog geen recente bestellingen.</p>
            )}
          </section>
        </>
      )}

      <footer className="ta-win-start-foot">
        <div className="ta-win-start-user">
          <span className="ta-win-start-avatar" aria-hidden="true">
            {user ? userInitials(user.name) : "?"}
          </span>
          <div>
            <strong>{user?.name || "Gebruiker"}</strong>
            <span>{user?.role === "master" ? "Beheerder" : user?.email || ""}</span>
          </div>
        </div>
        <button type="button" className="ta-win-start-power" onClick={onLogout} aria-label="Uitloggen">
          <IconLogout width={18} height={18} />
        </button>
      </footer>
    </div>
  );
}
