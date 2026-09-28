import { useEffect, useMemo, useState } from "react";
import type { FranchiseInquiry, SiteContent } from "@tresamigos/types";
import { IconFranchise, IconFranchiseShop, IconProducts, IconUsers } from "./AdminIcons";
import { AdminListRow, AdminSearchBar } from "./AdminListUi";
import { FranchiseShopPanel, type FranchiseShopView } from "./FranchiseShopPanel";
import { EntraShell, type EntraNavItem } from "./telling/entraUi";

export type FranchiseView = "aanvragen" | "producten" | "accounts" | "bestellingen";

interface Props {
  inquiries: FranchiseInquiry[];
  content: SiteContent;
  initialView?: FranchiseView | null;
}

const NAV: Array<EntraNavItem<FranchiseView>> = [
  { id: "aanvragen", label: "Aanvragen", hint: "Website-aanmeldingen", Icon: IconFranchise, section: "Aanmeldingen" },
  { id: "producten", label: "Producten", hint: "Catalogus en prijzen", Icon: IconProducts, section: "Shop" },
  { id: "accounts", label: "Accounts", hint: "Inlog voor houders", Icon: IconUsers, section: "Shop" },
  { id: "bestellingen", label: "Bestellingen", hint: "Orders, factuur en pakbon", Icon: IconFranchiseShop, section: "Shop" }
];

const TITLES: Record<FranchiseView, { title: string; subtitle: string }> = {
  aanvragen: { title: "Aanvragen", subtitle: "Inkomende franchise-aanvragen van de website" },
  producten: { title: "Producten", subtitle: "Catalogus en prijzen per vestiging voor franchisehouders" },
  accounts: { title: "Accounts", subtitle: "Inlogaccounts voor de franchise shop (/franchise/login)" },
  bestellingen: { title: "Bestellingen", subtitle: "Orders beheren, factuur en pakbon printen" }
};

const SHOP_VIEW: Record<Exclude<FranchiseView, "aanvragen">, FranchiseShopView> = {
  producten: "products",
  accounts: "accounts",
  bestellingen: "orders"
};

function FranchiseInquiriesPanel({ inquiries }: { inquiries: FranchiseInquiry[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...inquiries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [inquiries]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sorted;
    return sorted.filter((inquiry) => {
      const haystack = [
        inquiry.name,
        inquiry.email,
        inquiry.phone,
        inquiry.address,
        inquiry.desiredLocation,
        inquiry.currentRole,
        inquiry.company,
        inquiry.investment,
        inquiry.financing,
        inquiry.visitedLocation,
        inquiry.status
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [sorted, query]);

  const selected =
    filtered.find((inquiry) => inquiry.id === selectedId) ||
    sorted.find((inquiry) => inquiry.id === selectedId) ||
    null;

  return (
    <div className="ta-master-detail">
      <div className="ta-list-pane">
        <AdminSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Zoek naam, e-mail, locatie..."
          label="Franchise-aanvragen zoeken"
        />
        <p className="ta-seo-hint" style={{ margin: "0 0 10px" }}>
          {filtered.length} van {inquiries.length} aanvragen
        </p>
        <div className="ta-list-scroll">
          {filtered.length ? (
            filtered.map((inquiry) => (
              <AdminListRow
                key={inquiry.id}
                title={inquiry.name}
                meta={`${inquiry.desiredLocation || "Geen locatie"} · ${new Date(inquiry.createdAt).toLocaleString("nl-NL")}`}
                badge={inquiry.status}
                active={inquiry.id === selectedId}
                onClick={() => setSelectedId(inquiry.id)}
              />
            ))
          ) : (
            <div className="ta-empty">{inquiries.length ? "Geen resultaten." : "Nog geen franchise-aanvragen."}</div>
          )}
        </div>
      </div>

      {selected ? (
        <div className="ta-detail-pane ta-fade-in" key={selected.id}>
          <div className="ta-toolbar ta-toolbar-spread">
            <h3 className="ta-section-title">{selected.name}</h3>
            <span className="ta-status">{selected.status}</span>
          </div>
          <div className="ta-grid">
            <label className="ta-field">
              <span>Datum</span>
              <input readOnly value={new Date(selected.createdAt).toLocaleString("nl-NL")} />
            </label>
            <label className="ta-field">
              <span>E-mail</span>
              <input readOnly value={selected.email} />
            </label>
            <label className="ta-field">
              <span>Telefoon</span>
              <input readOnly value={selected.phone || "-"} />
            </label>
            <label className="ta-field">
              <span>Huidig adres</span>
              <input readOnly value={selected.address || "-"} />
            </label>
            <label className="ta-field">
              <span>Gewenste locatie</span>
              <input readOnly value={selected.desiredLocation || "-"} />
            </label>
            <label className="ta-field">
              <span>Huidige functie</span>
              <input readOnly value={selected.currentRole || "-"} />
            </label>
            <label className="ta-field">
              <span>Bedrijf</span>
              <input readOnly value={selected.company || "-"} />
            </label>
            <label className="ta-field">
              <span>Investeringsbereik</span>
              <input readOnly value={selected.investment || "-"} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Financiering</span>
              <input readOnly value={selected.financing || "-"} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Vestiging bezocht</span>
              <input readOnly value={selected.visitedLocation || "-"} />
            </label>
            <label className="ta-field">
              <span>Voorwaarden geaccepteerd</span>
              <input readOnly value={selected.termsAccepted ? "Ja" : "Nee"} />
            </label>
          </div>
        </div>
      ) : (
        <div className="ta-detail-pane">
          <div className="ta-empty">Selecteer een aanvraag om details te zien.</div>
        </div>
      )}
    </div>
  );
}

export function FranchisePanel({ inquiries, content, initialView }: Props) {
  const [view, setView] = useState<FranchiseView>(initialView || "aanvragen");
  const copy = TITLES[view];

  useEffect(() => {
    if (initialView) setView(initialView);
  }, [initialView]);

  return (
    <div data-quiet-skip="">
      <EntraShell brand="Franchise" items={NAV} view={view} onChange={setView} title={copy.title} subtitle={copy.subtitle}>
        {view === "aanvragen" ? <FranchiseInquiriesPanel inquiries={inquiries} /> : null}
        {view !== "aanvragen" ? <FranchiseShopPanel content={content} view={SHOP_VIEW[view]} /> : null}
      </EntraShell>
    </div>
  );
}
