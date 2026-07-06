import { useMemo } from "react";
import type { CateringOrder } from "@tresamigos/types";
import { INCOMING_STATUSES, isEventSoon, orderSummaryMeta, parseEventDate, STATUS_BADGE_CLASS, STATUS_LABELS } from "../../lib/cateringAdmin";
import { AdminListRow } from "../AdminListUi";

interface Props {
  orders: CateringOrder[];
  onOpenOrders: () => void;
  onSelectOrder: (orderId: string) => void;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isEventThisWeek(order: CateringOrder) {
  const event = parseEventDate(order);
  if (!event) return false;
  const start = startOfDay(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return event >= start && event < end;
}

export function CateringOverviewPanel({ orders, onOpenOrders, onSelectOrder }: Props) {
  const stats = useMemo(() => {
    const incoming = orders.filter((order) => INCOMING_STATUSES.has(order.status));
    return {
      incoming: incoming.length,
      nieuw: orders.filter((order) => order.status === "nieuw").length,
      thisWeek: orders.filter((order) => isEventThisWeek(order) && INCOMING_STATUSES.has(order.status)).length,
      attention: incoming.filter((order) => order.status === "nieuw" || isEventSoon(order)).length
    };
  }, [orders]);

  const actionOrders = useMemo(
    () =>
      orders
        .filter((order) => INCOMING_STATUSES.has(order.status) && (order.status === "nieuw" || isEventSoon(order)))
        .sort((a, b) => (parseEventDate(a)?.getTime() || 0) - (parseEventDate(b)?.getTime() || 0))
        .slice(0, 6),
    [orders]
  );

  return (
    <div className="catering-overview">
      <div className="catering-overview-stats">
        <article className="catering-overview-stat">
          <span>Inkomende aanvragen</span>
          <strong>{stats.incoming}</strong>
        </article>
        <article className="catering-overview-stat catering-overview-stat-alert">
          <span>Nieuwe bestellingen</span>
          <strong>{stats.nieuw}</strong>
        </article>
        <article className="catering-overview-stat">
          <span>Events deze week</span>
          <strong>{stats.thisWeek}</strong>
        </article>
        <article className="catering-overview-stat">
          <span>Vraagt actie</span>
          <strong>{stats.attention}</strong>
        </article>
      </div>

      <div className="catering-overview-actions">
        <div>
          <h3>Acties die aandacht nodig hebben</h3>
          <p className="ta-seo-hint">Nieuwe orders en events binnen 3 dagen staan bovenaan.</p>
        </div>
        <button className="ta-btn ta-btn-primary" type="button" onClick={onOpenOrders}>
          Naar bestellingen
        </button>
      </div>

      <div className="catering-overview-list">
        {actionOrders.length ? (
          actionOrders.map((order) => (
            <AdminListRow
              key={order.id}
              title={`${order.orderNumber} · ${order.name}`}
              meta={orderSummaryMeta(order)}
              badge={STATUS_LABELS[order.status]}
              badgeClassName={STATUS_BADGE_CLASS[order.status]}
              onClick={() => onSelectOrder(order.id)}
            />
          ))
        ) : (
          <div className="ta-empty">Geen urgente cateringacties op dit moment.</div>
        )}
      </div>
    </div>
  );
}
