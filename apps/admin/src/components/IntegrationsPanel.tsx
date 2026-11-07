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
  IconIntegrations,
  IconNewsletter,
  IconSeo
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
  googleClientId: string;
  googleClientSecret: string;
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
const GOOGLE_ICON = "/assets/brand/platforms/google-g.png";
const OUTLOOK_ICON = "/assets/brand/platforms/outlook.png";
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

const TITLES: Record<IntegrationsView, { title: string; subtitle: string }> = {
  overview: { title: "Alle koppelingen", subtitle: "Klik op een rij om in te stellen" },
  mail: {
    title: "E-mail",
    subtitle: "Google (OAuth of SMTP), Outlook of eigen SMTP — daarna inbox per categorie"
  },
  googleAds: { title: "Google Ads", subtitle: "gtag.js conversietag op de website" },
  newsletter: { title: "Nieuwsbrief", subtitle: "Waar het aanmeldformulier zichtbaar is" },
  extra: { title: "Op aanvraag", subtitle: "Extra koppelingen aanvragen" }
};

type SmtpPreset = "google" | "outlook" | "custom";

function detectSmtpPreset(host: string, provider: MailRelayProvider): SmtpPreset {
  if (provider === "outlook") return "outlook";
  const h = host.trim().toLowerCase();
  if (h === "smtp.gmail.com" || h.includes("gmail")) return "google";
  if (h === "smtp.office365.com" || h.includes("office365") || h.includes("outlook")) return "outlook";
  return "custom";
}

function applySmtpPreset(current: MailForm, preset: SmtpPreset): MailForm {
  if (preset === "google") {
    return {
      ...current,
      provider: "smtp",
      host: "smtp.gmail.com",
      port: "465",
      secure: true
    };
  }
  if (preset === "outlook") {
    return {
      ...current,
      provider: "outlook",
      host: "smtp.office365.com",
      port: "587",
      secure: false
    };
  }
  return {
    ...current,
    provider: "smtp",
    host: current.host === "smtp.gmail.com" || current.host === "smtp.office365.com" ? "" : current.host,
    port: current.port || "587",
    secure: false
  };
}

function ProviderIcon({ provider }: { provider: "google" | "outlook" }) {
  return (
    <img
      className="ta-provider-icon"
      src={provider === "google" ? GOOGLE_ICON : OUTLOOK_ICON}
      alt=""
      width={18}
      height={18}
    />
  );
}

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
    notifications: { ...DEFAULT_NOTIFICATIONS, ...settings.notifications },
    googleClientId: settings.googleClientId || "",
    googleClientSecret: ""
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

function StatusBadge({ active, label }: { active: boolean; label?: string }) {
  return (
    <span className={`ta-integration-status${active ? " is-active" : " is-off"}`}>
      <span className="ta-integration-status-dot" aria-hidden="true" />
      {label || (active ? "Actief" : "Uit")}
    </span>
  );
}

function requestIntegrationMailto(item: AvailableIntegration) {
  const subject = encodeURIComponent(`Integratie aanvragen: ${item.title}`);
  const body = encodeURIComponent(
    [
      `Hoi Tres Amigos-team,`,
      ``,
      `Ik wil graag de integratie "${item.title}" activeren.`,
      ``,
      `Bedankt!`
    ].join("\n")
  );
  window.location.href = `mailto:${REQUEST_EMAIL}?subject=${subject}&body=${body}`;
}

function setProviderDefaults(current: MailForm, provider: MailRelayProvider): MailForm {
  if (provider === "google") {
    return { ...current, provider };
  }
  if (provider === "outlook") {
    return applySmtpPreset(current, "outlook");
  }
  // SMTP: standaard Google Workspace-preset (tijdelijk tot OAuth rond is).
  return applySmtpPreset(current, "google");
}

export function IntegrationsPanel({
  initialSubView = null,
  onSubViewChange
}: {
  initialSubView?: string | null;
  onSubViewChange?: (sub: string | null) => void;
} = {}) {
  const { runSave } = useAdminFeedback();
  const [view, setView] = useState<IntegrationsView>(() => {
    if (
      initialSubView === "mail" ||
      initialSubView === "googleAds" ||
      initialSubView === "newsletter" ||
      initialSubView === "extra"
    ) {
      return initialSubView;
    }
    return "overview";
  });
  const [settings, setSettings] = useState<IntegrationSettingsPublic | null>(null);
  const [mailForm, setMailForm] = useState<MailForm | null>(null);
  const [googleForm, setGoogleForm] = useState<GoogleAdsForm | null>(null);
  const [newsletterForm, setNewsletterForm] = useState<NewsletterForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<"mail" | "google" | "newsletter" | null>(null);
  const [testingTarget, setTestingTarget] = useState<MailNotifyCategory | "relay" | null>(null);
  const [testRecipient, setTestRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [requestedIds, setRequestedIds] = useState<string[]>(() => readRequestedIds());
  const [connectingCategory, setConnectingCategory] = useState<MailNotifyCategory | null>(null);
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const [oauthExpanded, setOauthExpanded] = useState(false);
  const [editingOauth, setEditingOauth] = useState(false);
  const [clearingSecret, setClearingSecret] = useState(false);

  function changeView(next: IntegrationsView) {
    setView(next);
    onSubViewChange?.(next === "overview" ? null : next);
  }

  const copy = TITLES[view];
  const googleByCategory = settings?.mailRelay.googleByCategory || EMPTY_GOOGLE_BY_CATEGORY;

  const connectedCategories = useMemo(
    () => CATEGORY_META.filter((item) => googleByCategory[item.id].connected).length,
    [googleByCategory]
  );

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
      changeView("mail");
      setMessage(`Google gekoppeld${params.get("email") ? `: ${params.get("email")}` : ""}.`);
      void loadSettings();
    }
    if (googleMail === "error") {
      changeView("mail");
      setError(params.get("message") || "Google login mislukt.");
    }
    params.delete("googleMail");
    params.delete("email");
    params.delete("category");
    params.delete("message");
    const next = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`);
  }, []);

  const listItems = useMemo(() => {
    if (!settings) return [];
    return [
      {
        id: "mail" as const,
        label: "E-mail",
        hint: "Google OAuth, Google SMTP of Outlook",
        active: settings.mailRelay.enabled,
        detail:
          settings.mailRelay.provider === "google"
            ? `Google OAuth · ${connectedCategories}/4 categorieën gekoppeld`
            : settings.mailRelay.provider === "outlook"
              ? "Outlook / Microsoft 365"
              : detectSmtpPreset(settings.mailRelay.host, "smtp") === "google"
                ? "Google SMTP (app-wachtwoord)"
                : "SMTP"
      },
      {
        id: "googleAds" as const,
        label: "Google Ads",
        hint: "Conversietag op de website",
        active: settings.googleAds.enabled,
        detail: settings.googleAds.conversionId || "Geen ID"
      },
      {
        id: "newsletter" as const,
        label: "Nieuwsbrief",
        hint: "Aanmeldformulieren",
        active: settings.newsletter.enabled,
        detail: [
          settings.newsletter.showHome ? "Home" : null,
          settings.newsletter.showPages ? "Pagina's" : null,
          settings.newsletter.showFooter ? "Footer" : null
        ]
          .filter(Boolean)
          .join(" · ") || "Uit"
      },
      {
        id: "extra" as const,
        label: "Meer koppelingen",
        hint: "Mollie, PostNL en andere",
        active: false,
        detail: "Op aanvraag"
      }
    ];
  }, [settings, connectedCategories]);

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
      notifications: mailForm.notifications,
      googleClientId: mailForm.googleClientId,
      // Alleen meesturen als er echt een nieuwe secret is getypt — leeg wist nooit.
      ...(mailForm.googleClientSecret.trim()
        ? { googleClientSecret: mailForm.googleClientSecret.trim() }
        : {})
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
      // Geen login_hint: Google toont accountkiezer; gekozen account = koppeling.
      const query = new URLSearchParams({ category });
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

  async function clearGoogleSecret() {
    if (clearingSecret) return;
    if (!window.confirm("Google client secret wissen? Daarna moet je een nieuwe secret opslaan.")) return;
    setClearingSecret(true);
    setError("");
    try {
      await runSave(
        async () => {
          const result = await api<{ integrations: IntegrationSettingsPublic }>(
            "/api/admin/integrations/mailrelay/google/clear-secret",
            { method: "POST", body: JSON.stringify({}) }
          );
          applySettings(result.integrations);
          setMailForm((current) => (current ? { ...current, googleClientSecret: "" } : current));
          setEditingOauth(true);
        },
        { successMessage: "Google client secret gewist." }
      );
      setMessage("Google client secret gewist.");
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Secret wissen mislukt.");
    } finally {
      setClearingSecret(false);
    }
  }

  async function saveGoogleAds() {
    if (!googleForm || savingKey) return;
    setSavingKey("google");
    setMessage("");
    setError("");
    try {
      await runSave(
        async () => {
          const result = await api<{ integrations: IntegrationSettingsPublic }>("/api/admin/integrations/google-ads", {
            method: "PUT",
            body: JSON.stringify({
              enabled: googleForm.enabled,
              conversionId: googleForm.conversionId.trim()
            } satisfies UpdateIntegrationGoogleAdsInput)
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
    try {
      await runSave(
        async () => {
          const result = await api<{ integrations: IntegrationSettingsPublic }>("/api/admin/integrations/newsletter", {
            method: "PUT",
            body: JSON.stringify({ ...newsletterForm } satisfies UpdateIntegrationNewsletterInput)
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

  async function sendTestMail(category?: MailNotifyCategory) {
    if (testingTarget) return;
    const target = category || "relay";
    setTestingTarget(target);
    setMessage("");
    setError("");
    try {
      const result = await api<{ message: string; integrations: IntegrationSettingsPublic }>(
        "/api/admin/integrations/mailrelay/test",
        { method: "POST", body: JSON.stringify({ to: testRecipient, category }) }
      );
      applySettings(result.integrations);
      setMessage(result.message);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Testmail mislukt.");
    } finally {
      setTestingTarget(null);
    }
  }

  function handleRequestIntegration(item: AvailableIntegration) {
    requestIntegrationMailto(item);
    const next = Array.from(new Set([...requestedIds, item.id]));
    setRequestedIds(next);
    window.localStorage.setItem(REQUESTED_STORAGE_KEY, JSON.stringify(next));
  }

  function chooseProvider(provider: MailRelayProvider) {
    setMailForm((current) => (current ? setProviderDefaults(current, provider) : current));
    setProviderMenuOpen(false);
  }

  if (loading) {
    return <div className="ta-empty">Integraties laden...</div>;
  }

  return (
    <div data-quiet-skip="" className="ta-integrations-hub">
      {view !== "overview" ? (
        <EntraCommands>
          <EntraCommand onClick={() => changeView("overview")}>← Alle koppelingen</EntraCommand>
        </EntraCommands>
      ) : null}

      <header className="ta-integrations-view-head">
        <h3>{copy.title}</h3>
        <p>{copy.subtitle}</p>
      </header>

      {error ? <p className="ta-error">{error}</p> : null}
      {message ? <p className="ta-success">{message}</p> : null}

      {view === "overview" ? (
        <div className="ta-integrations-list">
          {listItems.map((item) => (
            <button key={item.id} type="button" className="ta-integrations-row" onClick={() => changeView(item.id)}>
              <span className="ta-integrations-row-copy">
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
                <span>{item.detail}</span>
              </span>
              <StatusBadge active={item.active} label={item.id === "extra" ? "Op aanvraag" : undefined} />
              <span className="ta-integrations-row-chevron" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
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

          <div className="ta-provider-field">
            <span className="ta-provider-label">Inloggen via</span>
            <div className="ta-provider-select">
              <button
                type="button"
                className="ta-provider-trigger"
                aria-expanded={providerMenuOpen}
                onClick={() => setProviderMenuOpen((open) => !open)}
              >
                {mailForm.provider === "google" ? <ProviderIcon provider="google" /> : null}
                {mailForm.provider === "outlook" ? <ProviderIcon provider="outlook" /> : null}
                {mailForm.provider === "smtp" ? <IconIntegrations width={18} height={18} /> : null}
                <span>
                  {mailForm.provider === "google"
                    ? "Google OAuth (inloggen)"
                    : mailForm.provider === "outlook"
                      ? "Outlook / Microsoft 365"
                      : detectSmtpPreset(mailForm.host, "smtp") === "google"
                        ? "Google SMTP (app-wachtwoord)"
                        : "SMTP / andere provider"}
                </span>
                <span className="ta-provider-caret">▾</span>
              </button>
              {providerMenuOpen ? (
                <div className="ta-provider-menu" role="listbox">
                  <button type="button" className={mailForm.provider === "google" ? "is-active" : ""} onClick={() => chooseProvider("google")}>
                    <ProviderIcon provider="google" />
                    <span>
                      <strong>Google OAuth</strong>
                      <small>Inloggen met Workspace — later, na Google-verificatie</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={mailForm.provider === "smtp" && detectSmtpPreset(mailForm.host, "smtp") === "google" ? "is-active" : ""}
                    onClick={() => {
                      setMailForm((current) => (current ? applySmtpPreset(current, "google") : current));
                      setProviderMenuOpen(false);
                    }}
                  >
                    <ProviderIcon provider="google" />
                    <span>
                      <strong>Google SMTP</strong>
                      <small>Tijdelijk · smtp.gmail.com + app-wachtwoord</small>
                    </span>
                  </button>
                  <button type="button" className={mailForm.provider === "outlook" ? "is-active" : ""} onClick={() => chooseProvider("outlook")}>
                    <ProviderIcon provider="outlook" />
                    <span>
                      <strong>Outlook</strong>
                      <small>Microsoft 365 SMTP</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={mailForm.provider === "smtp" && detectSmtpPreset(mailForm.host, "smtp") === "custom" ? "is-active" : ""}
                    onClick={() => {
                      setMailForm((current) => (current ? applySmtpPreset(current, "custom") : current));
                      setProviderMenuOpen(false);
                    }}
                  >
                    <IconIntegrations width={18} height={18} />
                    <span>
                      <strong>Eigen SMTP</strong>
                      <small>Host, poort, SSL en inlog zelf invullen</small>
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <label className="ta-field">
            <span>Afzender naam</span>
            <input
              value={mailForm.fromName}
              onChange={(event) => setMailForm((current) => (current ? { ...current, fromName: event.target.value } : current))}
              placeholder="Tres Amigos"
            />
          </label>

          {mailForm.provider === "google" ? (
            <>
              <div className="ta-mail-owner-help">
                <strong>Mailbox koppelen</strong>
                <p>
                  Klik hieronder op <em>Inloggen met Google</em> bij jouw categorie. Kies het Google-adres van die mailbox
                  en geef toestemming. Klaar — mails gaan daarna vanaf dat adres.
                </p>
              </div>

              {!settings?.mailRelay.googleOAuthConfigured ? (
                <p className="ta-error" style={{ margin: 0 }}>
                  Techniek nog niet klaar. Vraag de beheerder om de Google-app-instellingen open te klappen en op te
                  slaan. Of kies tijdelijk Google SMTP.
                </p>
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
                      {connected.connected ? (
                        <p className="ta-oauth-echo">
                          Ingelogd als <strong>{connected.email}</strong>
                        </p>
                      ) : (
                        <p className="ta-seo-hint" style={{ margin: 0 }}>
                          Nog niet gekoppeld — log in met het Google-adres voor {category.label.toLowerCase()}.
                        </p>
                      )}
                      <div className="ta-integrations-category-actions">
                        {connected.connected ? (
                          <EntraCommands>
                            <EntraCommand
                              onClick={() => void sendTestMail(category.id)}
                              disabled={testingTarget !== null}
                            >
                              {testingTarget === category.id ? "Testen..." : "Testmail"}
                            </EntraCommand>
                            <EntraCommand
                              onClick={() => void connectGoogleMail(category.id)}
                              disabled={
                                !settings?.mailRelay.googleOAuthConfigured ||
                                connectingCategory === category.id ||
                                testingTarget !== null
                              }
                            >
                              {connectingCategory === category.id ? "Bezig..." : "Opnieuw inloggen"}
                            </EntraCommand>
                            <EntraCommand danger onClick={() => void disconnectGoogleCategory(category.id)}>
                              Ontkoppelen
                            </EntraCommand>
                          </EntraCommands>
                        ) : (
                          <button
                            type="button"
                            className="ta-provider-login"
                            disabled={!settings?.mailRelay.googleOAuthConfigured || connectingCategory === category.id}
                            onClick={() => void connectGoogleMail(category.id)}
                          >
                            <ProviderIcon provider="google" />
                            <span>{connectingCategory === category.id ? "Bezig..." : "Inloggen met Google"}</span>
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className={`ta-oauth-creds${oauthExpanded ? " is-open" : ""}`}>
                <button
                  type="button"
                  className="ta-oauth-creds-toggle"
                  aria-expanded={oauthExpanded}
                  onClick={() => setOauthExpanded((open) => !open)}
                >
                  <strong>Technische Google-instellingen</strong>
                  <span className="ta-seo-hint">
                    {settings?.mailRelay.googleOAuthConfigured ? "Gekoppeld · alleen voor beheerder" : "Nog niet compleet"}
                  </span>
                  <span className="ta-provider-caret" aria-hidden="true">
                    {oauthExpanded ? "▴" : "▾"}
                  </span>
                </button>

                {oauthExpanded ? (
                  <div className="ta-oauth-creds-body">
                    <p className="ta-seo-hint" style={{ margin: 0 }}>
                      Alleen nodig bij eerste setup. Mailbox-eigenaren hoeven dit niet te wijzigen. Tijdelijk zonder
                      OAuth? Kies{" "}
                      <button
                        type="button"
                        className="ta-btn ta-btn-ghost"
                        style={{ display: "inline", padding: "2px 8px", verticalAlign: "baseline" }}
                        onClick={() => {
                          setMailForm((current) => (current ? applySmtpPreset(current, "google") : current));
                        }}
                      >
                        Google SMTP
                      </button>
                      .
                    </p>

                    {settings?.mailRelay.googleOAuthConfigured && !editingOauth ? (
                      <>
                        <div className="ta-oauth-echo-grid">
                          <div>
                            <span className="ta-seo-hint">Redirect URI</span>
                            <p className="ta-oauth-echo">
                              {settings.mailRelay.googleRedirectUri ||
                                "https://tresamigos.nl/api/integrations/mailrelay/google/callback"}
                            </p>
                          </div>
                          <div>
                            <span className="ta-seo-hint">Client ID</span>
                            <p className="ta-oauth-echo">{settings.mailRelay.googleClientId || mailForm.googleClientId}</p>
                          </div>
                          <div>
                            <span className="ta-seo-hint">Client Secret</span>
                            <p className="ta-oauth-echo">
                              {settings.mailRelay.googleClientSecretMasked || "••••••••"}
                              {settings.mailRelay.googleOAuthSource === "env" ? " (via .env)" : " (opgeslagen)"}
                            </p>
                          </div>
                        </div>
                        <EntraCommands>
                          <EntraCommand
                            onClick={() => {
                              setEditingOauth(true);
                              setMailForm((current) =>
                                current
                                  ? { ...current, googleClientId: settings.mailRelay.googleClientId || "", googleClientSecret: "" }
                                  : current
                              );
                            }}
                          >
                            Wijzigen
                          </EntraCommand>
                          {settings.mailRelay.googleOAuthSource !== "env" ? (
                            <EntraCommand danger disabled={clearingSecret} onClick={() => void clearGoogleSecret()}>
                              {clearingSecret ? "Wissen..." : "Secret wissen"}
                            </EntraCommand>
                          ) : null}
                        </EntraCommands>
                      </>
                    ) : (
                      <>
                        <label className="ta-field">
                          <span>Redirect URI (kopieer naar Google Cloud)</span>
                          <input
                            readOnly
                            value={
                              settings?.mailRelay.googleRedirectUri ||
                              "https://tresamigos.nl/api/integrations/mailrelay/google/callback"
                            }
                            onFocus={(event) => event.currentTarget.select()}
                          />
                        </label>
                        <label className="ta-field">
                          <span>Client ID</span>
                          <input
                            value={mailForm.googleClientId}
                            onChange={(event) =>
                              setMailForm((current) =>
                                current ? { ...current, googleClientId: event.target.value } : current
                              )
                            }
                            autoComplete="off"
                            placeholder="xxxxx.apps.googleusercontent.com"
                          />
                        </label>
                        <label className="ta-field">
                          <span>Client Secret</span>
                          {settings?.mailRelay.googleClientSecretSet ? (
                            <p className="ta-oauth-secret-masked">
                              Nu: {settings.mailRelay.googleClientSecretMasked || "••••••••"} — leeg laten = behouden
                            </p>
                          ) : null}
                          <input
                            type="password"
                            value={mailForm.googleClientSecret}
                            onChange={(event) =>
                              setMailForm((current) =>
                                current ? { ...current, googleClientSecret: event.target.value } : current
                              )
                            }
                            autoComplete="new-password"
                            placeholder={
                              settings?.mailRelay.googleClientSecretSet
                                ? "Nieuwe secret (leeg = ongewijzigd)"
                                : "Plak hier de client secret"
                            }
                          />
                        </label>
                        {editingOauth ? (
                          <EntraCommand
                            onClick={() => {
                              setEditingOauth(false);
                              setMailForm((current) => (current ? { ...current, googleClientSecret: "" } : current));
                            }}
                          >
                            Annuleren wijzigen
                          </EntraCommand>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="ta-grid">
              <div className="ta-grid-wide ta-smtp-presets">
                <span className="ta-provider-label">SMTP-preset</span>
                <div className="ta-smtp-preset-row">
                  <button
                    type="button"
                    className={detectSmtpPreset(mailForm.host, mailForm.provider) === "google" ? "is-active" : ""}
                    onClick={() => setMailForm((current) => (current ? applySmtpPreset(current, "google") : current))}
                  >
                    <ProviderIcon provider="google" />
                    Google Workspace
                  </button>
                  <button
                    type="button"
                    className={mailForm.provider === "outlook" ? "is-active" : ""}
                    onClick={() => setMailForm((current) => (current ? applySmtpPreset(current, "outlook") : current))}
                  >
                    <ProviderIcon provider="outlook" />
                    Outlook 365
                  </button>
                  <button
                    type="button"
                    className={
                      mailForm.provider === "smtp" && detectSmtpPreset(mailForm.host, "smtp") === "custom" ? "is-active" : ""
                    }
                    onClick={() => setMailForm((current) => (current ? applySmtpPreset(current, "custom") : current))}
                  >
                    Eigen
                  </button>
                </div>
              </div>

              {mailForm.provider === "outlook" ? (
                <p className="ta-seo-hint ta-grid-wide">
                  Outlook: host <code>smtp.office365.com</code>, poort <code>587</code>, SSL uit. Gebruikersnaam = mailbox,
                  wachtwoord = app-wachtwoord of accountwachtwoord (afhankelijk van tenant).
                </p>
              ) : detectSmtpPreset(mailForm.host, "smtp") === "google" ? (
                <p className="ta-seo-hint ta-grid-wide">
                  Google Workspace / Gmail via SMTP (tijdelijk tot OAuth klaar is). Host{" "}
                  <code>smtp.gmail.com</code>, poort <code>465</code>, SSL aan. In Google-account: 2FA aan →{" "}
                  <strong>App-wachtwoord</strong> maken → dat plakken bij wachtwoord (niet het normale wachtwoord).
                  Gebruiker en afzender = het Workspace-adres (bijv. <code>info@bedrijf.nl</code>).
                </p>
              ) : (
                <p className="ta-seo-hint ta-grid-wide">
                  Vul host, poort, SSL, gebruiker en wachtwoord van je mailprovider in. Daarna inbox-adressen per
                  categorie.
                </p>
              )}

              <label className="ta-field">
                <span>SMTP host</span>
                <input
                  value={mailForm.host}
                  onChange={(event) => setMailForm((current) => (current ? { ...current, host: event.target.value } : current))}
                  placeholder={
                    mailForm.provider === "outlook"
                      ? "smtp.office365.com"
                      : detectSmtpPreset(mailForm.host, "smtp") === "google"
                        ? "smtp.gmail.com"
                        : "smtp.provider.nl"
                  }
                />
              </label>
              <label className="ta-field">
                <span>Poort</span>
                <input
                  value={mailForm.port}
                  onChange={(event) => setMailForm((current) => (current ? { ...current, port: event.target.value } : current))}
                  inputMode="numeric"
                  placeholder={mailForm.provider === "outlook" ? "587" : "465"}
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
                <span>SSL / TLS direct (poort 465)</span>
              </label>
              <label className="ta-field">
                <span>Gebruiker (e-mailadres)</span>
                <input
                  value={mailForm.username}
                  onChange={(event) => setMailForm((current) => (current ? { ...current, username: event.target.value } : current))}
                  autoComplete="off"
                  placeholder={
                    mailForm.provider === "outlook" || detectSmtpPreset(mailForm.host, "smtp") === "google"
                      ? "naam@bedrijf.nl"
                      : "smtp-gebruiker"
                  }
                />
              </label>
              <label className="ta-field">
                <span>
                  {detectSmtpPreset(mailForm.host, mailForm.provider) === "google"
                    ? "App-wachtwoord"
                    : mailForm.provider === "outlook"
                      ? "Wachtwoord / app-wachtwoord"
                      : "Wachtwoord"}
                </span>
                <input
                  type="password"
                  value={mailForm.password}
                  onChange={(event) => setMailForm((current) => (current ? { ...current, password: event.target.value } : current))}
                  autoComplete="new-password"
                  placeholder={
                    settings?.mailRelay.passwordSet
                      ? "•••••••• (blijft behouden als je leeg laat)"
                      : detectSmtpPreset(mailForm.host, mailForm.provider) === "google"
                        ? "16 tekens uit Google App-wachtwoorden"
                        : ""
                  }
                />
              </label>
              <label className="ta-field">
                <span>Afzender e-mail</span>
                <input
                  value={mailForm.fromEmail}
                  onChange={(event) => setMailForm((current) => (current ? { ...current, fromEmail: event.target.value } : current))}
                  placeholder="no-reply@tresamigos.nl"
                />
              </label>

              <p className="ta-seo-hint ta-grid-wide" style={{ margin: "8px 0 0" }}>
                Inbox per categorie (waar notificaties naartoe gaan). Mag hetzelfde adres zijn als de SMTP-gebruiker.
              </p>
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
                  <button
                    type="button"
                    className="ta-btn ta-btn-ghost"
                    style={{ marginTop: 8, justifySelf: "start" }}
                    disabled={testingTarget !== null || !mailForm.notifications[category.id].includes("@")}
                    onClick={() => void sendTestMail(category.id)}
                  >
                    {testingTarget === category.id ? "Testen..." : "Testmail"}
                  </button>
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
            <strong>Testmail</strong>
            <p className="ta-seo-hint" style={{ margin: "6px 0 0" }}>
              {mailForm.provider === "google"
                ? "Elke gekoppelde categorie heeft een eigen testmail. Leeg laten stuurt naar dat Google-account zelf."
                : detectSmtpPreset(mailForm.host, mailForm.provider) === "google"
                  ? "Test via Google SMTP (app-wachtwoord). Leeg laten stuurt naar het inbox-adres van die categorie."
                  : "Elke categorie hierboven heeft een testmail via deze SMTP-koppeling. Leeg laten stuurt naar het adres van die categorie."}
            </p>
            <div className="ta-grid" style={{ marginTop: 8 }}>
              <label className="ta-field">
                <span>Ontvanger (optioneel)</span>
                <input
                  value={testRecipient}
                  onChange={(event) => setTestRecipient(event.target.value)}
                  placeholder="Leeg = naar het ingestelde adres"
                />
              </label>
              {mailForm.provider !== "google" ? (
                <div style={{ alignSelf: "end" }}>
                  <EntraCommand onClick={() => void sendTestMail()} disabled={testingTarget !== null}>
                    {testingTarget === "relay" ? "Testen..." : "Test algemene mail"}
                  </EntraCommand>
                </div>
              ) : null}
            </div>
            {settings?.mailRelay.lastMessage ? <span>{settings.mailRelay.lastMessage}</span> : null}
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
            <span>Google Ads-tag actief</span>
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
            <span>Nieuwsbrief actief</span>
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
