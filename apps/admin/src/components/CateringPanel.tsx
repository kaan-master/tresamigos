import { useState } from "react";
import type { CateringOrder, CateringSettings, SiteContent } from "@tresamigos/types";
import { CateringCategoriesPanel } from "./catering/CateringCategoriesPanel";
import { CateringFormSettingsPanel } from "./catering/CateringFormSettingsPanel";
import { CateringFulfillmentPanel } from "./catering/CateringFulfillmentPanel";
import { CateringGuideView } from "./CateringGuideView";
import { CateringIngredientsPanel } from "./catering/CateringIngredientsPanel";
import { CateringNotificationsPanel } from "./catering/CateringNotificationsPanel";
import { CateringOverviewPanel } from "./catering/CateringOverviewPanel";
import { CateringOrdersPanel } from "./CateringOrdersPanel";
import { CateringProductsPanel } from "./catering/CateringProductsPanel";
import { CateringSubmoduleNav } from "./catering/CateringSubmoduleNav";
import type { CateringView } from "./catering/cateringNav";

interface Props {
  content: SiteContent;
  onContentChange: (content: SiteContent) => void;
  orders: CateringOrder[];
  onOrdersChange: (orders: CateringOrder[]) => void;
  isActive: boolean;
  newOrderCount: number;
  onSave: () => void | Promise<void>;
  saving: boolean;
}

export function CateringPanel({
  content,
  onContentChange,
  orders,
  onOrdersChange,
  isActive,
  newOrderCount,
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
      <CateringSubmoduleNav view={view} newOrderCount={newOrderCount} onChange={setView} />

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
        {view === "ingredients" ? <CateringIngredientsPanel {...settingsProps} /> : null}
        {view === "form" ? <CateringFormSettingsPanel {...settingsProps} /> : null}
        {view === "fulfillment" ? <CateringFulfillmentPanel {...settingsProps} /> : null}
        {view === "notifications" ? <CateringNotificationsPanel {...settingsProps} /> : null}
        {view === "guide" ? <CateringGuideView /> : null}
      </div>
    </div>
  );
}
