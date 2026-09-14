import { FormEvent, useState } from "react";
import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { NewsletterInline } from "../components/NewsletterInline";
import { SocialLinks } from "../components/SocialLinks";
import { useLanguage } from "../i18n/LanguageProvider";
import { assetUrl, submitContact } from "../lib/api";
import { pageMediaImgStyle, resolvePageMediaSrc } from "../lib/pageMedia";
import { googleMapsUrl } from "../lib/maps";
import { pageSeo } from "../lib/seo";

const CONTACT_FALLBACK = "/assets/site/contact-hero.png";

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
  const contactVisual = content.site.pageMedia.contact.visual;
  const contactImage = resolvePageMediaSrc(contactVisual, CONTACT_FALLBACK);
  const hasSocial = Boolean(content.site.footer.instagramUrl || content.site.footer.tiktokUrl);
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
          <p className="eyebrow">{t("contact.eyebrow")}</p>
          <h1>{t("contact.title")}</h1>
          <p>{t("contact.intro")}</p>
        </div>
      </header>

      <main className="contact-page">
        <section className="contact-form-section" aria-labelledby="contact-form-heading">
          <div className="shell">
            <div className="contact-compose">
              <aside className="contact-compose-visual" aria-hidden="true">
                <img src={assetUrl(contactImage)} alt="" loading="lazy" style={pageMediaImgStyle(contactVisual)} />
              </aside>

              <div className="contact-compose-body">
                {formSettings.enabled ? (
                  <>
                    <div className="contact-compose-lead">
                      <h2 id="contact-form-heading">{t("contact.formTitle")}</h2>
                      <p>
                        {t("contact.formIntro")}{" "}
                        <a href={`mailto:${content.site.footer.email}`}>{content.site.footer.email}</a>
                      </p>
                    </div>

                    <form className="contact-compose-form" onSubmit={handleSubmit}>
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
                          rows={5}
                          placeholder={t("contact.messagePlaceholder")}
                          required
                        />
                      </label>
                      <button
                        className={`btn primary contact-submit${submitting ? " is-loading" : ""}`}
                        type="submit"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <span className="btn-spinner" aria-hidden="true" />
                            {t("common.submitting")}
                          </>
                        ) : (
                          t("contact.send")
                        )}
                      </button>
                      {message ? <p className={`form-message ${messageType}`.trim()}>{message}</p> : null}
                    </form>
                  </>
                ) : (
                  <div className="contact-compose-lead">
                    <h2 id="contact-form-heading">{t("contact.email")}</h2>
                    <p>
                      {t("contact.reachUs")}{" "}
                      <a href={`mailto:${content.site.footer.email}`}>{content.site.footer.email}</a>
                    </p>
                  </div>
                )}

                {hasSocial ? (
                  <div className="contact-social">
                    <h3>{t("contact.followUs")}</h3>
                    <SocialLinks
                      instagramUrl={content.site.footer.instagramUrl}
                      tiktokUrl={content.site.footer.tiktokUrl}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="contact-locations-section section-soft" aria-labelledby="contact-locations-heading">
          <div className="shell">
            <div className="contact-locations-head">
              <h2 id="contact-locations-heading" className="section-title">
                {t("contact.locationsTitle")}
              </h2>
              <p className="lead">{t("contact.locationsIntro")}</p>
            </div>

            <div className="contact-locations-list" x-apple-data-detectors="false">
              {locations.map((location) => {
                const formatted = formatAddress(location.address);
                const mapsHref = googleMapsUrl(location.address);
                return (
                  <a
                    className="contact-location-link"
                    href={mapsHref}
                    target="_blank"
                    rel="noreferrer"
                    key={location.id}
                  >
                    <strong>{location.area}</strong>
                    {typeof formatted === "string" ? (
                      <span>{formatted}</span>
                    ) : (
                      <span>
                        {formatted.street}
                        <br />
                        {formatted.rest}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <NewsletterInline placement="page" id="nieuwsbrief-contact" />
    </>
  );
}
