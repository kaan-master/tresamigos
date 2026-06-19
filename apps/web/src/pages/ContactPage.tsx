import { FormEvent, useState } from "react";
import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { useLanguage } from "../i18n/LanguageProvider";
import { assetUrl, submitContact } from "../lib/api";
import { pageSeo } from "../lib/seo";

function formatAddress(address: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) return address;
  return { street: parts[0], rest: parts.slice(1).join(", ") };
}

export function ContactPage({ content }: { content: SiteContent }) {
  const { t } = useLanguage();
  const locations = content.locations.filter((location) => location.active !== false);
  const seo = pageSeo(content, "contact");
  const formSettings = content.site.contactForm;
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"" | "success" | "error">("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  function validateForm() {
    if (!form.name.trim()) {
      setMessage(t("contact.errorName"));
      setMessageType("error");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setMessage(t("contact.errorEmail"));
      setMessageType("error");
      return false;
    }
    if (!form.message.trim()) {
      setMessage(t("contact.errorMessage"));
      setMessageType("error");
      return false;
    }
    return true;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setMessageType("");
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const result = await submitContact({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim()
      });
      setMessage(result.message || formSettings.successMessage);
      setMessageType("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("contact.errorSend"));
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <header className="page-head compact contact-head">
        <div className="shell">
          <div className="eyebrow">{t("contact.eyebrow")}</div>
          <h1>{t("contact.title")}</h1>
          <p>{t("contact.intro")}</p>
        </div>
      </header>

      <main className="section contact-page">
        <div className="shell">
          <section className="contact-locations-strip">
            <div className="contact-locations-head">
              <h2 className="section-title">{t("contact.locationsTitle")}</h2>
              <p className="lead">{t("contact.locationsIntro")}</p>
            </div>
            <div className="contact-locations-grid">
              {locations.map((location) => {
                const formatted = formatAddress(location.address);
                return (
                  <article className="contact-location-card" key={location.id}>
                    <h3>{location.area}</h3>
                    {typeof formatted === "string" ? (
                      <p>{formatted}</p>
                    ) : (
                      <p>
                        {formatted.street}
                        <br />
                        {formatted.rest}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="contact-app">
            <div className="contact-app-shell">
              {formSettings.image ? (
                <aside className="contact-app-visual" aria-hidden="true">
                  <img src={assetUrl(formSettings.image)} alt="" loading="lazy" />
                </aside>
              ) : null}

              <div className="contact-app-panel">
                <div className="contact-app-intro">
                  <h2>{formSettings.enabled ? formSettings.title : t("contact.email")}</h2>
                  <p>
                    {formSettings.enabled ? formSettings.intro : t("contact.reachUs")}{" "}
                    <a href={`mailto:${content.site.footer.email}`}>{content.site.footer.email}</a>
                  </p>
                </div>

                {formSettings.enabled ? (
                  <form className="contact-app-form" onSubmit={handleSubmit}>
                    <div className="form-row contact-form-row">
                      <label className="form-field">
                        <span>{t("contact.name")} *</span>
                        <input
                          value={form.name}
                          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                          autoComplete="name"
                          required
                        />
                      </label>
                      <label className="form-field">
                        <span>{t("contact.emailField")} *</span>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                          autoComplete="email"
                          required
                        />
                      </label>
                    </div>
                    <label className="form-field">
                      <span>{t("contact.subject")}</span>
                      <input
                        value={form.subject}
                        onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                        placeholder={t("contact.subjectPlaceholder")}
                      />
                    </label>
                    <label className="form-field">
                      <span>{t("contact.message")} *</span>
                      <textarea
                        value={form.message}
                        onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                        rows={6}
                        placeholder={t("contact.messagePlaceholder")}
                        required
                      />
                    </label>
                    <button className="btn primary" type="submit" disabled={submitting}>
                      {submitting ? t("common.submitting") : t("contact.send")}
                    </button>
                    {message ? <p className={`form-message ${messageType}`.trim()}>{message}</p> : null}
                  </form>
                ) : null}

                <div className="contact-social">
                  <h3>{t("contact.followUs")}</h3>
                  <p>
                    {content.site.footer.instagramUrl ? (
                      <a href={content.site.footer.instagramUrl} target="_blank" rel="noreferrer">
                        Instagram
                      </a>
                    ) : null}
                    {content.site.footer.instagramUrl && content.site.footer.tiktokUrl ? " · " : null}
                    {content.site.footer.tiktokUrl ? (
                      <a href={content.site.footer.tiktokUrl} target="_blank" rel="noreferrer">
                        TikTok
                      </a>
                    ) : null}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
