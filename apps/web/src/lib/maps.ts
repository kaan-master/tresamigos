/** Explicit Google Maps search URL — avoids iOS/Android auto-detecting the wrong place. */
export function googleMapsUrl(address: string, area?: string) {
  const query = [address, area].filter(Boolean).join(", ").trim();
  if (!query) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
