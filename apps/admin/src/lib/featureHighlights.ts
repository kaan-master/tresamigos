import type { AdminTabId } from "@tresamigos/types";

/** Bump key bij een nieuwe franchise-update → highlight opnieuw voor iedereen die ’m nog niet zag. */
export const FRANCHISE_FEATURE = {
  tabId: "franchise" as AdminTabId,
  key: "franchise-hub-2026-11",
  newLabel: "Nieuw",
  updateLabel: "Update",
  newTitle: "Nieuw: Franchise shop, bestellingen, iDEAL, factuur en pakbon. Open dit tabblad om te starten.",
  updateTitle: "Update: Franchise-werkwijze, statusmails en Mollie-betalingen. Open Franchise om te bekijken."
};

function storageKey(userId: string) {
  return `ta-feature-seen:${userId || "anon"}`;
}

function readSeen(userId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeSeen(userId: string, keys: string[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify([...new Set(keys)]));
  } catch {
    /* ignore quota / private mode */
  }
}

export function hasSeenFeature(userId: string, featureKey: string) {
  return readSeen(userId).includes(featureKey);
}

export function markFeatureSeen(userId: string, featureKey: string) {
  const next = readSeen(userId);
  if (next.includes(featureKey)) return;
  writeSeen(userId, [...next, featureKey]);
}

export type NavFeatureHighlight = {
  kind: "new" | "update";
  label: string;
  title: string;
};

/** Highlight Franchise tot de gebruiker het tabblad opent. */
export function franchiseNavHighlight(userId: string, firstLogin?: boolean): NavFeatureHighlight | null {
  if (hasSeenFeature(userId, FRANCHISE_FEATURE.key)) return null;
  if (firstLogin) {
    return {
      kind: "new",
      label: FRANCHISE_FEATURE.newLabel,
      title: FRANCHISE_FEATURE.newTitle
    };
  }
  return {
    kind: "update",
    label: FRANCHISE_FEATURE.updateLabel,
    title: FRANCHISE_FEATURE.updateTitle
  };
}
