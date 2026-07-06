import type { CateringFulfillmentSettings } from "@tresamigos/types";
import {
  cateringHoursLabel,
  isCateringModeEnabled,
  isScheduledWithinCateringHours,
  isWithinCateringHours,
  type CateringFulfillmentMode
} from "@tresamigos/utils";

export type FulfillmentMode = CateringFulfillmentMode;

export function isWithinHours(mode: FulfillmentMode, settings?: CateringFulfillmentSettings, date = new Date()) {
  return isWithinCateringHours(mode, settings, date);
}

export function isDeliveryAvailableToday(settings?: CateringFulfillmentSettings) {
  return isCateringModeEnabled("delivery", settings);
}

export function isPickupAvailable(settings?: CateringFulfillmentSettings) {
  return isCateringModeEnabled("pickup", settings);
}

export function fulfillmentHoursLabel(mode: FulfillmentMode, settings?: CateringFulfillmentSettings) {
  return cateringHoursLabel(mode, settings);
}

export function isScheduledWithinHours(
  mode: FulfillmentMode,
  date: string,
  time: string,
  settings?: CateringFulfillmentSettings
) {
  return isScheduledWithinCateringHours(mode, date, time, settings);
}
