import type { FulfillmentMode } from "./catalog";

const PICKUP_OPEN = 11;
const PICKUP_CLOSE = 22.5;
const DELIVERY_OPEN = 17;
const DELIVERY_CLOSE = 22.5;

function hourDecimal(date: Date) {
  return date.getHours() + date.getMinutes() / 60;
}

export function isWithinHours(mode: FulfillmentMode, date = new Date()) {
  const hour = hourDecimal(date);
  if (mode === "pickup") return hour >= PICKUP_OPEN && hour <= PICKUP_CLOSE;
  return hour >= DELIVERY_OPEN && hour <= DELIVERY_CLOSE;
}

export function isDeliveryAvailableToday(date = new Date()) {
  return isWithinHours("delivery", date);
}

export function fulfillmentHoursLabel(mode: FulfillmentMode) {
  if (mode === "pickup") return "11:00 – 22:30";
  return "17:00 – 22:30";
}

export function isScheduledWithinHours(mode: FulfillmentMode, date: string, time: string) {
  if (!date || !time) return false;
  const scheduled = new Date(`${date}T${time}`);
  if (Number.isNaN(scheduled.getTime())) return false;
  return isWithinHours(mode, scheduled);
}
