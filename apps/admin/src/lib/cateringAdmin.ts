import type { CateringCartLine, CateringOrder, CateringOrderStatus } from "@tresamigos/types";

export const BOX_LABELS: Record<string, string> = {
  "burrito-box": "Burrito Box",
  "bowl-box": "Bowl & Salad Box",
  "quesadilla-box": "Quesadilla Box",
  "taco-box": "Taco Box",
  shop: "Webshop"
};

export const STATUS_LABELS: Record<CateringOrderStatus, string> = {
  nieuw: "Nieuw",
  bevestigd: "Bevestigd",
  voorbereid: "In voorbereiding",
  afgerond: "Afgerond",
  geannuleerd: "Geannuleerd"
};

export const STATUS_BADGE_CLASS: Record<CateringOrderStatus, string> = {
  nieuw: "catering-status-nieuw",
  bevestigd: "catering-status-bevestigd",
  voorbereid: "catering-status-voorbereid",
  afgerond: "catering-status-afgerond",
  geannuleerd: "catering-status-geannuleerd"
};

export const INCOMING_STATUSES = new Set<CateringOrderStatus>(["nieuw", "bevestigd", "voorbereid"]);
export const NEW_ORDER_STATUSES = new Set<CateringOrderStatus>(["nieuw"]);

const CONFIG_LABELS: Record<string, string> = {
  servings: "Porties",
  proteins: "Eiwitten",
  toppings: "Toppings",
  sauces: "Salsa's",
  tortillas: "Tortilla's",
  cream: "Guacamole / room"
};

export function formatEuro(cents: number) {
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function parseEventDate(order: Pick<CateringOrder, "eventDate" | "eventTime">) {
  if (!order.eventDate) return null;
  const time = order.eventTime?.trim() || "12:00";
  const value = new Date(`${order.eventDate}T${time.length === 5 ? `${time}:00` : time}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export function formatEventDateTime(order: Pick<CateringOrder, "eventDate" | "eventTime">) {
  const date = parseEventDate(order);
  if (!date) return "—";
  return date.toLocaleString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatOrderType(order: CateringOrder) {
  if (order.items.length) return `Webshop · ${order.items.length} product${order.items.length === 1 ? "" : "en"}`;
  return BOX_LABELS[order.boxId] || order.boxId;
}

export function formatConfiguration(line: CateringCartLine) {
  return Object.entries(line.configuration)
    .filter(([, value]) => value !== "" && value !== null && !(Array.isArray(value) && !value.length))
    .map(([key, value]) => {
      const label = CONFIG_LABELS[key] || key;
      const text = Array.isArray(value) ? value.join(", ") : String(value);
      return `${label}: ${text}`;
    });
}

export function orderSummaryMeta(order: CateringOrder) {
  const event = formatEventDateTime(order);
  const fulfillment = order.fulfillment === "pickup" ? "Afhalen" : "Bezorgen";
  const total = order.subtotalCents > 0 ? formatEuro(order.subtotalCents) : `${order.quantity} gasten`;
  return `${event} · ${fulfillment} · ${total}`;
}

export function isEventSoon(order: CateringOrder, withinDays = 3) {
  const event = parseEventDate(order);
  if (!event) return false;
  const now = new Date();
  const diff = event.getTime() - now.getTime();
  return diff >= 0 && diff <= withinDays * 24 * 60 * 60 * 1000;
}

export function isEventPast(order: CateringOrder) {
  const event = parseEventDate(order);
  if (!event) return false;
  return event.getTime() < Date.now();
}

export type DateFilterPreset = "all" | "today" | "week" | "month" | "upcoming";

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function matchesDateFilter(date: Date | null, preset: DateFilterPreset): boolean {
  if (preset === "all") return true;
  if (!date) return false;

  const start = startOfDay(new Date());

  if (preset === "today") {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return date >= start && date < end;
  }

  if (preset === "week") {
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return date >= weekStart && date < weekEnd;
  }

  if (preset === "month") {
    const monthStart = new Date(start);
    monthStart.setDate(monthStart.getDate() - 29);
    const monthEnd = new Date(start);
    monthEnd.setDate(monthEnd.getDate() + 30);
    return date >= monthStart && date < monthEnd;
  }

  return date >= start;
}
