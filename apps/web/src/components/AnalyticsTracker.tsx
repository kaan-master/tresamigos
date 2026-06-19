import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { apiUrl } from "../lib/api";

function sessionId() {
  const key = "tres_amigos_sid";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  sessionStorage.setItem(key, next);
  return next;
}

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    let active = true;

    async function ping() {
      if (!active || document.visibilityState === "hidden") return;
      try {
        await fetch(apiUrl("/api/analytics/ping"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionId(), path: location.pathname }),
          keepalive: true
        });
        window.dispatchEvent(new CustomEvent("ta-analytics-ping"));
      } catch {
        // analytics is best-effort
      }
    }

    function onVisible() {
      if (document.visibilityState === "visible") void ping();
    }

    void ping();
    const interval = window.setInterval(() => void ping(), 10_000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [location.pathname]);

  return null;
}
