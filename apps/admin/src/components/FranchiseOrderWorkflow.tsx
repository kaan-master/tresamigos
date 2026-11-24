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
  type FranchiseShopOrderActionDef,
  type FranchiseShopOrderStatus
} from "@tresamigos/types";
import { StatusChip, StatusDot } from "./StatusCombo";

type Props = {
  order: FranchiseShopOrder;
  busy?: boolean;
  onAction: (input: {
    action: FranchiseShopOrderAction;
    note?: string;
    toStatus?: FranchiseShopOrderStatus;
    deviationKind?: FranchiseShopDeviationKind | "";
  }) => void;
  onOpenHelp?: () => void;
};

function toneClass(tone: FranchiseShopOrderActionDef["tone"]) {
  if (tone === "yes") return "ta-btn ta-btn-primary";
  if (tone === "no") return "ta-btn ta-btn-secondary";
  if (tone === "danger") return "ta-btn ta-btn-danger";
  return "ta-btn";
}

function actionNeedsText(action: FranchiseShopOrderActionDef) {
  return Boolean(action.noteRequired || (action.id === "resolve_action" && action.noteLabel));
}

export function FranchiseOrderWorkflow({ order, busy, onAction, onOpenHelp }: Props) {
  const [note, setNote] = useState("");
  const [deviationKind, setDeviationKind] = useState<FranchiseShopDeviationKind | "">("");
  const [pending, setPending] = useState<FranchiseShopOrderActionDef | null>(null);
  const [jumpTarget, setJumpTarget] = useState<FranchiseShopOrderStatus | null>(null);
  const [jumpNote, setJumpNote] = useState("");
  const [jumpError, setJumpError] = useState("");
  const flow = order.flow || emptyFranchiseShopOrderFlow(order.channel);
  const actions = order.nextActions?.length ? order.nextActions : franchiseShopOrderActions(order.status, flow);
  const question = order.question || franchiseShopOrderQuestion(order.status);
  const currentIndex = (FRANCHISE_SHOP_ORDER_HAPPY_PATH as readonly string[]).indexOf(order.status);
  const showText = pending ? actionNeedsText(pending) : false;
  const showDeviation = pending?.extra === "deviation";

  useEffect(() => {
    setPending(null);
    setJumpTarget(null);
    setJumpNote("");
    setJumpError("");
    setNote(flow.missingData || flow.kitchenNote || flow.deviationNote || flow.naleveringNote || "");
    setDeviationKind(flow.deviationKind || "");
  }, [order.id, order.status, flow.missingData, flow.kitchenNote, flow.deviationNote, flow.naleveringNote, flow.deviationKind]);

  function submit(action: FranchiseShopOrderActionDef, text: string) {
    if (actionNeedsText(action) && !text.trim()) {
      setPending(action);
      return;
    }
    if (action.extra === "deviation" && !deviationKind) {
      setPending(action);
      return;
    }
    onAction({
      action: action.id,
      note: text.trim() || undefined,
      deviationKind: action.extra === "deviation" ? deviationKind : undefined
    });
    setPending(null);
  }

  function run(action: FranchiseShopOrderActionDef) {
    if (actionNeedsText(action) || action.extra === "deviation") {
      setPending(action);
      return;
    }
    submit(action, note);
  }

  function openJump(status: FranchiseShopOrderStatus) {
    if (busy || status === order.status) return;
    setPending(null);
    setJumpTarget(status);
    setJumpNote("");
    setJumpError("");
  }

  function confirmJump() {
    if (!jumpTarget) return;
    const reason = jumpNote.trim();
    if (!reason) {
      setJumpError("Vul in waarom je de status wijzigt.");
      return;
    }
    onAction({
      action: "jump_status",
      toStatus: jumpTarget,
      note: reason
    });
    setJumpTarget(null);
    setJumpNote("");
    setJumpError("");
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
        {onOpenHelp ? (
          <button
            type="button"
            className="order-workflow-help"
            title="Werkwijze bekijken"
            aria-label="Werkwijze bekijken"
            onClick={onOpenHelp}
          >
            ?
          </button>
        ) : null}
      </div>

      <ol className="order-workflow-path" aria-label="Hoofdproces">
        {FRANCHISE_SHOP_ORDER_HAPPY_PATH.map((status, index) => {
          const done = currentIndex > index;
          const active = order.status === status;
          return (
            <li key={status}>
              <button
                type="button"
                className={`order-workflow-path-step${done ? " is-done" : ""}${active ? " is-active" : ""}`}
                disabled={busy || active}
                aria-current={active ? "step" : undefined}
                title={
                  active
                    ? FRANCHISE_SHOP_ORDER_STATUS_LABELS[status]
                    : `Zet status op ${FRANCHISE_SHOP_ORDER_STATUS_LABELS[status]}`
                }
                onClick={() => openJump(status)}
              >
                <StatusDot
                  color={FRANCHISE_SHOP_ORDER_STATUS_COLORS[status]}
                  label={FRANCHISE_SHOP_ORDER_STATUS_LABELS[status]}
                />
                <span>
                  {done ? "✓ " : ""}
                  {FRANCHISE_SHOP_ORDER_STATUS_LABELS[status]}
                </span>
              </button>
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
            Tellingen afgevinkt op {new Date(flow.stockUpdatedAt).toLocaleString("nl-NL")}.
          </p>
        ) : null}

        {showDeviation ? (
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

        {showText ? (
          <label className="ta-field">
            <span>{pending?.noteLabel || "Toelichting"}</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Vul dit in om door te gaan…"
              autoFocus
            />
          </label>
        ) : null}

        {pending ? (
          <div className="order-workflow-actions">
            <button
              className={toneClass(pending.tone)}
              type="button"
              disabled={busy}
              onClick={() => submit(pending, note)}
            >
              {pending.id === "confirm_order" ? "✓ " : ""}
              {pending.label} bevestigen
            </button>
            <button className="ta-btn ta-btn-ghost" type="button" disabled={busy} onClick={() => setPending(null)}>
              Annuleren
            </button>
          </div>
        ) : (
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
                {action.id === "confirm_order" ? "✓ " : ""}
                {action.label}
              </button>
            ))}
          </div>
        )}

        {order.status === "afgerond" && !flow.stockUpdatedAt ? (
          <p className="ta-seo-hint">
            De franchise-shop past de voorraad niet automatisch aan. Ga naar{" "}
            <a href="?tab=tellingen">Tellingen</a>, werk de aantallen van deze vestiging bij, en klik daarna op
            “Tellingen bijgewerkt ✓” om deze checklist-stap af te vinken.
          </p>
        ) : null}
      </div>

      {flow.events.length ? (
        <ol className="order-workflow-log">
          {[...flow.events].reverse().map((event, index) => (
            <li key={`${event.at}-${index}`}>
              <span>{event.at ? new Date(event.at).toLocaleString("nl-NL") : "—"}</span>
              <strong>{FRANCHISE_SHOP_ORDER_STATUS_LABELS[event.toStatus] || event.toStatus}</strong>
              {event.note ? <em>{event.note}</em> : null}
              {event.notified === true ? <em>Mail verstuurd</em> : null}
              {event.notified === false ? <em>Mail niet verstuurd</em> : null}
            </li>
          ))}
        </ol>
      ) : null}

      {jumpTarget ? (
        <div className="order-workflow-jump" role="presentation">
          <button
            type="button"
            className="order-workflow-jump-backdrop"
            aria-label="Sluiten"
            onClick={() => setJumpTarget(null)}
          />
          <div
            className="order-workflow-jump-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-workflow-jump-title"
          >
            <h3 id="order-workflow-jump-title">Status wijzigen</h3>
            <p>
              Je zet deze bestelling van{" "}
              <strong>{FRANCHISE_SHOP_ORDER_STATUS_LABELS[order.status]}</strong> naar{" "}
              <strong>{FRANCHISE_SHOP_ORDER_STATUS_LABELS[jumpTarget]}</strong>. Geef aan waarom (bijvoorbeeld een
              menselijke fout).
            </p>
            <label className="ta-field">
              <span>Reden (verplicht)</span>
              <textarea
                value={jumpNote}
                onChange={(event) => {
                  setJumpNote(event.target.value);
                  if (jumpError) setJumpError("");
                }}
                rows={4}
                placeholder="Bijv. per ongeluk doorklikt, status teruggezet na overleg met vestiging…"
                autoFocus
              />
            </label>
            {jumpError ? <p className="order-workflow-jump-error">{jumpError}</p> : null}
            <div className="order-workflow-actions">
              <button className="ta-btn ta-btn-primary" type="button" disabled={busy} onClick={confirmJump}>
                Status wijzigen
              </button>
              <button className="ta-btn ta-btn-ghost" type="button" disabled={busy} onClick={() => setJumpTarget(null)}>
                Annuleren
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
