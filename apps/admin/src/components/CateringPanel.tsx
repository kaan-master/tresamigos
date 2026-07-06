import { useState } from "react";
import type { CateringOrder, CateringSettings, SiteContent } from "@tresamigos/types";
import { CateringCategoriesPanel } from "./catering/CateringCategoriesPanel";
import { CateringFormSettingsPanel } from "./catering/CateringFormSettingsPanel";
import { CateringGuideView } from "./CateringGuideView";
import { CateringNotificationsPanel } from "./catering/CateringNotificationsPanel";
import { CateringOverviewPanel } from "./catering/CateringOverviewPanel";
import { CateringOrdersPanel } from "./CateringOrdersPanel";
import { CateringProductsPanel } from "./catering/CateringProductsPanel";

type CateringView = "overview" | "orders" | "products" | "categories" | "form" | "notifications" | "guide";

interface Props {
  content: SiteContent;
  onContentChange: (content: SiteContent) => void;
  orders: CateringOrder[];
  onOrdersChange: (orders: CateringOrder[]) => void;
  isActive: boolean;
  incomingCount: number;
  onSave: () => void | Promise<void>;
  saving: boolean;
}

const NAV_ITEMS: { id: CateringView; label: string; icon: string; badge?: boolean }[] = [
  { id: "overview", label: "Overzicht", icon: "📊" },
  { id: "orders", label: "Bestellingen", icon: "📥", badge: true },
  { id: "products", label: "Producten", icon: "🌮" },
  { id: "categories", label: "Categorieën", icon: "📂" },
  { id: "form", label: "Formulier", icon: "📝" },
  { id: "notifications", label: "Meldingen", icon: "🔔" },
  { id: "guide", label: "Werkwijze", icon: "🧭" }
];

export function CateringPanel({
  content,
  onContentChange,
  orders,
  onOrdersChange,
  isActive,
  incomingCount,
  onSave,
  saving
}: Props) {
  const [view, setView] = useState<CateringView>("overview");
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  function updateSettings(settings: CateringSettings) {
    onContentChange({
      ...content,
      site: {
        ...content.site,
        catering: settings
      }
    });
  }

  function openOrders(orderId?: string) {
    if (orderId) setPendingOrderId(orderId);
    setView("orders");
  }

  const settingsProps = {
    settings: content.site.catering,
    onSettingsChange: updateSettings,
    onSave,
    saving
  };

  return (
    <div className="catering-panel-shell">
      <nav className="catering-panel-nav" aria-label="Catering submenu">
        {NAV_ITEMS.map((item) => (
          <button key={item.id} type="button" className={view === item.id ? "is-active" : ""} onClick={() => setView(item.id)}>
            <span className="catering-panel-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
            {item.badge && incomingCount > 0 ? <em>{incomingCount}</em> : null}
          </button>
        ))}
      </nav>

      <div className="catering-panel-content">
        {view === "overview" ? (
          <CateringOverviewPanel orders={orders} onOpenOrders={() => openOrders()} onSelectOrder={(orderId) => openOrders(orderId)} />
        ) : null}
        {view === "orders" ? (
          <CateringOrdersPanel
            orders={orders}
            onOrdersChange={onOrdersChange}
            isActive={isActive}
            initialSelectedId={pendingOrderId}
          />
        ) : null}
        {view === "products" ? <CateringProductsPanel {...settingsProps} /> : null}
        {view === "categories" ? <CateringCategoriesPanel {...settingsProps} /> : null}
        {view === "form" ? <CateringFormSettingsPanel {...settingsProps} /> : null}
        {view === "notifications" ? <CateringNotificationsPanel {...settingsProps} /> : null}
        {view === "guide" ? <CateringGuideView /> : null}
      </div>
    </div>
  );
}
