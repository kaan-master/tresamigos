import type { CateringFulfillmentModeSettings, CateringFulfillmentSettings } from "@tresamigos/types";
import { DEFAULT_CATERING_FULFILLMENT } from "./cateringDefaults";

export type CateringFulfillmentMode = "pickup" | "delivery";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseCateringTimeToDecimal(time: string) {
  const match = TIME_PATTERN.exec(time);
  if (!match) return 0;
  return Number(match[1]) + Number(match[2]) / 60;
}

export function sanitizeCateringTime(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value.trim() : "";
  return TIME_PATTERN.test(text) ? text : fallback;
}

export function sanitizeCateringFulfillmentMode(
  value: unknown,
  fallback: CateringFulfillmentModeSettings
): CateringFulfillmentModeSettings {
  const raw = value && typeof value === "object" ? (value as Partial<CateringFulfillmentModeSettings>) : {};
  return {
    enabled: raw.enabled !== false,
    openTime: sanitizeCateringTime(raw.openTime, fallback.openTime),
    closeTime: sanitizeCateringTime(raw.closeTime, fallback.closeTime)
  };
}

export function sanitizeCateringFulfillmentSettings(value: unknown): CateringFulfillmentSettings {
  const raw = value && typeof value === "object" ? (value as Partial<CateringFulfillmentSettings>) : {};
  return {
    pickup: sanitizeCateringFulfillmentMode(raw.pickup, DEFAULT_CATERING_FULFILLMENT.pickup),
    delivery: sanitizeCateringFulfillmentMode(raw.delivery, DEFAULT_CATERING_FULFILLMENT.delivery)
  };
}

function resolveSettings(settings?: CateringFulfillmentSettings) {
  return settings || DEFAULT_CATERING_FULFILLMENT;
}

function modeConfig(mode: CateringFulfillmentMode, settings?: CateringFulfillmentSettings) {
  const config = resolveSettings(settings);
  return mode === "pickup" ? config.pickup : config.delivery;
}

function hourDecimal(date: Date) {
  return date.getHours() + date.getMinutes() / 60;
}

export function isCateringModeEnabled(mode: CateringFulfillmentMode, settings?: CateringFulfillmentSettings) {
  return modeConfig(mode, settings).enabled;
}

export function isWithinCateringHours(mode: CateringFulfillmentMode, settings?: CateringFulfillmentSettings, date = new Date()) {
  const config = modeConfig(mode, settings);
  if (!config.enabled) return false;
  const hour = hourDecimal(date);
  const open = parseCateringTimeToDecimal(config.openTime);
  const close = parseCateringTimeToDecimal(config.closeTime);
  return hour >= open && hour <= close;
}

export function cateringHoursLabel(mode: CateringFulfillmentMode, settings?: CateringFulfillmentSettings) {
  const config = modeConfig(mode, settings);
  return `${config.openTime} – ${config.closeTime}`;
}

export function isScheduledWithinCateringHours(
  mode: CateringFulfillmentMode,
  date: string,
  time: string,
  settings?: CateringFulfillmentSettings
) {
  if (!date || !time) return false;
  const scheduled = new Date(`${date}T${time}`);
  if (Number.isNaN(scheduled.getTime())) return false;
  return isWithinCateringHours(mode, settings, scheduled);
}
