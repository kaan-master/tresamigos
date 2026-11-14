import { useEffect, useState } from "react";
import {
  FRANCHISE_SHOP_DEVIATION_KIND_LABELS,
  FRANCHISE_SHOP_DEVIATION_KINDS,
  FRANCHISE_SHOP_ORDER_CHANNEL_LABELS,
  FRANCHISE_SHOP_ORDER_HAPPY_PATH,
  FRANCHISE_SHOP_ORDER_STATUS_COLORS,
  FRANCHISE_SHOP_ORDER_STATUS_LABELS,
  emptyFranchiseShopOrderFlow,
  franchiseShopOrderActions,
  franchiseShopOrderQuestion,
  type FranchiseShopDeviationKind,
  type FranchiseShopOrder,
  type FranchiseShopOrderAction,
  type FranchiseShopOrderActionDef
} from "@tresamigos/types";
import { StatusChip, StatusDot } from "./StatusCombo";

type Props = {
  order: FranchiseShopOrder;
  busy?: boolean;
  onAction: (input: {
    action: FranchiseShopOrderAction;
    note?: string;
    deviationKind?: FranchiseShopDeviationKind | "";
  }) => void;
};

function toneClass(tone: FranchiseShopOrderActionDef["tone"]) {
  if (tone === "yes") return "ta-btn ta-btn-primary";
  if (tone === "no") return "ta-btn ta-btn-secondary";
  if (tone === "danger") return "ta-btn ta-btn-danger";
  return "ta-btn";
}

export function FranchiseOrderWorkflow({ order, busy, onAction }: Props) {
  const [note, setNote] = useState("");
  const [deviationKind, setDeviationKind] = useState<FranchiseShopDeviationKind | "">("");
  const flow = order.flow || emptyFranchiseShopOrderFlow(order.channel);
  const actions = order.nextActions?.length ? order.nextActions : franchiseShopOrderActions(order.status);
  const question = order.question || franchiseShopOrderQuestion(order.status);
  const needsNote = actions.some((item) => item.noteRequired || item.noteLabel);
  const needsDeviation = actions.some((item) => item.extra === "deviation");
  const currentIndex = (FRANCHISE_SHOP_ORDER_HAPPY_PATH as readonly string[]).indexOf(order.status);

  useEffect(() => {
    setNote(flow.missingData || flow.kitchenNote || flow.deviationNote || flow.naleveringNote || "");
    setDeviationKind(flow.deviationKind || "");
  }, [order.id, order.status, flow.missingData, flow.kitchenNote, flow.deviationNote, flow.naleveringNote, flow.deviationKind]);

  function run(action: FranchiseShopOrderActionDef) {
    onAction({
      action: action.id,
      note: note.trim() || undefined,
      deviationKind: action.extra === "deviation" ? deviationKind : undefined
    });
  }

  return (
    <div className="order-workflow">
      <div className="order-workflow-meta">
        <StatusChip
          status={order.status}
          label={FRANCHISE_SHOP_ORDER_STATUS_LABELS[order.status]}
          color={FRANCHISE_SHOP_ORDER_STATUS_COLORS[order.status]}
        />
        <span className="order-workflow-channel">{FRANCHISE_SHOP_ORDER_CHANNEL_LABELS[order.channel] || "Portaal"}</span>
      </div>

      <ol className="order-workflow-path" aria-label="Hoofdproces">
        {FRANCHISE_SHOP_ORDER_HAPPY_PATH.map((status, index) => {
          const done = currentIndex > index;
          const active = order.status === status;
          return (
            <li
              key={status}
              className={`order-workflow-path-step${done ? " is-done" : ""}${active ? " is-active" : ""}`}
            >
              <StatusDot color={FRANCHISE_SHOP_ORDER_STATUS_COLORS[status]} label={FRANCHISE_SHOP_ORDER_STATUS_LABELS[status]} />
              <span>{FRANCHISE_SHOP_ORDER_STATUS_LABELS[status]}</span>
            </li>
          );
        })}
      </ol>

      <div className="order-workflow-card">
        <p className="order-workflow-question">{question}</p>
        {flow.missingData ? <p className="order-workflow-note">Ontbreekt: {flow.missingData}</p> : null}
        {flow.kitchenNote ? <p className="order-workflow-note">Keuken: {flow.kitchenNote}</p> : null}
        {flow.deviationKind ? (
          <p className="order-workflow-note">
            Afwijking: {FRANCHISE_SHOP_DEVIATION_KIND_LABELS[flow.deviationKind]}
            {flow.deviationNote ? ` — ${flow.deviationNote}` : ""}
          </p>
        ) : null}
        {flow.naleveringNote ? <p className="order-workflow-note">Nalevering: {flow.naleveringNote}</p> : null}
        {flow.stockUpdatedAt ? (
          <p className="order-workflow-note">
            Voorraad/prognose bijgewerkt op {new Date(flow.stockUpdatedAt).toLocaleString("nl-NL")}.
          </p>
        ) : null}

        {needsDeviation ? (
          <label className="ta-field">
            <span>Soort afwijking</span>
            <select value={deviationKind} onChange={(event) => setDeviationKind(event.target.value as FranchiseShopDeviationKind | "")}>
              <option value="">Kies tekort, schade of fout</option>
              {FRANCHISE_SHOP_DEVIATION_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {FRANCHISE_SHOP_DEVIATION_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {needsNote ? (
          <label className="ta-field">
            <span>{actions.find((item) => item.noteLabel)?.noteLabel || "Toelichting"}</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
          </label>
        ) : null}

        {order.status === "afgerond" && !flow.stockUpdatedAt ? (
          <p className="ta-seo-hint">
            Tellingen en prognose staan los van de shop. Werk ze bij onder{" "}
            <a href="?tab=tellingen">Tellingen</a> en klik daarna op de knop hieronder.
          </p>
        ) : null}

        <div className="order-workflow-actions">
          {actions.map((action) => (
            <button
              key={action.id}
              className={toneClass(action.tone)}
              type="button"
              disabled={busy}
              title={action.description}
              onClick={() => run(action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {flow.events.length ? (
        <ol className="order-workflow-log">
          {[...flow.events].reverse().map((event, index) => (
            <li key={`${event.at}-${index}`}>
              <span>{event.at ? new Date(event.at).toLocaleString("nl-NL") : "—"}</span>
              <strong>{FRANCHISE_SHOP_ORDER_STATUS_LABELS[event.toStatus] || event.toStatus}</strong>
              {event.note ? <em>{event.note}</em> : null}
              {event.notified === false ? <em>Mail niet verstuurd</em> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
