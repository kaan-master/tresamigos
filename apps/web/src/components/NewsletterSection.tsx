import { FormEvent, useState } from "react";
import { submitNewsletterSubscribe } from "../lib/api";
import { useLanguage } from "../i18n/LanguageProvider";

export function NewsletterSection() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    setErrorMessage("");
    try {
      await submitNewsletterSubscribe({
        email: email.trim(),
        name: name.trim() || undefined
      });
      setStatus("success");
      setName("");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : t("newsletter.error"));
    }
  }

  return (
    <section id="nieuwsbrief" className="section newsletter-section" aria-labelledby="newsletter-title">
      <div className="shell">
        <div className="newsletter-inner">
          <div className="newsletter-copy">
            <p className="newsletter-eyebrow">{t("newsletter.eyebrow")}</p>
            <h2 id="newsletter-title" className="newsletter-title">
              {t("newsletter.title")}
            </h2>
            <p className="newsletter-body">{t("newsletter.body")}</p>
          </div>

          <form className="newsletter-form" onSubmit={(event) => void handleSubmit(event)}>
            {status === "success" ? (
              <div className="newsletter-success" role="status">
                {t("newsletter.success")}
              </div>
            ) : (
              <>
                <div className="newsletter-fields">
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder={t("newsletter.name")}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="newsletter-input"
                  />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder={t("newsletter.email")}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="newsletter-input"
                  />
                </div>
                {status === "error" ? <p className="newsletter-error">{errorMessage || t("newsletter.error")}</p> : null}
                <button type="submit" className="btn primary newsletter-submit" disabled={status === "loading"}>
                  {status === "loading" ? t("newsletter.sending") : t("newsletter.subscribe")}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
