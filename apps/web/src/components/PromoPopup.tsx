import { FormEvent, useEffect, useState } from "react";
import type { PromoPopupSettings } from "@tresamigos/types";
import { apiUrl, assetUrl } from "../lib/api";

const STORAGE_KEY = "tresamigos-promo-dismissed";

export function PromoPopup({ settings }: { settings: PromoPopupSettings }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });

  useEffect(() => {
    if (!settings.enabled) return;
    if (window.localStorage.getItem(STORAGE_KEY) === "1") return;

    const timer = window.setTimeout(() => setVisible(true), settings.delaySeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [settings.enabled, settings.delaySeconds]);

  function dismiss() {
    setVisible(false);
    window.localStorage.setItem(STORAGE_KEY, "1");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(apiUrl("/api/promo/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Verzenden mislukt.");
      setMessage(data.message || settings.successMessage);
      window.setTimeout(dismiss, 2600);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verzenden mislukt.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="promo-overlay" role="dialog" aria-modal="true" aria-labelledby="promo-title">
      <button className="promo-close" type="button" aria-label="Sluiten" onClick={dismiss}>
        ×
      </button>
      <div className="promo-modal">
        <div className="promo-copy">
          <img className="promo-logo" src={assetUrl("/assets/site/tres-amigos-logo-new.png")} alt="" aria-hidden="true" />
          <h2 id="promo-title">{settings.title}</h2>
          <p>{settings.subtitle}</p>
          <form className="promo-form" onSubmit={handleSubmit}>
            <label>
              <span>First name</span>
              <input
                value={form.firstName}
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Last name</span>
              <input
                value={form.lastName}
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Your email address</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>
            <button className="btn promo-submit" type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Continue"}
            </button>
            {message ? <p className="promo-message">{message}</p> : null}
          </form>
        </div>
        <div className="promo-visual">
          <img src={assetUrl(settings.image)} alt="Tres Amigos food and drinks" loading="lazy" />
        </div>
      </div>
    </div>
  );
}
