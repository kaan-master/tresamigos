import { useEffect, useMemo, useState } from "react";
import type {
  IntegrationGoogleByCategory,
  IntegrationMailNotifications,
  IntegrationSettingsPublic,
  MailNotifyCategory,
  MailRelayProvider,
  UpdateIntegrationGoogleAdsInput,
  UpdateIntegrationMailRelayInput,
  UpdateIntegrationNewsletterInput
} from "@tresamigos/types";
import {
  IconApplications,
  IconCatering,
  IconFranchise,
  IconIntegrations
} from "./AdminIcons";
import { useAdminFeedback } from "../context/AdminFeedbackContext";
import { api } from "../lib/api";
import { EntraCommand, EntraCommands } from "./telling/entraUi";

type IntegrationsView = "overview" | "mail" | "googleAds" | "newsletter" | "extra";

type MailForm = {
  enabled: boolean;
  provider: MailRelayProvider;
  host: string;
  port: string;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  notifications: IntegrationMailNotifications;
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

const DEFAULT_NOTIFICATIONS: IntegrationMailNotifications = {
  applications: "work@tresamigos.nl",
  catering: "catering@tresamigos.nl",
  franchise: "Vilmon@tresamigos.nl",
  other: "no-reply@tresamigos.nl"
};

const EMPTY_GOOGLE_BY_CATEGORY: IntegrationGoogleByCategory = {
  applications: { connected: false, email: "" },
  catering: { connected: false, email: "" },
  franchise: { connected: false, email: "" },
  other: { connected: false, email: "" }
};

const CATEGORY_META: Array<{
  id: MailNotifyCategory;
  label: string;
  hint: string;
  placeholder: string;
}> = [
  { id: "applications", label: "Sollicitaties", hint: "Nieuwe sollicitaties", placeholder: "work@tresamigos.nl" },
  { id: "catering", label: "Catering", hint: "Nieuwe cateringorders", placeholder: "catering@tresamigos.nl" },
  { id: "franchise", label: "Franchise", hint: "Franchise-aanvragen", placeholder: "Vilmon@tresamigos.nl" },
  { id: "other", label: "Overig", hint: "Contact en overige mail", placeholder: "no-reply@tresamigos.nl" }
];

const AVAILABLE_INTEGRATIONS = [
  { id: "mollie", title: "Mollie", description: "Online betalingen via Mollie." },
  { id: "postnl", title: "PostNL tracking", description: "Track & trace voor verzendingen." }
] as const;

type AvailableIntegration = (typeof AVAILABLE_INTEGRATIONS)[number];

const VIEW_TABS: Array<{ id: IntegrationsView; label: string }> = [
  { id: "overview", label: "Overzicht" },
  { id: "mail", label: "E-mail" },
  { id: "googleAds", label: "Google Ads" },
  { id: "newsletter", label: "Nieuwsbrief" },
  { id: "extra", label: "Op aanvraag" }
];

const TITLES: Record<IntegrationsView, { title: string; subtitle: string }> = {
  overview: { title: "Overzicht", subtitle: "Status van actieve koppelingen" },
  mail: { title: "E-mail", subtitle: "Google Workspace / Gmail — één keer inloggen per categorie" },
  googleAds: { title: "Google Ads", subtitle: "gtag.js conversietag op de website" },
  newsletter: { title: "Nieuwsbrief", subtitle: "Waar het aanmeldformulier zichtbaar is" },
  extra: { title: "Op aanvraag", subtitle: "Extra koppelingen aanvragen bij Tres Amigos" }
};

function toMailForm(settings: IntegrationSettingsPublic["mailRelay"]): MailForm {
  return {
    enabled: settings.enabled,
    provider: settings.provider === "smtp" || settings.provider === "outlook" ? settings.provider : "google",
    host: settings.host,
    port: String(settings.port || 587),
    secure: settings.secure,
    username: settings.username,
    password: "",
    fromEmail: settings.fromEmail,
    fromName: settings.fromName,
    notifications: { ...DEFAULT_NOTIFICATIONS, ...settings.notifications }
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
  const { runSave } = useAdminFeedback();
  const [view, setView] = useState<IntegrationsView>("overview");
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
  const [requestedIds, setRequestedIds] = useState<string[]>(() => readRequestedIds());
  const [connectingCategory, setConnectingCategory] = useState<MailNotifyCategory | null>(null);

  const copy = TITLES[view];
  const googleByCategory = settings?.mailRelay.googleByCategory || EMPTY_GOOGLE_BY_CATEGORY;

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const result = await api<{ integrations: IntegrationSettingsPublic }>("/api/admin/integrations");
      setSettings(result.integrations);
      setMailForm(toMailForm(result.integrations.mailRelay));
      setGoogleForm({
        enabled: result.integrations.googleAds.enabled,
        conversionId: result.integrations.googleAds.conversionId
      });
      setNewsletterForm({
        enabled: result.integrations.newsletter.enabled,
        showFooter: result.integrations.newsletter.showFooter,
        showHome: result.integrations.newsletter.showHome,
        showPages: result.integrations.newsletter.showPages
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Integraties laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleMail = params.get("googleMail");
    if (!googleMail) return;
    if (googleMail === "connected") {
      setView("mail");
      setMessage(`Google gekoppeld${params.get("email") ? `: ${params.get("email")}` : ""}.`);
      void loadSettings();
    }
    if (googleMail === "error") {
      setView("mail");
      setError(params.get("message") || "Google login mislukt.");
    }
    params.delete("googleMail");
    params.delete("email");
    params.delete("category");
    params.delete("message");
    const next = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`);
  }, []);

  const statusItems = useMemo(() => {
    if (!settings) return [];
    return [
      {
        id: "mail",
        label: "E-mail",
        active: settings.mailRelay.enabled,
        detail: settings.mailRelay.provider === "google" ? "Google Gmail" : settings.mailRelay.provider.toUpperCase()
      },
      {
        id: "google",
        label: "Google Ads",
        active: settings.googleAds.enabled,
        detail: settings.googleAds.conversionId
      },
      {
        id: "newsletter",
        label: "Nieuwsbrief",
        active: settings.newsletter.enabled,
        detail: [
          settings.newsletter.showHome ? "Home" : null,
          settings.newsletter.showPages ? "Pagina's" : null,
          settings.newsletter.showFooter ? "Footer" : null
        ]
          .filter(Boolean)
          .join(" · ") || "Uit"
      }
    ];
  }, [settings]);

  function applySettings(next: IntegrationSettingsPublic) {
    setSettings(next);
    setMailForm(toMailForm(next.mailRelay));
    setGoogleForm({ enabled: next.googleAds.enabled, conversionId: next.googleAds.conversionId });
    setNewsletterForm({
      enabled: next.newsletter.enabled,
      showFooter: next.newsletter.showFooter,
      showHome: next.newsletter.showHome,
      showPages: next.newsletter.showPages
    });
  }

  async function saveMailRelay() {
    if (!mailForm || savingKey) return;
    setSavingKey("mail");
    setMessage("");
    setError("");
    const payload: UpdateIntegrationMailRelayInput = {
      enabled: mailForm.enabled,
      provider: mailForm.provider,
      host: mailForm.host,
      port: Number(mailForm.port) || 587,
      secure: mailForm.secure,
      username: mailForm.username,
      password: mailForm.password || undefined,
      fromEmail: mailForm.fromEmail,
      fromName: mailForm.fromName,
      notifications: mailForm.notifications
    };
    try {
      await runSave(
        async () => {
          const result = await api<{ integrations: IntegrationSettingsPublic }>("/api/admin/integrations/mailrelay", {
            method: "PUT",
            body: JSON.stringify(payload)
          });
          applySettings(result.integrations);
        },
        { successMessage: "E-mailinstellingen opgeslagen." }
      );
      setMessage("E-mailinstellingen opgeslagen.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Opslaan mislukt.");
    } finally {
      setSavingKey(null);
    }
  }

  async function connectGoogleMail(category: MailNotifyCategory) {
    if (!mailForm) return;
    setConnectingCategory(category);
    setError("");
    try {
      const hint = mailForm.notifications[category] || DEFAULT_NOTIFICATIONS[category];
      const query = new URLSearchParams({ category, loginHint: hint });
      const result = await api<{ url: string }>(`/api/admin/integrations/mailrelay/google/start?${query.toString()}`);
      window.location.href = result.url;
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Google login starten mislukt.");
      setConnectingCategory(null);
    }
  }

  async function disconnectGoogleCategory(category: MailNotifyCategory) {
    setError("");
    try {
      await runSave(
        async () => {
          const result = await api<{ integrations: IntegrationSettingsPublic }>("/api/admin/integrations/mailrelay", {
            method: "PUT",
            body: JSON.stringify({ disconnectGoogleCategory: category } satisfies UpdateIntegrationMailRelayInput)
          });
          applySettings(result.integrations);
        },
        { successMessage: "Google-account ontkoppeld." }
      );
      setMessage("Google-account ontkoppeld.");
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : "Ontkoppelen mislukt.");
    }
  }

  async function saveGoogleAds() {
    if (!googleForm || savingKey) return;
    setSavingKey("google");
    setMessage("");
    setError("");
    const payload: UpdateIntegrationGoogleAdsInput = {
      enabled: googleForm.enabled,
      conversionId: googleForm.conversionId.trim()
    };
    try {
      await runSave(
        async () => {
          const result = await api<{ integrations: IntegrationSettingsPublic }>("/api/admin/integrations/google-ads", {
            method: "PUT",
            body: JSON.stringify(payload)
          });
          applySettings(result.integrations);
        },
        { successMessage: "Google Ads opgeslagen." }
      );
      setMessage("Google Ads opgeslagen.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Opslaan mislukt.");
    } finally {
      setSavingKey(null);
    }
  }

  async function saveNewsletter() {
    if (!newsletterForm || savingKey) return;
    setSavingKey("newsletter");
    setMessage("");
    setError("");
    const payload: UpdateIntegrationNewsletterInput = { ...newsletterForm };
    try {
      await runSave(
        async () => {
          const result = await api<{ integrations: IntegrationSettingsPublic }>("/api/admin/integrations/newsletter", {
            method: "PUT",
            body: JSON.stringify(payload)
          });
          applySettings(result.integrations);
        },
        { successMessage: "Nieuwsbrief-instellingen opgeslagen." }
      );
      setMessage("Nieuwsbrief-instellingen opgeslagen.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Opslaan mislukt.");
    } finally {
      setSavingKey(null);
    }
  }

  async function sendTestMail() {
    if (testing) return;
    setTesting(true);
    setMessage("");
    setError("");
    try {
      const result = await api<{ message: string; integrations: IntegrationSettingsPublic }>(
        "/api/admin/integrations/mailrelay/test",
        {
          method: "POST",
          body: JSON.stringify({ to: testRecipient })
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

  function handleRequestIntegration(item: AvailableIntegration) {
    requestIntegrationMailto(item);
    const next = Array.from(new Set([...requestedIds, item.id]));
    setRequestedIds(next);
    window.localStorage.setItem(REQUESTED_STORAGE_KEY, JSON.stringify(next));
  }

  if (loading) {
    return <div className="ta-empty">Integraties laden...</div>;
  }

  return (
    <div data-quiet-skip="" className="ta-integrations-hub">
      <EntraCommands>
        {VIEW_TABS.map((tab) => (
          <EntraCommand key={tab.id} active={view === tab.id} onClick={() => setView(tab.id)}>
            {tab.label}
          </EntraCommand>
        ))}
      </EntraCommands>

      <header className="ta-integrations-view-head">
        <h3>{copy.title}</h3>
        <p>{copy.subtitle}</p>
      </header>

      {error ? <p className="ta-error">{error}</p> : null}
      {message ? <p className="ta-success">{message}</p> : null}

        {view === "overview" ? (
          <div className="ta-integration-overview">
            <div className="ta-integration-overview-grid">
              {statusItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`ta-integration-chip${item.active ? " is-active" : ""}`}
                  onClick={() => setView(item.id as IntegrationsView)}
                >
                  <div className="ta-integration-chip-top">
                    <strong>{item.label}</strong>
                    <StatusBadge active={item.active} />
                  </div>
                  <span>{item.detail}</span>
                </button>
              ))}
            </div>
            <EntraCommands>
              <EntraCommand onClick={() => setView("mail")}>E-mail instellen</EntraCommand>
              <EntraCommand onClick={() => setView("googleAds")}>Google Ads</EntraCommand>
              <EntraCommand onClick={() => setView("newsletter")}>Nieuwsbrief</EntraCommand>
            </EntraCommands>
          </div>
        ) : null}

        {view === "mail" && mailForm ? (
          <div className="ta-integrations-mail">
            <label className="ta-check">
              <input
                type="checkbox"
                checked={mailForm.enabled}
                onChange={(event) => setMailForm((current) => (current ? { ...current, enabled: event.target.checked } : current))}
              />
              <span>Mailrelay actief</span>
            </label>

            <div className="ta-grid">
              <label className="ta-field">
                <span>Provider</span>
                <select
                  value={mailForm.provider}
                  onChange={(event) => {
                    const provider = event.target.value as MailRelayProvider;
                    setMailForm((current) =>
                      current
                        ? {
                            ...current,
                            provider,
                            host:
                              provider === "outlook"
                                ? current.host || "smtp.office365.com"
                                : provider === "google"
                                  ? "smtp.gmail.com"
                                  : current.host,
                            port: provider === "google" ? "465" : current.port,
                            secure: provider === "google" ? true : current.secure
                          }
                        : current
                    );
                  }}
                >
                  <option value="google">Google (Gmail / Workspace)</option>
                  <option value="smtp">SMTP / andere provider</option>
                  <option value="outlook">Outlook / Microsoft 365</option>
                </select>
              </label>
              <label className="ta-field">
                <span>Afzender naam</span>
                <input
                  value={mailForm.fromName}
                  onChange={(event) =>
                    setMailForm((current) => (current ? { ...current, fromName: event.target.value } : current))
                  }
                  placeholder="Tres Amigos"
                />
              </label>
            </div>

            {mailForm.provider === "google" ? (
              <>
                <p className="ta-seo-hint">
                  Tres Amigos-domeinen lopen via Google. Log per categorie één keer in met het juiste Google-account
                  (bijv. Vilmon@tresamigos.nl voor franchise).
                </p>
                {!settings?.mailRelay.googleOAuthConfigured ? (
                  <p className="ta-error">Zet GOOGLE_MAIL_CLIENT_ID en GOOGLE_MAIL_CLIENT_SECRET in .env om te koppelen.</p>
                ) : null}

                <div className="ta-integrations-categories">
                  {CATEGORY_META.map((category) => {
                    const connected = googleByCategory[category.id];
                    const Icon =
                      category.id === "applications"
                        ? IconApplications
                        : category.id === "catering"
                          ? IconCatering
                          : category.id === "franchise"
                            ? IconFranchise
                            : IconIntegrations;
                    return (
                      <article key={category.id} className="ta-integrations-category">
                        <header>
                          <Icon width={18} height={18} />
                          <div>
                            <strong>{category.label}</strong>
                            <small>{category.hint}</small>
                          </div>
                          <StatusBadge active={connected.connected} />
                        </header>
                        <label className="ta-field">
                          <span>Inbox / Google-account</span>
                          <input
                            type="email"
                            value={mailForm.notifications[category.id]}
                            placeholder={category.placeholder}
                            onChange={(event) =>
                              setMailForm((current) =>
                                current
                                  ? {
                                      ...current,
                                      notifications: { ...current.notifications, [category.id]: event.target.value }
                                    }
                                  : current
                              )
                            }
                          />
                        </label>
                        <div className="ta-integrations-category-actions">
                          {connected.connected ? (
                            <>
                              <span className="ta-seo-hint">Gekoppeld als {connected.email}</span>
                              <EntraCommands>
                                <EntraCommand
                                  onClick={() => void connectGoogleMail(category.id)}
                                  disabled={!settings?.mailRelay.googleOAuthConfigured || connectingCategory === category.id}
                                >
                                  {connectingCategory === category.id ? "Bezig..." : "Opnieuw inloggen"}
                                </EntraCommand>
                                <EntraCommand danger onClick={() => void disconnectGoogleCategory(category.id)}>
                                  Ontkoppelen
                                </EntraCommand>
                              </EntraCommands>
                            </>
                          ) : (
                            <EntraCommands>
                              <EntraCommand
                                active
                                onClick={() => void connectGoogleMail(category.id)}
                                disabled={!settings?.mailRelay.googleOAuthConfigured || connectingCategory === category.id}
                              >
                                {connectingCategory === category.id
                                  ? "Bezig..."
                                  : `Inloggen met Google (${mailForm.notifications[category.id] || category.placeholder})`}
                              </EntraCommand>
                            </EntraCommands>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="ta-grid">
                <label className="ta-field">
                  <span>SMTP host</span>
                  <input
                    value={mailForm.host}
                    onChange={(event) => setMailForm((current) => (current ? { ...current, host: event.target.value } : current))}
                    placeholder={mailForm.provider === "outlook" ? "smtp.office365.com" : "smtp.provider.nl"}
                  />
                </label>
                <label className="ta-field">
                  <span>Poort</span>
                  <input
                    value={mailForm.port}
                    onChange={(event) => setMailForm((current) => (current ? { ...current, port: event.target.value } : current))}
                    inputMode="numeric"
                    placeholder="587"
                  />
                </label>
                <label className="ta-check" style={{ alignSelf: "end" }}>
                  <input
                    type="checkbox"
                    checked={mailForm.secure}
                    onChange={(event) =>
                      setMailForm((current) => (current ? { ...current, secure: event.target.checked } : current))
                    }
                  />
                  <span>SSL direct</span>
                </label>
                <label className="ta-field">
                  <span>Gebruiker</span>
                  <input
                    value={mailForm.username}
                    onChange={(event) =>
                      setMailForm((current) => (current ? { ...current, username: event.target.value } : current))
                    }
                    autoComplete="off"
                  />
                </label>
                <label className="ta-field">
                  <span>Wachtwoord</span>
                  <input
                    type="password"
                    value={mailForm.password}
                    onChange={(event) =>
                      setMailForm((current) => (current ? { ...current, password: event.target.value } : current))
                    }
                    autoComplete="new-password"
                    placeholder={settings?.mailRelay.passwordSet ? "•••••••• (blijft behouden)" : ""}
                  />
                </label>
                <label className="ta-field">
                  <span>Afzender e-mail</span>
                  <input
                    value={mailForm.fromEmail}
                    onChange={(event) =>
                      setMailForm((current) => (current ? { ...current, fromEmail: event.target.value } : current))
                    }
                    placeholder="no-reply@tresamigos.nl"
                  />
                </label>
                {CATEGORY_META.map((category) => (
                  <label className="ta-field" key={category.id}>
                    <span>{category.label}</span>
                    <input
                      type="email"
                      value={mailForm.notifications[category.id]}
                      placeholder={category.placeholder}
                      onChange={(event) =>
                        setMailForm((current) =>
                          current
                            ? {
                                ...current,
                                notifications: { ...current.notifications, [category.id]: event.target.value }
                              }
                            : current
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            )}

            {settings?.mailRelay.envFallbackConfigured ? (
              <p className="ta-seo-hint">Fallback: SMTP uit .env is beschikbaar als mailrelay uitstaat of incompleet is.</p>
            ) : null}

            <EntraCommands>
              <EntraCommand active disabled={savingKey === "mail"} onClick={() => void saveMailRelay()}>
                {savingKey === "mail" ? "Opslaan..." : "Opslaan"}
              </EntraCommand>
            </EntraCommands>

            <div className="ta-integration-monitor">
              <strong>Test</strong>
              <span>
                Laatste:{" "}
                {settings?.mailRelay.lastTestAt
                  ? new Date(settings.mailRelay.lastTestAt).toLocaleString("nl-NL")
                  : "nog niet getest"}
                {settings?.mailRelay.lastMessage ? ` — ${settings.mailRelay.lastMessage}` : ""}
              </span>
              <div className="ta-grid" style={{ marginTop: 8 }}>
                <label className="ta-field">
                  <span>Testontvanger</span>
                  <input
                    value={testRecipient}
                    onChange={(event) => setTestRecipient(event.target.value)}
                    placeholder={mailForm.notifications.other || "test@email.nl"}
                  />
                </label>
                <div style={{ alignSelf: "end" }}>
                  <EntraCommand onClick={() => void sendTestMail()} disabled={testing}>
                    {testing ? "Testen..." : "Testmail"}
                  </EntraCommand>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {view === "googleAds" && googleForm ? (
          <div>
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
                {settings?.googleAds.enabled
                  ? `Live via gtag.js (${settings.googleAds.conversionId})`
                  : "Uitgeschakeld — niet geladen op de site"}
              </span>
            </div>
            <EntraCommands>
              <EntraCommand active disabled={savingKey === "google"} onClick={() => void saveGoogleAds()}>
                {savingKey === "google" ? "Opslaan..." : "Opslaan"}
              </EntraCommand>
            </EntraCommands>
          </div>
        ) : null}

        {view === "newsletter" && newsletterForm ? (
          <div>
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
                <span>Homepage</span>
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
                <span>Andere pagina&apos;s</span>
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
                <span>Boven de footer</span>
              </label>
            </div>
            <EntraCommands>
              <EntraCommand active disabled={savingKey === "newsletter"} onClick={() => void saveNewsletter()}>
                {savingKey === "newsletter" ? "Opslaan..." : "Opslaan"}
              </EntraCommand>
            </EntraCommands>
          </div>
        ) : null}

        {view === "extra" ? (
          <div className="ta-integration-available-grid">
            {AVAILABLE_INTEGRATIONS.map((item) => {
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
                  <div className="ta-integration-body">
                    <EntraCommand active={!requested} onClick={() => handleRequestIntegration(item)}>
                      {requested ? "Opnieuw aanvragen" : "Aanvragen"}
                    </EntraCommand>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
    </div>
  );
}
