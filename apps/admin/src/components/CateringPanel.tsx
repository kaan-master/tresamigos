import { useState } from "react";
import type { CateringOrder, CateringSettings, SiteContent } from "@tresamigos/types";
import { CateringGuideView } from "./CateringGuideView";
import { CateringOrdersPanel } from "./CateringOrdersPanel";
import { CateringProductsPanel } from "./CateringProductsPanel";

type CateringView = "orders" | "products" | "guide";

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
  const [view, setView] = useState<CateringView>("orders");

  function updateSettings(settings: CateringSettings) {
    onContentChange({
      ...content,
      site: {
        ...content.site,
        catering: settings
      }
    });
  }

  return (
    <div className="catering-panel-shell">
      <nav className="catering-panel-nav" aria-label="Catering submenu">
        <button type="button" className={view === "orders" ? "is-active" : ""} onClick={() => setView("orders")}>
          <span>Bestellingen</span>
          {incomingCount > 0 ? <em>{incomingCount}</em> : null}
        </button>
        <button type="button" className={view === "products" ? "is-active" : ""} onClick={() => setView("products")}>
          <span>Producten & prijzen</span>
        </button>
        <button type="button" className={view === "guide" ? "is-active" : ""} onClick={() => setView("guide")}>
          <span>Werkwijze</span>
        </button>
      </nav>

      <div className="catering-panel-content">
        {view === "orders" ? (
          <CateringOrdersPanel orders={orders} onOrdersChange={onOrdersChange} isActive={isActive} />
        ) : null}
        {view === "products" ? (
          <CateringProductsPanel
            settings={content.site.catering}
            onSettingsChange={updateSettings}
            onSave={onSave}
            saving={saving}
          />
        ) : null}
        {view === "guide" ? <CateringGuideView /> : null}
      </div>
    </div>
  );
}
