export const WEEKDAY_NAMES = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"] as const;

export function dateFromCountDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function weekdayName(value: string) {
  const date = dateFromCountDate(value);
  if (!date) return "";
  return date.toLocaleDateString("nl-NL", { weekday: "long" });
}

export function formatCountDate(value: string) {
  const date = dateFromCountDate(value);
  if (!date) return value;
  return date.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
}
