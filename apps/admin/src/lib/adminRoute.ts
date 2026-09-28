const TAB_IDS = [
  "overview",
  "locations",
  "products",
  "media",
  "applications",
  "franchise",
  "newsletter",
  "catering",
  "reviews",
  "seo",
  "siteSettings",
  "tellingen"
] as const;

export type AdminRouteTab = (typeof TAB_IDS)[number];

export type AdminRouteState = {
  tab: AdminRouteTab;
  view: string | null;
  sub: string | null;
};

function isTab(value: string | null): value is AdminRouteTab {
  return Boolean(value && (TAB_IDS as readonly string[]).includes(value));
}

export function readAdminRoute(): AdminRouteState {
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get("tab");
  return {
    tab: isTab(tabParam) ? tabParam : "overview",
    view: params.get("view"),
    sub: params.get("sub")
  };
}

/** Houd querystring in sync zodat refresh op dezelfde admin-pagina blijft. */
export function writeAdminRoute(next: Partial<AdminRouteState>) {
  const params = new URLSearchParams(window.location.search);
  const current = readAdminRoute();
  const tab = next.tab ?? current.tab;
  const view = next.view !== undefined ? next.view : current.view;
  const sub = next.sub !== undefined ? next.sub : current.sub;

  if (tab && tab !== "overview") params.set("tab", tab);
  else params.delete("tab");

  if (view) params.set("view", view);
  else params.delete("view");

  if (sub) params.set("sub", sub);
  else params.delete("sub");

  // Behoud overige query keys (bijv. googleMail tijdens callback-cleanup).
  const qs = params.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", url);
}

export function clearTransientAdminParams(...keys: string[]) {
  const params = new URLSearchParams(window.location.search);
  for (const key of keys) params.delete(key);
  const qs = params.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
}
