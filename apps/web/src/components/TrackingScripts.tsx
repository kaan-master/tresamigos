import { useEffect } from "react";
import { usePublicIntegrations } from "../hooks/usePublicIntegrations";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }
}

export function TrackingScripts() {
  const { data } = usePublicIntegrations();
  const googleAds = data?.googleAds;

  useEffect(() => {
    if (!googleAds?.enabled || !googleAds.conversionId) return;

    const conversionId = googleAds.conversionId;
    ensureGtag();
    window.gtag?.("js", new Date());
    window.gtag?.("config", conversionId);

    const existing = document.querySelector<HTMLScriptElement>(`script[data-ta-gtag="${conversionId}"]`);
    if (existing) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${conversionId}`;
    script.dataset.taGtag = conversionId;
    document.head.appendChild(script);

    return () => {
      // Keep the script loaded for the session; disabling removes config via next effect run.
    };
  }, [googleAds?.enabled, googleAds?.conversionId]);

  return null;
}
