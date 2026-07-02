import { useEffect, useMemo, useState } from "react";
import type { CateringOrder, CateringOrderStatus } from "@tresamigos/types";
import { CATERING_ORDER_STATUSES } from "@tresamigos/types";
import { api } from "../lib/api";
import {
  BOX_LABELS,
  formatConfiguration,
  formatEuro,
  formatEventDateTime,
  formatOrderType,
  INCOMING_STATUSES,
  isEventPast,
  isEventSoon,
  orderSummaryMeta,
  parseEventDate,
  STATUS_BADGE_CLASS,
  STATUS_LABELS
} from "../lib/cateringAdmin";
import { AdminFilterChips, AdminListRow, AdminSearchBar } from "./AdminListUi";

interface Props {
  orders: CateringOrder[];
  onOrdersChange: (orders: CateringOrder[]) => void;
  isActive?: boolean;
}

type DatePreset = "today" | "week" | "month" | "upcoming" | "all";
type ScopeFilter = "incoming" | "all";
type SortMode = "eventAsc" | "createdDesc";

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function orderMatchesDate(order: CateringOrder, preset: DatePreset) {
  if (preset === "all") return true;

  const reference = parseEventDate(order) || new Date(order.createdAt);
  if (!reference) return false;

  const now = new Date();
  const start = startOfDay(now);

  if (preset === "today") {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return reference >= start && reference < end;
  }

  if (preset === "week") {
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return reference >= weekStart && reference < weekEnd;
  }

  if (preset === "month") {
    const monthStart = new Date(start);
    monthStart.setDate(monthStart.getDate() - 29);
    const monthEnd = new Date(start);
    monthEnd.setDate(monthEnd.getDate() + 30);
    return reference >= monthStart && reference < monthEnd;
  }

  return reference >= start;
}

function sortOrders(orders: CateringOrder[], sortMode: SortMode) {
  return [...orders].sort((a, b) => {
    if (sortMode === "createdDesc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    const aEvent = parseEventDate(a)?.getTime() ?? 0;
    const bEvent = parseEventDate(b)?.getTime() ?? 0;
    return aEvent - bEvent;
  });
}

export function CateringOrdersPanel({ orders, onOrdersChange, isActive }: Props) {
  const [query, setQuery] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("upcoming");
  const [scope, setScope] = useState<ScopeFilter>("incoming");
  const [sortMode, setSortMode] = useState<SortMode>("eventAsc");
  const [showFilters, setShowFilters] = useState(false);
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<CateringOrderStatus>("nieuw");
  const [draftNotes, setDraftNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await api<{ orders: CateringOrder[] }>("/api/admin/catering-orders");
      onOrdersChange(data.orders);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bestellingen laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const interval = window.setInterval(() => void loadOrders(), 45_000);
    return () => window.clearInterval(interval);
  }, [isActive]);

  const sorted = useMemo(() => sortOrders(orders, sortMode), [orders, sortMode]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sorted.filter((order) => {
      if (!orderMatchesDate(order, datePreset)) return false;
      if (scope === "incoming" && !INCOMING_STATUSES.has(order.status)) return false;
      if (fulfillmentFilter !== "all" && order.fulfillment !== fulfillmentFilter) return false;
      if (!normalized) return true;

      const haystack = [
        order.orderNumber,
        order.name,
        order.email,
        order.phone,
        order.company,
        order.locationName,
        order.address,
        order.status,
        BOX_LABELS[order.boxId] || order.boxId,
        order.proteins.join(" "),
        order.toppings.join(" "),
        order.salsas.join(" "),
        order.diet.join(" "),
        order.notes,
        order.adminNotes,
        order.eventDate,
        order.eventTime,
        order.items.map((line) => line.name).join(" "),
        String(order.subtotalCents)
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [sorted, query, datePreset, scope, fulfillmentFilter]);

  const selected =
    filtered.find((order) => order.id === selectedId) || orders.find((order) => order.id === selectedId) || null;

  const incomingCount = orders.filter((order) => INCOMING_STATUSES.has(order.status)).length;

  function selectOrder(order: CateringOrder) {
    setSelectedId(order.id);
    setDraftStatus(order.status);
    setDraftNotes(order.adminNotes);
    setMessage("");
  }

  async function saveOrder(nextStatus = draftStatus, nextNotes = draftNotes) {
    if (!selected || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await api<CateringOrder>(`/api/admin/catering-orders/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          adminNotes: nextNotes
        })
      });
      onOrdersChange(orders.map((order) => (order.id === updated.id ? updated : order)));
      setDraftStatus(updated.status);
      setDraftNotes(updated.adminNotes);
      setMessage("Opgeslagen.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function quickStatus(status: CateringOrderStatus) {
    setDraftStatus(status);
    await saveOrder(status, draftNotes);
  }

  function printOrder() {
    window.print();
  }

  return (
    <div className="ta-master-detail catering-admin-layout">
      <div className="ta-list-pane">
        <div className="catering-orders-toolbar">
          <div>
            <strong>{incomingCount} inkomend</strong>
            <p className="ta-seo-hint">{loading ? "Laden…" : `${filtered.length} van ${orders.length} bestellingen`}</p>
          </div>
          <button className="ta-btn ta-btn-ghost" type="button" onClick={() => void loadOrders()} disabled={loading}>
            Ververs
          </button>
        </div>

        <AdminSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Zoek ordernummer, klant, event..."
          label="Zoeken"
        />

        <AdminFilterChips
          value={scope}
          onChange={(value) => setScope(value as ScopeFilter)}
          options={[
            { value: "incoming", label: `Inkomend (${incomingCount})` },
            { value: "all", label: "Alle orders" }
          ]}
        />

        <AdminFilterChips
          value={datePreset}
          onChange={(value) => setDatePreset(value as DatePreset)}
          options={[
            { value: "upcoming", label: "Komende events" },
            { value: "today", label: "Vandaag" },
            { value: "week", label: "Deze week" },
            { value: "all", label: "Alles" }
          ]}
        />

        <button className="catering-filters-toggle" type="button" onClick={() => setShowFilters((open) => !open)}>
          {showFilters ? "Minder filters" : "Meer filters"}
        </button>

        {showFilters ? (
          <div className="catering-filters-panel">
            <AdminFilterChips
              value={sortMode}
              onChange={(value) => setSortMode(value as SortMode)}
              options={[
                { value: "eventAsc", label: "Event: eerstvolgend" },
                { value: "createdDesc", label: "Nieuwste bestelling" }
              ]}
            />
            <AdminFilterChips
              value={fulfillmentFilter}
              onChange={setFulfillmentFilter}
              options={[
                { value: "all", label: "Afhalen & bezorgen" },
                { value: "pickup", label: "Afhalen" },
                { value: "delivery", label: "Bezorgen" }
              ]}
            />
          </div>
        ) : null}

        {message ? <p className="ta-seo-hint">{message}</p> : null}

        <div className="ta-list-scroll">
          {filtered.length ? (
            filtered.map((order) => (
              <AdminListRow
                key={order.id}
                title={`${order.orderNumber} · ${order.name}`}
                meta={`${orderSummaryMeta(order)} · ${formatOrderType(order)}`}
                badge={STATUS_LABELS[order.status]}
                badgeClassName={STATUS_BADGE_CLASS[order.status]}
                active={order.id === selectedId}
                onClick={() => selectOrder(order)}
              />
            ))
          ) : (
            <div className="ta-empty">{orders.length ? "Geen resultaten voor deze filters." : "Nog geen cateringbestellingen ontvangen."}</div>
          )}
        </div>
      </div>

      {selected ? (
        <div className="ta-detail-pane ta-fade-in catering-admin-detail" key={selected.id}>
          <div className="catering-admin-detail-head">
            <div>
              <p className="ta-seo-hint">{formatOrderType(selected)} · Besteld {new Date(selected.createdAt).toLocaleString("nl-NL")}</p>
              <h3 className="ta-section-title">{selected.orderNumber}</h3>
            </div>
            <span className={`ta-status ${STATUS_BADGE_CLASS[selected.status]}`}>{STATUS_LABELS[selected.status]}</span>
          </div>

          <div className={`catering-admin-event-card${isEventSoon(selected) ? " is-soon" : ""}${isEventPast(selected) ? " is-past" : ""}`}>
            <strong>{formatEventDateTime(selected)}</strong>
            <span>{selected.fulfillment === "pickup" ? "Afhalen" : "Bezorgen"}</span>
            <span>{selected.subtotalCents > 0 ? formatEuro(selected.subtotalCents) : `${selected.quantity} gasten`}</span>
          </div>

          <div className="catering-admin-quick-actions">
            {selected.status === "nieuw" ? (
              <button className="ta-btn ta-btn-primary" type="button" disabled={saving} onClick={() => void quickStatus("bevestigd")}>
                Bevestigen
              </button>
            ) : null}
            {selected.status === "bevestigd" ? (
              <button className="ta-btn ta-btn-primary" type="button" disabled={saving} onClick={() => void quickStatus("voorbereid")}>
                Start voorbereiding
              </button>
            ) : null}
            {selected.status === "voorbereid" ? (
              <button className="ta-btn ta-btn-primary" type="button" disabled={saving} onClick={() => void quickStatus("afgerond")}>
                Markeer afgerond
              </button>
            ) : null}
            {INCOMING_STATUSES.has(selected.status) ? (
              <button className="ta-btn ta-btn-danger" type="button" disabled={saving} onClick={() => void quickStatus("geannuleerd")}>
                Annuleren
              </button>
            ) : null}
            <button className="ta-btn ta-btn-ghost" type="button" onClick={printOrder}>
              Print bon
            </button>
          </div>

          <section className="catering-admin-section">
            <h4>Klant</h4>
            <div className="catering-admin-kv">
              <span>Naam</span>
              <strong>{selected.name}</strong>
              <span>E-mail</span>
              <strong>
                <a href={`mailto:${selected.email}`}>{selected.email}</a>
              </strong>
              <span>Telefoon</span>
              <strong>
                {selected.phone ? <a href={`tel:${selected.phone}`}>{selected.phone}</a> : "—"}
              </strong>
              <span>Bedrijf</span>
              <strong>{selected.company || "—"}</strong>
            </div>
          </section>

          <section className="catering-admin-section">
            <h4>Event & locatie</h4>
            <div className="catering-admin-kv">
              <span>Datum & tijd</span>
              <strong>{formatEventDateTime(selected)}</strong>
              <span>Afhandeling</span>
              <strong>{selected.fulfillment === "pickup" ? "Afhalen" : "Bezorgen"}</strong>
              <span>{selected.fulfillment === "pickup" ? "Afhaallocatie" : "Bezorgadres"}</span>
              <strong>{selected.fulfillment === "pickup" ? selected.locationName || "—" : selected.address || "—"}</strong>
            </div>
          </section>

          <section className="catering-admin-section">
            <h4>{selected.items.length ? `Producten (${selected.items.length})` : "Box & samenstelling"}</h4>
            {selected.items.length ? (
              <div className="catering-admin-lines">
                {selected.items.map((line) => (
                  <article key={line.id} className="catering-admin-line">
                    <strong>
                      {line.quantity}× {line.name}
                      {line.servings ? ` · ${line.servings} servings` : ""}
                    </strong>
                    <ul className="catering-admin-config">
                      {formatConfiguration(line).map((entry) => (
                        <li key={entry}>{entry}</li>
                      ))}
                    </ul>
                    <span className="catering-admin-line-price">{formatEuro(line.lineTotalCents)}</span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="catering-admin-kv">
                <span>Boxtype</span>
                <strong>{BOX_LABELS[selected.boxId] || selected.boxId}</strong>
                <span>Aantal gasten</span>
                <strong>{selected.quantity}</strong>
                <span>Eiwitten</span>
                <strong>{selected.proteins.join(", ") || "—"}</strong>
                <span>Toppings</span>
                <strong>{selected.toppings.join(", ") || "—"}</strong>
                <span>Salsa&apos;s</span>
                <strong>{selected.salsas.join(", ") || "—"}</strong>
                <span>Dieet</span>
                <strong>{selected.diet.join(", ") || "—"}</strong>
              </div>
            )}
            {selected.subtotalCents > 0 ? (
              <p className="catering-admin-total">
                Subtotaal: <strong>{formatEuro(selected.subtotalCents)}</strong>
              </p>
            ) : null}
          </section>

          {selected.notes ? (
            <section className="catering-admin-section">
              <h4>Klantopmerkingen</h4>
              <p className="catering-admin-note">{selected.notes}</p>
            </section>
          ) : null}

          <section className="catering-admin-section">
            <h4>Beheer</h4>
            <div className="ta-grid">
              <label className="ta-field">
                <span>Status</span>
                <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as CateringOrderStatus)}>
                  {CATERING_ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ta-field ta-grid-wide">
                <span>Interne notities</span>
                <textarea rows={4} value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} placeholder="Bijv. contact gehad, allergieën, aanpassingen..." />
              </label>
            </div>
            <div className="ta-toolbar" style={{ marginTop: 12 }}>
              <button className="ta-btn ta-btn-primary" type="button" disabled={saving} onClick={() => void saveOrder()}>
                {saving ? "Opslaan…" : "Opslaan"}
              </button>
            </div>
          </section>
        </div>
      ) : (
        <div className="ta-detail-pane ta-empty">
          <strong>Selecteer een bestelling</strong>
          <p>Kies links een order om klantgegevens, producten en status te bekijken.</p>
        </div>
      )}
    </div>
  );
}
