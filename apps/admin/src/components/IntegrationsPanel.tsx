import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { IntegrationSettingsPublic, UpdateIntegrationMailRelayInput } from "@tresamigos/types";
import { api } from "../lib/api";

type MailForm = {
  enabled: boolean;
  provider: "smtp" | "outlook";
  host: string;
  port: string;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
};

const LOCKED_INTEGRATIONS = [
  {
    id: "google-login",
    title: "Google Login",
    description: "Laat klanten of medewerkers inloggen met Google OAuth.",
    fields: ["Client ID", "Client secret", "Redirect URI"]
  },
  {
    id: "mollie",
    title: "Mollie",
    description: "Online betalingen voor catering of giftcards via Mollie.",
    fields: ["API-modus", "Test API-sleutel", "Live API-sleutel", "Webhook"]
  },
  {
    id: "postnl",
    title: "PostNL tracking",
    description: "Track & trace voor verzendingen en bestellingen.",
    fields: ["API key", "Klantnummer", "Klantcode"]
  },
  {
    id: "delivery",
    title: "Thuisbezorgd / Uber Eats",
    description: "Koppel bestelplatforms voor statusupdates en menu sync.",
    fields: ["Partner ID", "API-sleutel", "Webhook secret"]
  },
  {
    id: "meta",
    title: "Meta Pixel",
    description: "Conversiemeting via Meta Ads / Facebook Pixel.",
    fields: ["Pixel ID", "Access token"]
  }
] as const;

function toForm(settings: IntegrationSettingsPublic["mailRelay"]): MailForm {
  return {
    enabled: settings.enabled,
    provider: settings.provider,
    host: settings.host,
    port: String(settings.port || 587),
    secure: settings.secure,
    username: settings.username,
    password: "",
    fromEmail: settings.fromEmail,
    fromName: settings.fromName
  };
}

export function IntegrationsPanel() {
  const [settings, setSettings] = useState<IntegrationSettingsPublic | null>(null);
  const [form, setForm] = useState<MailForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [openMail, setOpenMail] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void api<{ integrations: IntegrationSettingsPublic }>("/api/admin/integrations")
      .then((result) => {
        if (cancelled) return;
        setSettings(result.integrations);
        setForm(toForm(result.integrations.mailRelay));
        setTestRecipient(result.integrations.mailRelay.fromEmail || result.integrations.mailRelay.username || "");
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Integraties laden mislukt.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const query = search.trim().toLowerCase();
  const showMail =
    !query ||
    "mail mailrelay smtp outlook e-mail email nieuwsbrief".split(" ").some((part) => query.includes(part) || part.includes(query));

  const lockedVisible = useMemo(
    () =>
      LOCKED_INTEGRATIONS.filter((item) => {
        if (!query) return true;
        return `${item.title} ${item.description}`.toLowerCase().includes(query);
      }),
    [query]
  );

  function handleTextChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => (current ? { ...current, [name]: value } : current));
  }

  function handleToggleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, checked } = event.target;
    setForm((current) => (current ? { ...current, [name]: checked } : current));
  }

  async function saveMailRelay(event?: FormEvent) {
    event?.preventDefault();
    if (!form || saving) return;
    setSaving(true);
    setError("");
    setMessage("");

    const payload: UpdateIntegrationMailRelayInput = {
      enabled: form.enabled,
      provider: form.provider,
      host: form.host.trim(),
      port: Number.parseInt(form.port, 10) || 587,
      secure: form.secure,
      username: form.username.trim(),
      fromEmail: form.fromEmail.trim(),
      fromName: form.fromName.trim()
    };
    if (form.password.trim()) {
      payload.password = form.password.trim();
    }

    try {
      const result = await api<{ integrations: IntegrationSettingsPublic }>("/api/admin/integrations/mailrelay", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setSettings(result.integrations);
      setForm(toForm(result.integrations.mailRelay));
      setMessage("Mailrelay opgeslagen.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function sendTestMail() {
    if (testing) return;
    setTesting(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ message: string; integrations: IntegrationSettingsPublic }>(
        "/api/admin/integrations/mailrelay/test",
        {
          method: "POST",
          body: JSON.stringify({ to: testRecipient.trim() })
        }
      );
      setSettings(result.integrations);
      setMessage(result.message);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Testmail mislukt.");
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return <div className="ta-empty">Integraties laden...</div>;
  }

  return (
    <div className="ta-stack" style={{ gap: 20 }}>
      <label className="ta-field" style={{ maxWidth: 420 }}>
        <span>Zoeken</span>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="mail, mollie, google..." />
      </label>

      {error ? <p className="ta-error">{error}</p> : null}
      {message ? <p className="ta-success">{message}</p> : null}

      {showMail && form ? (
        <div className="ta-integration-card">
          <button type="button" className="ta-integration-head" onClick={() => setOpenMail((value) => !value)}>
            <div>
              <strong>Mailrelay</strong>
              <p>SMTP of Outlook koppelen voor contact, promo en cateringmails.</p>
            </div>
            <span>{openMail ? "−" : "+"}</span>
          </button>

          {openMail ? (
            <form className="ta-integration-body" onSubmit={(event) => void saveMailRelay(event)}>
              <label className="ta-check">
                <input type="checkbox" name="enabled" checked={form.enabled} onChange={handleToggleChange} />
                <span>Mailrelay actief</span>
              </label>

              <div className="ta-grid">
                <label className="ta-field">
                  <span>Provider</span>
                  <select
                    name="provider"
                    value={form.provider}
                    onChange={(event) => {
                      const provider = event.target.value as "smtp" | "outlook";
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              provider,
                              host: provider === "outlook" && !current.host ? "smtp.office365.com" : current.host
                            }
                          : current
                      );
                    }}
                  >
                    <option value="smtp">SMTP / IMAP provider</option>
                    <option value="outlook">Outlook / Microsoft 365</option>
                  </select>
                </label>
                <label className="ta-field">
                  <span>SMTP host</span>
                  <input
                    name="host"
                    value={form.host}
                    onChange={handleTextChange}
                    placeholder={form.provider === "outlook" ? "smtp.office365.com" : "smtp.provider.nl"}
                  />
                </label>
                <label className="ta-field">
                  <span>Poort</span>
                  <input name="port" value={form.port} onChange={handleTextChange} inputMode="numeric" placeholder="587" />
                </label>
                <label className="ta-check" style={{ alignSelf: "end" }}>
                  <input type="checkbox" name="secure" checked={form.secure} onChange={handleToggleChange} />
                  <span>SSL direct gebruiken</span>
                </label>
                <label className="ta-field">
                  <span>Gebruiker / e-mailadres</span>
                  <input name="username" value={form.username} onChange={handleTextChange} autoComplete="off" />
                </label>
                <label className="ta-field">
                  <span>Wachtwoord / app password</span>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleTextChange}
                    autoComplete="new-password"
                    placeholder={settings?.mailRelay.passwordSet ? "•••••••• (blijft behouden)" : ""}
                  />
                </label>
                <label className="ta-field">
                  <span>Afzender e-mail</span>
                  <input name="fromEmail" value={form.fromEmail} onChange={handleTextChange} placeholder="info@tresamigos.nl" />
                </label>
                <label className="ta-field">
                  <span>Afzender naam</span>
                  <input name="fromName" value={form.fromName} onChange={handleTextChange} placeholder="Tres Amigos" />
                </label>
              </div>

              {settings?.mailRelay.envFallbackConfigured ? (
                <p className="ta-seo-hint">
                  Fallback: SMTP uit .env is beschikbaar als mailrelay uitstaat of incompleet is.
                </p>
              ) : null}

              <div className="ta-toolbar" style={{ gap: 10, flexWrap: "wrap" }}>
                <button type="submit" className="ta-btn" disabled={saving}>
                  {saving ? "Opslaan..." : "Mailrelay opslaan"}
                </button>
              </div>

              <div className="ta-integration-monitor">
                <strong>Monitor</strong>
                <span>
                  Laatste test:{" "}
                  {settings?.mailRelay.lastTestAt
                    ? new Date(settings.mailRelay.lastTestAt).toLocaleString("nl-NL")
                    : "nog niet getest"}
                </span>
                <span>
                  Status:{" "}
                  {settings?.mailRelay.lastStatus === "success"
                    ? "Werkend"
                    : settings?.mailRelay.lastStatus === "error"
                      ? "Fout"
                      : "Onbekend"}
                </span>
                {settings?.mailRelay.lastMessage ? <span>{settings.mailRelay.lastMessage}</span> : null}
              </div>

              <div className="ta-grid">
                <label className="ta-field">
                  <span>Testontvanger</span>
                  <input
                    value={testRecipient}
                    onChange={(event) => setTestRecipient(event.target.value)}
                    placeholder={form.fromEmail || form.username || "test@email.nl"}
                  />
                </label>
                <div style={{ alignSelf: "end" }}>
                  <button type="button" className="ta-btn ta-btn-secondary" disabled={testing} onClick={() => void sendTestMail()}>
                    {testing ? "Testen..." : "Testmail verzenden"}
                  </button>
                </div>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {lockedVisible.map((item) => (
        <div key={item.id} className="ta-integration-card ta-integration-locked">
          <div className="ta-integration-head">
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
            <span className="ta-lock-badge">Nog niet gekocht</span>
          </div>
          <div className="ta-integration-body ta-integration-locked-body" aria-disabled="true">
            <div className="ta-grid">
              {item.fields.map((field) => (
                <label key={field} className="ta-field">
                  <span>{field}</span>
                  <input disabled placeholder="Beschikbaar na aankoop" />
                </label>
              ))}
            </div>
            <div className="ta-lock-overlay">
              <strong>Locked</strong>
              <p>Deze integratie staat klaar, maar is nog niet geactiveerd voor dit account.</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
