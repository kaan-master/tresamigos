import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getAnalyticsSessionId } from "../lib/analyticsSession";
import { apiUrl } from "../lib/api";

async function sendAnalyticsPing(path: string) {
  const sessionId = getAnalyticsSessionId();
  const body = JSON.stringify({ sessionId, path });
  const getUrl = apiUrl(
    `/api/analytics/ping?sid=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(path)}`
  );

  try {
    const response = await fetch(apiUrl("/api/analytics/ping"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true
    });
    if (!response.ok) throw new Error("ping failed");
  } catch {
    try {
      if (typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" });
        if (!navigator.sendBeacon(apiUrl("/api/analytics/ping"), blob)) {
          await fetch(getUrl, { method: "GET", keepalive: true });
        }
      } else {
        await fetch(getUrl, { method: "GET", keepalive: true });
      }
    } catch {
      // best-effort
    }
  }
}

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    let active = true;

    function ping() {
      if (!active || document.visibilityState === "hidden") return;
      void sendAnalyticsPing(location.pathname);
    }

    function onVisible() {
      if (document.visibilityState === "visible") ping();
    }

    ping();
    const interval = window.setInterval(ping, 3_000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [location.pathname]);

  return null;
}
