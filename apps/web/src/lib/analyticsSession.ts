const STORAGE_KEY = "tres_amigos_sid";

/** Stable visitor session — works on HTTP/mobile without crypto.randomUUID (secure context). */
export function getAnalyticsSessionId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
  } catch {
    // private browsing
  }

  let next = "";
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      next = crypto.randomUUID();
    }
  } catch {
    // insecure context (http://)
  }

  if (!next) {
    next = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }

  return next;
}
