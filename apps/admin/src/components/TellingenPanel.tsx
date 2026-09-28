import { useEffect, useMemo, useState } from "react";
import { formatStoreCode, type Location } from "@tresamigos/types";
import { IconChart, IconDownload, IconList, IconProductChart, IconProducts, IconTellingen, IconUsers } from "./AdminIcons";
import { EMPTY_TELLING_FILTERS, mergeTellingFilters, type TellingenOverviewFilters } from "../lib/tellingFilters";
import { EntraShell, type EntraNavItem } from "./telling/entraUi";
import { TellingenChartsPanel } from "./telling/TellingenChartsPanel";
import { TellingenExportPanel } from "./telling/TellingenExportPanel";
import { TellingenListsPanel } from "./telling/TellingenListsPanel";
import { TellingenOverviewPanel } from "./telling/TellingenOverviewPanel";
import { TellingenProductChartsPanel } from "./telling/TellingenProductChartsPanel";
import { TellingenProductsPanel } from "./telling/TellingenProductsPanel";
import { TellingenStaffPanel } from "./telling/TellingenStaffPanel";

export type TellingenView = "overview" | "charts" | "product-charts" | "lists" | "users" | "products" | "export";

const NAV: Array<EntraNavItem<TellingenView>> = [
  { id: "overview", label: "Overzicht", hint: "Alle tellingen", Icon: IconTellingen },
  { id: "charts", label: "Grafieken", hint: "Tellingen per dag en winkel", Icon: IconChart },
  { id: "product-charts", label: "Productgrafieken", hint: "Aantallen per product", Icon: IconProductChart },
  { id: "lists", label: "Lijsten", hint: "Start- en sluitlijsten", Icon: IconList },
  { id: "users", label: "Gebruikers", hint: "Inlognummers en winkels", Icon: IconUsers },
  { id: "products", label: "Producten", hint: "Catalogus beheren", Icon: IconProducts },
  { id: "export", label: "Export", hint: "CSV en Excel", Icon: IconDownload }
];

const TITLES: Record<TellingenView, { title: string; subtitle: string }> = {
  overview: { title: "Overzicht", subtitle: "Ochtend- en avondtellingen per winkel en lijst" },
  charts: { title: "Grafieken", subtitle: "Klik op een staaf of segment om het overzicht te filteren" },
  "product-charts": { title: "Productgrafieken", subtitle: "Aantallen per product — klik door naar het overzicht" },
  lists: { title: "Lijsten", subtitle: "Kies welke producten in start- of sluitlijst komen" },
  users: { title: "Gebruikers", subtitle: "Inlognummers, winkels en status" },
  products: { title: "Producten", subtitle: "Titels per lijst toevoegen, verplaatsen of verwijderen" },
  export: { title: "Export", subtitle: "Download de gefilterde set als CSV of Excel" }
};

interface Props {
  locations: Location[];
  initialView?: string | null;
  onViewChange?: (view: TellingenView) => void;
}

export function TellingenPanel({ locations, initialView, onViewChange }: Props) {
  const [view, setView] = useState<TellingenView>(
    initialView && NAV.some((item) => item.id === initialView) ? (initialView as TellingenView) : "overview"
  );
  const [overviewFilters, setOverviewFilters] = useState<TellingenOverviewFilters>(EMPTY_TELLING_FILTERS);
  const copy = TITLES[view];
  const stores = useMemo(
    () =>
      [...locations].sort(
        (a, b) => formatStoreCode(a.code).localeCompare(formatStoreCode(b.code)) || a.name.localeCompare(b.name, "nl")
      ),
    [locations]
  );

  useEffect(() => {
    if (initialView && NAV.some((item) => item.id === initialView)) {
      setView(initialView as TellingenView);
    }
  }, [initialView]);

  function changeView(next: TellingenView) {
    setView(next);
    onViewChange?.(next);
  }

  function openOverview(patch: Partial<TellingenOverviewFilters>) {
    setOverviewFilters(mergeTellingFilters(patch));
    changeView("overview");
  }

  return (
    <div data-quiet-skip="">
      <EntraShell brand="Tellingen" items={NAV} view={view} onChange={changeView} title={copy.title} subtitle={copy.subtitle}>
      {view === "overview" ? (
        <TellingenOverviewPanel locations={stores} filters={overviewFilters} onFiltersChange={setOverviewFilters} />
      ) : null}
      {view === "charts" ? <TellingenChartsPanel locations={stores} onOpenOverview={openOverview} /> : null}
      {view === "product-charts" ? <TellingenProductChartsPanel locations={stores} onOpenOverview={openOverview} /> : null}
      {view === "lists" ? <TellingenListsPanel /> : null}
      {view === "users" ? <TellingenStaffPanel locations={stores} /> : null}
      {view === "products" ? <TellingenProductsPanel /> : null}
      {view === "export" ? <TellingenExportPanel locations={stores} /> : null}
    </EntraShell>
    </div>
  );
}
