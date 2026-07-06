function envFlag(value: string | undefined, defaultValue = false) {
  if (value === undefined || value === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

/** @deprecated gebruik site.navigation in admin; blijft als fallback voor catering-link */
export const showCateringNav = envFlag(import.meta.env.VITE_SHOW_CATERING_NAV, true);
