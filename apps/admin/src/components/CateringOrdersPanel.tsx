import { useMemo, useState } from "react";
import type { CateringOrder, CateringOrderStatus } from "@tresamigos/types";
import { CATERING_ORDER_STATUSES } from "@tresamigos/types";
import { api } from "../lib/api";
import { AdminFilterChips, AdminListRow, AdminSearchBar } from "./AdminListUi";

interface Props {
  orders: CateringOrder[];
  onOrdersChange: (orders: CateringOrder[]) => void;
}

type DatePreset = "today" | "week" | "month" | "all";
type ScopeFilter = "incoming" | "all";

const BOX_LABELS: Record<string, string> = {
  "burrito-box": "Burrito Box",
  "bowl-box": "Bowl & Salad Box",
  "quesadilla-box": "Quesadilla Box",
  "taco-box": "Taco Box"
};

const STATUS_LABELS: Record<CateringOrderStatus, string> = {
  nieuw: "Nieuw",
  bevestigd: "Bevestigd",
  voorbereid: "In voorbereiding",
  afgerond: "Afgerond",
  geannuleerd: "Geannuleerd"
};

const INCOMING_STATUSES = new Set<CateringOrderStatus>(["nieuw", "bevestigd", "voorbereid"]);

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function orderMatchesDate(order: CateringOrder, preset: DatePreset) {
  if (preset === "all") return true;
  const created = new Date(order.createdAt);
  const now = new Date();
  const start = startOfDay(now);

  if (preset === "today") {
    return created >= start;
  }

  if (preset === "week") {
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - 6);
    return created >= weekStart;
  }

  const monthStart = new Date(start);
  monthStart.setDate(monthStart.getDate() - 29);
  return created >= monthStart;
}

export function CateringOrdersPanel({ orders, onOrdersChange }: Props) {
  const [query, setQuery] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [scope, setScope] = useState<ScopeFilter>("incoming");
  const [boxFilter, setBoxFilter] = useState("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<CateringOrderStatus>("nieuw");
  const [draftNotes, setDraftNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const sorted = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sorted.filter((order) => {
      if (!orderMatchesDate(order, datePreset)) return false;
      if (scope === "incoming" && !INCOMING_STATUSES.has(order.status)) return false;
      if (boxFilter !== "all" && order.boxId !== boxFilter) return false;
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
        order.eventTime
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [sorted, query, datePreset, scope, boxFilter, fulfillmentFilter]);

  const selected =
    filtered.find((order) => order.id === selectedId) || sorted.find((order) => order.id === selectedId) || null;

  function selectOrder(order: CateringOrder) {
    setSelectedId(order.id);
    setDraftStatus(order.status);
    setDraftNotes(order.adminNotes);
    setMessage("");
  }

  async function saveOrder() {
    if (!selected || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await api<CateringOrder>(`/api/admin/catering-orders/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: draftStatus,
          adminNotes: draftNotes
        })
      });
      onOrdersChange(orders.map((order) => (order.id === updated.id ? updated : order)));
      setMessage("Opgeslagen.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  const incomingCount = sorted.filter((order) => INCOMING_STATUSES.has(order.status)).length;

  return (
    <div className="ta-master-detail">
      <div className="ta-list-pane">
        <AdminSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Zoek ordernummer, klant, adres..."
          label="Cateringbestellingen zoeken"
        />

        <AdminFilterChips
          value={datePreset}
          onChange={(value) => setDatePreset(value as DatePreset)}
          options={[
            { value: "today", label: "Vandaag" },
            { value: "week", label: "Deze week" },
            { value: "month", label: "Deze maand" },
            { value: "all", label: "Alles" }
          ]}
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
          value={boxFilter}
          onChange={setBoxFilter}
          options={[
            { value: "all", label: "Alle boxen" },
            ...Object.entries(BOX_LABELS).map(([value, label]) => ({ value, label }))
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

        <p className="ta-seo-hint" style={{ margin: "0 0 10px" }}>
          {filtered.length} van {orders.length} bestellingen
        </p>

        <div className="ta-list-scroll">
          {filtered.length ? (
            filtered.map((order) => (
              <AdminListRow
                key={order.id}
                title={`${order.orderNumber} · ${order.name}`}
                meta={`${BOX_LABELS[order.boxId] || order.boxId} · ${order.quantity} gasten · ${new Date(order.createdAt).toLocaleString("nl-NL")}`}
                badge={STATUS_LABELS[order.status]}
                active={order.id === selectedId}
                onClick={() => selectOrder(order)}
              />
            ))
          ) : (
            <div className="ta-empty">{orders.length ? "Geen resultaten." : "Nog geen cateringbestellingen ontvangen."}</div>
          )}
        </div>
      </div>

      {selected ? (
        <div className="ta-detail-pane ta-fade-in" key={selected.id}>
          <div className="ta-toolbar ta-toolbar-spread">
            <h3 className="ta-section-title">{selected.orderNumber}</h3>
            <span className="ta-status">{STATUS_LABELS[selected.status]}</span>
          </div>

          <div className="ta-grid">
            <label className="ta-field">
              <span>Klant</span>
              <input readOnly value={selected.name} />
            </label>
            <label className="ta-field">
              <span>Besteld op</span>
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
              <span>Bedrijf</span>
              <input readOnly value={selected.company || "-"} />
            </label>
            <label className="ta-field">
              <span>Boxtype</span>
              <input readOnly value={BOX_LABELS[selected.boxId] || selected.boxId} />
            </label>
            <label className="ta-field">
              <span>Aantal gasten</span>
              <input readOnly value={String(selected.quantity)} />
            </label>
            <label className="ta-field">
              <span>Datum & tijd event</span>
              <input readOnly value={`${selected.eventDate} ${selected.eventTime}`} />
            </label>
            <label className="ta-field">
              <span>Afhandeling</span>
              <input readOnly value={selected.fulfillment === "pickup" ? "Afhalen" : "Bezorgen"} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>{selected.fulfillment === "pickup" ? "Afhaallocatie" : "Bezorgadres"}</span>
              <textarea
                readOnly
                rows={2}
                value={selected.fulfillment === "pickup" ? selected.locationName || "-" : selected.address || "-"}
              />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Eiwitten & vullingen</span>
              <input readOnly value={selected.proteins.join(", ") || "-"} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Toppings</span>
              <input readOnly value={selected.toppings.join(", ") || "-"} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Salsa&apos;s</span>
              <input readOnly value={selected.salsas.join(", ") || "-"} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Dieetopties</span>
              <input readOnly value={selected.diet.join(", ") || "-"} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Klantopmerkingen</span>
              <textarea readOnly rows={3} value={selected.notes || "-"} />
            </label>
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
              <textarea rows={4} value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} />
            </label>
          </div>

          <div className="ta-toolbar" style={{ marginTop: 12 }}>
            <button className="ta-btn ta-btn-primary" type="button" disabled={saving} onClick={() => void saveOrder()}>
              {saving ? "Opslaan…" : "Status opslaan"}
            </button>
            {message ? <span className="ta-seo-hint">{message}</span> : null}
          </div>
        </div>
      ) : (
        <div className="ta-detail-pane ta-empty">Selecteer een cateringbestelling om details te bekijken.</div>
      )}
    </div>
  );
}
