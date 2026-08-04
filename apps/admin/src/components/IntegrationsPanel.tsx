import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type {
  IntegrationSettingsPublic,
  UpdateIntegrationGoogleAdsInput,
  UpdateIntegrationMailRelayInput,
  UpdateIntegrationNewsletterInput
} from "@tresamigos/types";
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

type GoogleAdsForm = {
  enabled: boolean;
  conversionId: string;
};

type NewsletterForm = {
  enabled: boolean;
  showFooter: boolean;
  showHome: boolean;
  showPages: boolean;
};

const REQUEST_EMAIL = "info@tresamigos.nl";
const REQUESTED_STORAGE_KEY = "ta-integration-requests";

const AVAILABLE_INTEGRATIONS = [
  {
    id: "google-login",
    title: "Google Login",
    description: "Laat klanten of medewerkers inloggen met Google OAuth.",
    highlights: ["Sneller inloggen", "Minder wachtwoorden", "Google-accounts"]
  },
  {
    id: "mollie",
    title: "Mollie",
    description: "Online betalingen voor catering of giftcards via Mollie.",
    highlights: ["iDEAL & cards", "Automatische webhooks", "Test- en livemodus"]
  },
  {
    id: "postnl",
    title: "PostNL tracking",
    description: "Track & trace voor verzendingen en bestellingen.",
    highlights: ["Track & trace", "Statusupdates", "Klantcommunicatie"]
  },
  {
    id: "delivery",
    title: "Thuisbezorgd / Uber Eats",
    description: "Koppel bestelplatforms voor statusupdates en menu sync.",
    highlights: ["Menu sync", "Orderstatus", "Platformkoppeling"]
  },
  {
    id: "meta",
    title: "Meta Pixel",
    description: "Conversiemeting via Meta Ads / Facebook Pixel.",
    highlights: ["Conversies meten", "Retargeting", "Ads-optimalisatie"]
  }
] as const;

type AvailableIntegration = (typeof AVAILABLE_INTEGRATIONS)[number];

function toMailForm(settings: IntegrationSettingsPublic["mailRelay"]): MailForm {
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

function readRequestedIds(): string[] {
  try {
    const raw = window.localStorage.getItem(REQUESTED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`ta-integration-status${active ? " is-active" : " is-off"}`}>
      <span className="ta-integration-status-dot" aria-hidden="true" />
      {active ? "Actief" : "Uit"}
    </span>
  );
}

function requestIntegrationMailto(item: AvailableIntegration) {
  const subject = encodeURIComponent(`Integratie aanvragen: ${item.title}`);
  const body = encodeURIComponent(
    [
      `Hoi Tres Amigos-team,`,
      ``,
      `Ik wil graag de integratie "${item.title}" activeren voor mijn account.`,
      ``,
      `Integratie: ${item.title}`,
      `Omschrijving: ${item.description}`,
      ``,
      `Kunnen jullie contact met mij opnemen over activatie en eventuele kosten?`,
      ``,
      `Bedankt!`
    ].join("\n")
  );
  window.location.href = `mailto:${REQUEST_EMAIL}?subject=${subject}&body=${body}`;
}

export function IntegrationsPanel() {
  const [settings, setSettings] = useState<IntegrationSettingsPublic | null>(null);
  const [mailForm, setMailForm] = useState<MailForm | null>(null);
  const [googleForm, setGoogleForm] = useState<GoogleAdsForm | null>(null);
  const [newsletterForm, setNewsletterForm] = useState<NewsletterForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<"mail" | "google" | "newsletter" | null>(null);
  const [testing, setTesting] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [openMail, setOpenMail] = useState(false);
  const [openGoogle, setOpenGoogle] = useState(true);
  const [openNewsletter, setOpenNewsletter] = useState(true);
  const [requestedIds, setRequestedIds] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readRequestedIds()
  );

  useEffect(() => {
    let cancelled = false;
    void api<{ integrations: IntegrationSettingsPublic }>("/api/admin/integrations")
      .then((result) => {
        if (cancelled) return;
        setSettings(result.integrations);
        setMailForm(toMailForm(result.integrations.mailRelay));
        setGoogleForm({
          enabled: result.integrations.googleAds.enabled,
          conversionId: result.integrations.googleAds.conversionId
        });
        setNewsletterForm({ ...result.integrations.newsletter });
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
    "mail mailrelay smtp outlook e-mail email".split(" ").some((part) => query.includes(part) || part.includes(query));
  const showGoogle =
    !query ||
    "google ads gtag aw conversie advertising tracking".split(" ").some((part) => query.includes(part) || part.includes(query));
  const showNewsletter =
    !query ||
    "nieuwsbrief newsletter mail subscribe abonnees".split(" ").some((part) => query.includes(part) || part.includes(query));

  const availableVisible = useMemo(
    () =>
      AVAILABLE_INTEGRATIONS.filter((item) => {
        if (!query) return true;
        return `${item.title} ${item.description}`.toLowerCase().includes(query);
      }),
    [query]
  );

  function markRequested(id: string) {
    setRequestedIds((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      window.localStorage.setItem(REQUESTED_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function handleRequestIntegration(item: AvailableIntegration) {
    requestIntegrationMailto(item);
    markRequested(item.id);
    setError("");
    setMessage(`Aanvraag voor ${item.title} is klaargezet in je e-mailprogramma.`);
  }

  const statusItems = useMemo(() => {
    if (!settings) return [];
    return [
      { id: "google", label: "Google Ads", active: settings.googleAds.enabled, detail: settings.googleAds.conversionId },
      {
        id: "newsletter",
        label: "Nieuwsbrief",
        active: settings.newsletter.enabled,
        detail: settings.newsletter.enabled ? "Aanmeldformulieren op de site" : "Uitgeschakeld"
      },
      {
        id: "mail",
        label: "Mailrelay",
        active: settings.mailRelay.enabled,
        detail: settings.mailRelay.enabled ? settings.mailRelay.host || "SMTP actief" : "Uitgeschakeld"
      }
    ];
  }, [settings]);

  function applySettings(next: IntegrationSettingsPublic) {
    setSettings(next);
    setMailForm(toMailForm(next.mailRelay));
    setGoogleForm({ enabled: next.googleAds.enabled, conversionId: next.googleAds.conversionId });
    setNewsletterForm({ ...next.newsletter });
  }

  function handleMailTextChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setMailForm((current) => (current ? { ...current, [name]: value } : current));
  }

  function handleMailToggleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, checked } = event.target;
    setMailForm((current) => (current ? { ...current, [name]: checked } : current));
  }

  async function saveMailRelay(event?: FormEvent) {
    event?.preventDefault();
    if (!mailForm || savingKey) return;
    setSavingKey("mail");
    setError("");
    setMessage("");

    const payload: UpdateIntegrationMailRelayInput = {
      enabled: mailForm.enabled,
      provider: mailForm.provider,
      host: mailForm.host.trim(),
      port: Number.parseInt(mailForm.port, 10) || 587,
      secure: mailForm.secure,
      username: mailForm.username.trim(),
      fromEmail: mailForm.fromEmail.trim(),
      fromName: mailForm.fromName.trim()
    };
    if (mailForm.password.trim()) {
      payload.password = mailForm.password.trim();
    }

    try {
      const result = await api<{ integrations: IntegrationSettingsPublic }>("/api/admin/integrations/mailrelay", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      applySettings(result.integrations);
      setMessage("Mailrelay opgeslagen.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Opslaan mislukt.");
    } finally {
      setSavingKey(null);
    }
  }

  async function saveGoogleAds(event?: FormEvent) {
    event?.preventDefault();
    if (!googleForm || savingKey) return;
    setSavingKey("google");
    setError("");
    setMessage("");

    const payload: UpdateIntegrationGoogleAdsInput = {
      enabled: googleForm.enabled,
      conversionId: googleForm.conversionId.trim()
    };

    try {
      const result = await api<{ integrations: IntegrationSettingsPublic }>("/api/admin/integrations/google-ads", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      applySettings(result.integrations);
      setMessage("Google Ads opgeslagen.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Opslaan mislukt.");
    } finally {
      setSavingKey(null);
    }
  }

  async function saveNewsletter(event?: FormEvent) {
    event?.preventDefault();
    if (!newsletterForm || savingKey) return;
    setSavingKey("newsletter");
    setError("");
    setMessage("");

    const payload: UpdateIntegrationNewsletterInput = { ...newsletterForm };

    try {
      const result = await api<{ integrations: IntegrationSettingsPublic }>("/api/admin/integrations/newsletter", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      applySettings(result.integrations);
      setMessage("Nieuwsbrief-integratie opgeslagen.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Opslaan mislukt.");
    } finally {
      setSavingKey(null);
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
      applySettings(result.integrations);
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
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="google, nieuwsbrief, mail..." />
      </label>

      {error ? <p className="ta-error">{error}</p> : null}
      {message ? <p className="ta-success">{message}</p> : null}

      {!query ? (
        <div className="ta-integration-overview">
          <div className="ta-integration-overview-head">
            <strong>Actieve integraties</strong>
            <p>Overzicht van wat nu live staat op de site en in de mailflow.</p>
          </div>
          <div className="ta-integration-overview-grid">
            {statusItems.map((item) => (
              <article key={item.id} className={`ta-integration-chip${item.active ? " is-active" : ""}`}>
                <div className="ta-integration-chip-top">
                  <strong>{item.label}</strong>
                  <StatusBadge active={item.active} />
                </div>
                <span>{item.detail}</span>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {showGoogle && googleForm ? (
        <div className="ta-integration-card">
          <button type="button" className="ta-integration-head" onClick={() => setOpenGoogle((value) => !value)}>
            <div>
              <strong>Google Ads</strong>
              <p>gtag.js conversietag voor Google Ads-campagnes op de website.</p>
            </div>
            <div className="ta-integration-head-meta">
              <StatusBadge active={settings?.googleAds.enabled ?? false} />
              <span>{openGoogle ? "−" : "+"}</span>
            </div>
          </button>

          {openGoogle ? (
            <form className="ta-integration-body" onSubmit={(event) => void saveGoogleAds(event)}>
              <label className="ta-check">
                <input
                  type="checkbox"
                  checked={googleForm.enabled}
                  onChange={(event) => setGoogleForm((current) => (current ? { ...current, enabled: event.target.checked } : current))}
                />
                <span>Google Ads-tag actief op de website</span>
              </label>

              <label className="ta-field">
                <span>Conversie-ID</span>
                <input
                  value={googleForm.conversionId}
                  onChange={(event) =>
                    setGoogleForm((current) => (current ? { ...current, conversionId: event.target.value } : current))
                  }
                  placeholder="AW-16851426878"
                />
              </label>

              <div className="ta-integration-monitor">
                <strong>Status</strong>
                <span>
                  Tag:{" "}
                  {settings?.googleAds.enabled
                    ? `Live via gtag.js (${settings.googleAds.conversionId})`
                    : "Uitgeschakeld — niet geladen op de site"}
                </span>
                <span>Script: https://www.googletagmanager.com/gtag/js?id={settings?.googleAds.conversionId}</span>
              </div>

              <div className="ta-toolbar" style={{ gap: 10, flexWrap: "wrap" }}>
                <button type="submit" className="ta-btn ta-btn-primary" disabled={savingKey === "google"}>
                  {savingKey === "google" ? "Opslaan..." : "Google Ads opslaan"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {showNewsletter && newsletterForm ? (
        <div className="ta-integration-card">
          <button type="button" className="ta-integration-head" onClick={() => setOpenNewsletter((value) => !value)}>
            <div>
              <strong>Nieuwsbrief</strong>
              <p>Aanmeldformulieren op homepage, pagina&apos;s en boven de footer. Abonnees beheer je onder Nieuwsbrief.</p>
            </div>
            <div className="ta-integration-head-meta">
              <StatusBadge active={settings?.newsletter.enabled ?? false} />
              <span>{openNewsletter ? "−" : "+"}</span>
            </div>
          </button>

          {openNewsletter ? (
            <form className="ta-integration-body" onSubmit={(event) => void saveNewsletter(event)}>
              <label className="ta-check">
                <input
                  type="checkbox"
                  checked={newsletterForm.enabled}
                  onChange={(event) =>
                    setNewsletterForm((current) => (current ? { ...current, enabled: event.target.checked } : current))
                  }
                />
                <span>Nieuwsbrief-verzamelaar actief</span>
              </label>

              <div className="ta-grid">
                <label className="ta-check">
                  <input
                    type="checkbox"
                    checked={newsletterForm.showHome}
                    disabled={!newsletterForm.enabled}
                    onChange={(event) =>
                      setNewsletterForm((current) => (current ? { ...current, showHome: event.target.checked } : current))
                    }
                  />
                  <span>Toon op homepage</span>
                </label>
                <label className="ta-check">
                  <input
                    type="checkbox"
                    checked={newsletterForm.showPages}
                    disabled={!newsletterForm.enabled}
                    onChange={(event) =>
                      setNewsletterForm((current) => (current ? { ...current, showPages: event.target.checked } : current))
                    }
                  />
                  <span>Toon op andere pagina&apos;s (menu, contact, …)</span>
                </label>
                <label className="ta-check">
                  <input
                    type="checkbox"
                    checked={newsletterForm.showFooter}
                    disabled={!newsletterForm.enabled}
                    onChange={(event) =>
                      setNewsletterForm((current) => (current ? { ...current, showFooter: event.target.checked } : current))
                    }
                  />
                  <span>Toon boven de footer (alle pagina&apos;s)</span>
                </label>
              </div>

              <div className="ta-integration-monitor">
                <strong>Status</strong>
                <span>
                  {settings?.newsletter.enabled
                    ? "Aanmeldingen landen in de Nieuwsbrief-tab"
                    : "Uitgeschakeld — formulieren zijn verborgen"}
                </span>
              </div>

              <div className="ta-toolbar" style={{ gap: 10, flexWrap: "wrap" }}>
                <button type="submit" className="ta-btn ta-btn-primary" disabled={savingKey === "newsletter"}>
                  {savingKey === "newsletter" ? "Opslaan..." : "Nieuwsbrief opslaan"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {showMail && mailForm ? (
        <div className="ta-integration-card">
          <button type="button" className="ta-integration-head" onClick={() => setOpenMail((value) => !value)}>
            <div>
              <strong>Mailrelay</strong>
              <p>SMTP of Outlook koppelen voor contact, promo en cateringmails.</p>
            </div>
            <div className="ta-integration-head-meta">
              <StatusBadge active={settings?.mailRelay.enabled ?? false} />
              <span>{openMail ? "−" : "+"}</span>
            </div>
          </button>

          {openMail ? (
            <form className="ta-integration-body" onSubmit={(event) => void saveMailRelay(event)}>
              <label className="ta-check">
                <input type="checkbox" name="enabled" checked={mailForm.enabled} onChange={handleMailToggleChange} />
                <span>Mailrelay actief</span>
              </label>

              <div className="ta-grid">
                <label className="ta-field">
                  <span>Provider</span>
                  <select
                    name="provider"
                    value={mailForm.provider}
                    onChange={(event) => {
                      const provider = event.target.value as "smtp" | "outlook";
                      setMailForm((current) =>
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
                    value={mailForm.host}
                    onChange={handleMailTextChange}
                    placeholder={mailForm.provider === "outlook" ? "smtp.office365.com" : "smtp.provider.nl"}
                  />
                </label>
                <label className="ta-field">
                  <span>Poort</span>
                  <input name="port" value={mailForm.port} onChange={handleMailTextChange} inputMode="numeric" placeholder="587" />
                </label>
                <label className="ta-check" style={{ alignSelf: "end" }}>
                  <input type="checkbox" name="secure" checked={mailForm.secure} onChange={handleMailToggleChange} />
                  <span>SSL direct gebruiken</span>
                </label>
                <label className="ta-field">
                  <span>Gebruiker / e-mailadres</span>
                  <input name="username" value={mailForm.username} onChange={handleMailTextChange} autoComplete="off" />
                </label>
                <label className="ta-field">
                  <span>Wachtwoord / app password</span>
                  <input
                    type="password"
                    name="password"
                    value={mailForm.password}
                    onChange={handleMailTextChange}
                    autoComplete="new-password"
                    placeholder={settings?.mailRelay.passwordSet ? "•••••••• (blijft behouden)" : ""}
                  />
                </label>
                <label className="ta-field">
                  <span>Afzender e-mail</span>
                  <input name="fromEmail" value={mailForm.fromEmail} onChange={handleMailTextChange} placeholder="info@tresamigos.nl" />
                </label>
                <label className="ta-field">
                  <span>Afzender naam</span>
                  <input name="fromName" value={mailForm.fromName} onChange={handleMailTextChange} placeholder="Tres Amigos" />
                </label>
              </div>

              {settings?.mailRelay.envFallbackConfigured ? (
                <p className="ta-seo-hint">
                  Fallback: SMTP uit .env is beschikbaar als mailrelay uitstaat of incompleet is.
                </p>
              ) : null}

              <div className="ta-toolbar" style={{ gap: 10, flexWrap: "wrap" }}>
                <button type="submit" className="ta-btn ta-btn-primary" disabled={savingKey === "mail"}>
                  {savingKey === "mail" ? "Opslaan..." : "Mailrelay opslaan"}
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
                    placeholder={mailForm.fromEmail || mailForm.username || "test@email.nl"}
                  />
                </label>
                <div style={{ alignSelf: "end" }}>
                  <button type="button" className="ta-btn ta-btn-accent" disabled={testing} onClick={() => void sendTestMail()}>
                    {testing ? "Testen..." : "Testmail verzenden"}
                  </button>
                </div>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {availableVisible.length ? (
        <div className="ta-integration-available-block">
          {!query ? (
            <div className="ta-integration-available-intro">
              <strong>Beschikbaar op aanvraag</strong>
              <p>Extra koppelingen die we voor je kunnen activeren. Vraag aan en we nemen contact op.</p>
            </div>
          ) : null}

          <div className="ta-integration-available-grid">
            {availableVisible.map((item) => {
              const requested = requestedIds.includes(item.id);
              return (
                <article key={item.id} className={`ta-integration-card ta-integration-available${requested ? " is-requested" : ""}`}>
                  <div className="ta-integration-head">
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </div>
                    <span className={`ta-request-badge${requested ? " is-requested" : ""}`}>
                      {requested ? "Aangevraagd" : "Op aanvraag"}
                    </span>
                  </div>

                  <div className="ta-integration-body ta-integration-available-body">
                    <ul className="ta-integration-highlights">
                      {item.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>

                    <div className="ta-integration-request">
                      <div>
                        <strong>{requested ? "Aanvraag verstuurd" : "Klaar om te activeren"}</strong>
                        <p>
                          {requested
                            ? "We hebben je aanvraag genoteerd. Stuur de e-mail af of mail ons opnieuw als je iets wilt wijzigen."
                            : "Vraag deze integratie aan. We activeren hem na bevestiging en sturen de setup-instructies."}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`ta-btn ${requested ? "ta-btn-accent" : "ta-btn-primary"}`}
                        onClick={() => handleRequestIntegration(item)}
                      >
                        {requested ? "Opnieuw aanvragen" : "Integratie aanvragen"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
