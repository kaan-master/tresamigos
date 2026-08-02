import { FormEvent, useState } from "react";
import { submitNewsletterSubscribe } from "../lib/api";
import { useLanguage } from "../i18n/LanguageProvider";

type NewsletterVariant = "full" | "compact";

export function NewsletterSection({
  variant = "full",
  id
}: {
  variant?: NewsletterVariant;
  id?: string;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const titleId = id ? `${id}-title` : "newsletter-title";

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
    <section
      id={id || (variant === "full" ? "nieuwsbrief" : undefined)}
      className={`section newsletter-section${variant === "compact" ? " newsletter-section--compact" : ""}`}
      aria-labelledby={titleId}
    >
      <div className="shell">
        <div className="newsletter-inner">
          <div className="newsletter-copy">
            <p className="newsletter-eyebrow">{t("newsletter.eyebrow")}</p>
            <h2 id={titleId} className="newsletter-title">
              {t("newsletter.title")}
            </h2>
            {variant === "full" ? <p className="newsletter-body">{t("newsletter.body")}</p> : null}
          </div>

          <form className="newsletter-form" onSubmit={(event) => void handleSubmit(event)}>
            {status === "success" ? (
              <div className="newsletter-success" role="status">
                {t("newsletter.success")}
              </div>
            ) : (
              <>
                <div className="newsletter-fields">
                  {variant === "full" ? (
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      placeholder={t("newsletter.name")}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="newsletter-input"
                    />
                  ) : null}
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
