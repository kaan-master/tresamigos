function envFlag(value: string | undefined, defaultValue = false) {
  if (value === undefined || value === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

/** Navbar link + menu product modal catering CTA. Set VITE_SHOW_CATERING_NAV in root .env */
export const showCateringNav = envFlag(import.meta.env.VITE_SHOW_CATERING_NAV, false);
