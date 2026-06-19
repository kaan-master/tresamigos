import { useEffect } from "react";
import { useLocation } from "react-router-dom";

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
      if (!active) return;
      try {
        await fetch("/api/analytics/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionId(), path: location.pathname })
        });
      } catch {
        // analytics is best-effort
      }
    }

    void ping();
    const interval = window.setInterval(() => void ping(), 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [location.pathname]);

  return null;
}
