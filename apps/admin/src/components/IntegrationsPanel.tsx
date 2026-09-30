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
const CLEAR_CONFIRM_WORD = "bevestig";

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
  mail: { title: "E-mail", subtitle: "Kies Google of Outlook, log daarna per categorie in" },
  googleAds: { title: "Google Ads", subtitle: "gtag.js conversietag op de website" },
  newsletter: { title: "Nieuwsbrief", subtitle: "Waar het aanmeldformulier zichtbaar is" },
  extra: { title: "Op aanvraag", subtitle: "Extra koppelingen aanvragen" }
};

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
    return { ...current, provider, host: "smtp.gmail.com", port: "465", secure: true };
  }
  if (provider === "outlook") {
    return {
      ...current,
      provider,
      host: current.host || "smtp.office365.com",
      port: current.port === "465" ? "587" : current.port || "587",
      secure: false
    };
  }
  return { ...current, provider };
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
  const [testing, setTesting] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [requestedIds, setRequestedIds] = useState<string[]>(() => readRequestedIds());
  const [connectingCategory, setConnectingCategory] = useState<MailNotifyCategory | null>(null);
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const [clearSecretStep, setClearSecretStep] = useState(0);
  const [clearSecretConfirm, setClearSecretConfirm] = useState("");
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
        hint: "Google of Outlook · inbox per categorie",
        active: settings.mailRelay.enabled,
        detail:
          settings.mailRelay.provider === "google"
            ? `Google · ${connectedCategories}/4 categorieën gekoppeld`
            : settings.mailRelay.provider === "outlook"
              ? "Outlook / Microsoft 365"
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
    if (clearSecretStep < 3 || clearSecretConfirm !== CLEAR_CONFIRM_WORD || clearingSecret) return;
    setClearingSecret(true);
    setError("");
    try {
      await runSave(
        async () => {
          const result = await api<{ integrations: IntegrationSettingsPublic }>(
            "/api/admin/integrations/mailrelay/google/clear-secret",
            {
              method: "POST",
              body: JSON.stringify({ confirmation: CLEAR_CONFIRM_WORD })
            }
          );
          applySettings(result.integrations);
          setMailForm((current) => (current ? { ...current, googleClientSecret: "" } : current));
        },
        { successMessage: "Google client secret gewist." }
      );
      setMessage("Google client secret gewist.");
      setClearSecretStep(0);
      setClearSecretConfirm("");
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

  async function sendTestMail() {
    if (testing) return;
    setTesting(true);
    setMessage("");
    setError("");
    try {
      const result = await api<{ message: string; integrations: IntegrationSettingsPublic }>(
        "/api/admin/integrations/mailrelay/test",
        { method: "POST", body: JSON.stringify({ to: testRecipient }) }
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
                    ? "Google (Gmail / Workspace)"
                    : mailForm.provider === "outlook"
                      ? "Outlook / Microsoft 365"
                      : "SMTP / andere provider"}
                </span>
                <span className="ta-provider-caret">▾</span>
              </button>
              {providerMenuOpen ? (
                <div className="ta-provider-menu" role="listbox">
                  <button type="button" className={mailForm.provider === "google" ? "is-active" : ""} onClick={() => chooseProvider("google")}>
                    <ProviderIcon provider="google" />
                    <span>
                      <strong>Google</strong>
                      <small>Workspace / Gmail — aanbevolen voor @tresamigos.nl</small>
                    </span>
                  </button>
                  <button type="button" className={mailForm.provider === "outlook" ? "is-active" : ""} onClick={() => chooseProvider("outlook")}>
                    <ProviderIcon provider="outlook" />
                    <span>
                      <strong>Outlook</strong>
                      <small>Microsoft 365 SMTP</small>
                    </span>
                  </button>
                  <button type="button" className={mailForm.provider === "smtp" ? "is-active" : ""} onClick={() => chooseProvider("smtp")}>
                    <IconIntegrations width={18} height={18} />
                    <span>
                      <strong>SMTP</strong>
                      <small>Handmatige host / poort</small>
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
              <div className="ta-oauth-creds">
                <div className="ta-oauth-creds-head">
                  <strong>Google OAuth Client</strong>
                  <span className="ta-seo-hint">
                    {settings?.mailRelay.googleOAuthConfigured
                      ? `Actief (${settings.mailRelay.googleOAuthSource === "db" ? "opgeslagen hier" : "via .env fallback"})`
                      : "Nog niet compleet — vul ID + secret in"}
                  </span>
                </div>
                <p className="ta-seo-hint" style={{ margin: 0 }}>
                  Haal Client ID en Secret uit Google Cloud Console → APIs &amp; Services → Credentials → OAuth 2.0 Client
                  (Web). Redirect URI:{" "}
                  <code>https://tresamigos.nl/api/integrations/mailrelay/google/callback</code>
                </p>
                <label className="ta-field">
                  <span>Client ID</span>
                  <input
                    value={mailForm.googleClientId}
                    onChange={(event) =>
                      setMailForm((current) => (current ? { ...current, googleClientId: event.target.value } : current))
                    }
                    autoComplete="off"
                    placeholder="xxxxx.apps.googleusercontent.com"
                  />
                </label>
                <div className="ta-oauth-secret-box">
                  <label className="ta-field">
                    <span>Client Secret</span>
                    {settings?.mailRelay.googleClientSecretSet ? (
                      <p className="ta-oauth-secret-masked">
                        Opgeslagen: {settings.mailRelay.googleClientSecretMasked || "••••••••"} — blijft behouden tenzij je
                        hieronder een nieuwe invult.
                      </p>
                    ) : (
                      <p className="ta-seo-hint" style={{ margin: "0 0 6px" }}>
                        Nog geen secret opgeslagen.
                      </p>
                    )}
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
                          ? "Nieuwe secret (leeg laten = ongewijzigd)"
                          : "Plak hier de client secret"
                      }
                    />
                  </label>
                  {settings?.mailRelay.googleClientSecretSet && settings.mailRelay.googleOAuthSource !== "env" ? (
                    <div className="ta-oauth-clear">
                      <strong>Secret wissen</strong>
                      <p className="ta-seo-hint" style={{ margin: 0 }}>
                        Mag nooit per ongeluk. Drie keer bevestigen, daarna exact <code>{CLEAR_CONFIRM_WORD}</code> typen.
                        Andere tekst wordt niet geaccepteerd.
                      </p>
                      <div className="ta-oauth-clear-steps">
                        {[1, 2, 3].map((step) => (
                          <button
                            key={step}
                            type="button"
                            className={`ta-btn ta-btn-ghost${clearSecretStep >= step ? " is-done" : ""}`}
                            disabled={clearSecretStep !== step - 1 || clearingSecret}
                            onClick={() => setClearSecretStep(step)}
                          >
                            Bevestig {step}/3
                          </button>
                        ))}
                      </div>
                      {clearSecretStep >= 3 ? (
                        <label className="ta-field">
                          <span>
                            Typ <code>{CLEAR_CONFIRM_WORD}</code>
                          </span>
                          <input
                            value={clearSecretConfirm}
                            onChange={(event) => setClearSecretConfirm(event.target.value)}
                            autoComplete="off"
                            placeholder={CLEAR_CONFIRM_WORD}
                          />
                          <button
                            type="button"
                            className="ta-btn"
                            style={{ marginTop: 8 }}
                            disabled={clearSecretConfirm !== CLEAR_CONFIRM_WORD || clearingSecret}
                            onClick={() => void clearGoogleSecret()}
                          >
                            {clearingSecret ? "Wissen..." : "Secret definitief verwijderen"}
                          </button>
                        </label>
                      ) : null}
                      {clearSecretStep > 0 ? (
                        <button
                          type="button"
                          className="ta-btn ta-btn-ghost"
                          onClick={() => {
                            setClearSecretStep(0);
                            setClearSecretConfirm("");
                          }}
                        >
                          Annuleren
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {!settings?.mailRelay.googleOAuthConfigured ? (
                <p className="ta-seo-hint">Sla Client ID en Secret op, daarna kun je per categorie inloggen.</p>
              ) : (
                <p className="ta-seo-hint">
                  Per categorie: Inloggen → Google-account kiezen → toestemming geven. Het gekozen account wordt de
                  koppeling (adressen hieronder zijn alleen hint, geen vooraf gekozen login).
                </p>
              )}

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
                        <span>Google-account</span>
                        <input
                          type="email"
                          value={connected.connected ? connected.email : ""}
                          placeholder={category.placeholder}
                          readOnly
                          autoComplete="off"
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
                                {connectingCategory === category.id ? "Bezig..." : "Opnieuw"}
                              </EntraCommand>
                              <EntraCommand danger onClick={() => void disconnectGoogleCategory(category.id)}>
                                Ontkoppelen
                              </EntraCommand>
                            </EntraCommands>
                          </>
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
            </>
          ) : (
            <div className="ta-grid">
              {mailForm.provider === "outlook" ? (
                <p className="ta-seo-hint ta-grid-wide">
                  Outlook gebruikt SMTP (smtp.office365.com). Vul gebruikersnaam en app-wachtwoord in, plus de inbox per
                  categorie.
                </p>
              ) : null}
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
                  onChange={(event) => setMailForm((current) => (current ? { ...current, username: event.target.value } : current))}
                  autoComplete="off"
                  placeholder={mailForm.provider === "outlook" ? "naam@tresamigos.nl" : ""}
                />
              </label>
              <label className="ta-field">
                <span>Wachtwoord</span>
                <input
                  type="password"
                  value={mailForm.password}
                  onChange={(event) => setMailForm((current) => (current ? { ...current, password: event.target.value } : current))}
                  autoComplete="new-password"
                  placeholder={settings?.mailRelay.passwordSet ? "•••••••• (blijft behouden)" : ""}
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
            <strong>Testmail</strong>
            <div className="ta-grid" style={{ marginTop: 8 }}>
              <label className="ta-field">
                <span>Ontvanger</span>
                <input
                  value={testRecipient}
                  onChange={(event) => setTestRecipient(event.target.value)}
                  placeholder={mailForm.notifications.other || "test@email.nl"}
                />
              </label>
              <div style={{ alignSelf: "end" }}>
                <EntraCommand onClick={() => void sendTestMail()} disabled={testing}>
                  {testing ? "Testen..." : "Versturen"}
                </EntraCommand>
              </div>
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
