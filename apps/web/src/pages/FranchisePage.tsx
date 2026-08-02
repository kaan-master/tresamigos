import { FormEvent, useMemo, useState } from "react";
import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { useLanguage } from "../i18n/LanguageProvider";
import { submitFranchiseInquiry } from "../lib/api";
import { pageSeo } from "../lib/seo";

const TOTAL_STEPS = 3;

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  desiredLocation: string;
  currentRole: string;
  company: string;
  investment: string;
  visitedYes: boolean | null;
  visitedLocation: string;
  termsAccepted: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  email: "",
  phone: "",
  address: "",
  desiredLocation: "",
  currentRole: "",
  company: "",
  investment: "",
  visitedYes: null,
  visitedLocation: "",
  termsAccepted: false
});

export function FranchisePage({ content }: { content: SiteContent }) {
  const { t } = useLanguage();
  const seo = pageSeo(content, "franchise");
  const locations = content.locations.filter((location) => location.active !== false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"" | "success" | "error">("");

  const progress = useMemo(() => Math.round((step / TOTAL_STEPS) * 100), [step]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateStep(current: number) {
    if (current === 1) {
      if (!form.name.trim()) return t("franchise.errorName");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return t("franchise.errorEmail");
      if (!form.phone.trim()) return t("franchise.errorPhone");
      if (!form.address.trim()) return t("franchise.errorAddress");
      return "";
    }
    if (current === 2) {
      if (!form.desiredLocation.trim()) return t("franchise.errorDesired");
      if (!form.currentRole.trim()) return t("franchise.errorRole");
      if (!form.investment.trim()) return t("franchise.errorInvestment");
      return "";
    }
    if (current === 3) {
      if (form.visitedYes === null) return t("franchise.errorVisited");
      if (form.visitedYes && !form.visitedLocation.trim()) return t("franchise.errorVisitedWhich");
      if (!form.termsAccepted) return t("franchise.errorTerms");
      return "";
    }
    return "";
  }

  function goNext() {
    const error = validateStep(step);
    if (error) {
      setMessage(error);
      setMessageType("error");
      return;
    }
    setMessage("");
    setMessageType("");
    setStep((value) => Math.min(TOTAL_STEPS, value + 1));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const error = validateStep(3);
    if (error) {
      setMessage(error);
      setMessageType("error");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setMessageType("");
    try {
      const visitedLocation =
        form.visitedYes === false
          ? t("franchise.visitedNo")
          : form.visitedLocation.trim();
      const result = await submitFranchiseInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        desiredLocation: form.desiredLocation.trim(),
        currentRole: form.currentRole.trim(),
        company: form.company.trim(),
        investment: form.investment.trim(),
        visitedLocation,
        termsAccepted: form.termsAccepted
      });
      setDone(true);
      setMessage(result.message || t("franchise.success"));
      setMessageType("success");
      setForm(emptyForm());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t("franchise.errorSend"));
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <header className="page-head compact">
        <div className="shell">
          <h1>{t("franchise.title")}</h1>
          <p>{t("franchise.intro")}</p>
        </div>
      </header>

      <main className="section">
        <div className="shell">
          <div className="franchise-app">
            {done ? (
              <div className="franchise-success">
                <h2>{t("franchise.successTitle")}</h2>
                <p>{message || t("franchise.success")}</p>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    setDone(false);
                    setStep(1);
                    setMessage("");
                    setMessageType("");
                  }}
                >
                  {t("franchise.again")}
                </button>
              </div>
            ) : (
              <form className="franchise-form" onSubmit={handleSubmit}>
                <div className="franchise-progress" aria-hidden="true">
                  <div style={{ width: `${progress}%` }} />
                </div>
                <p className="franchise-step-label">
                  {t("franchise.step")} {step}/{TOTAL_STEPS}
                </p>

                {step === 1 ? (
                  <div className="franchise-step">
                    <h2>{t("franchise.step1Title")}</h2>
                    <label className="form-field">
                      <span>{t("franchise.name")}</span>
                      <input value={form.name} onChange={(e) => update("name", e.target.value)} autoComplete="name" />
                    </label>
                    <label className="form-field">
                      <span>{t("franchise.email")}</span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        autoComplete="email"
                      />
                    </label>
                    <label className="form-field">
                      <span>{t("franchise.phone")}</span>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        autoComplete="tel"
                      />
                    </label>
                    <label className="form-field">
                      <span>{t("franchise.address")}</span>
                      <input
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                        autoComplete="street-address"
                      />
                    </label>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="franchise-step">
                    <h2>{t("franchise.step2Title")}</h2>
                    <label className="form-field">
                      <span>{t("franchise.desiredLocation")}</span>
                      <input
                        value={form.desiredLocation}
                        onChange={(e) => update("desiredLocation", e.target.value)}
                        list="franchise-locations"
                      />
                      <datalist id="franchise-locations">
                        {locations.map((location) => (
                          <option key={location.id} value={location.name} />
                        ))}
                      </datalist>
                    </label>
                    <label className="form-field">
                      <span>{t("franchise.currentRole")}</span>
                      <input value={form.currentRole} onChange={(e) => update("currentRole", e.target.value)} />
                    </label>
                    <label className="form-field">
                      <span>{t("franchise.company")}</span>
                      <input value={form.company} onChange={(e) => update("company", e.target.value)} />
                    </label>
                    <label className="form-field">
                      <span>{t("franchise.investment")}</span>
                      <input value={form.investment} onChange={(e) => update("investment", e.target.value)} />
                    </label>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="franchise-step">
                    <h2>{t("franchise.step3Title")}</h2>
                    <fieldset className="franchise-choice">
                      <legend>{t("franchise.visitedQuestion")}</legend>
                      <label>
                        <input
                          type="radio"
                          name="visited"
                          checked={form.visitedYes === true}
                          onChange={() => update("visitedYes", true)}
                        />
                        {t("franchise.yes")}
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="visited"
                          checked={form.visitedYes === false}
                          onChange={() => {
                            update("visitedYes", false);
                            update("visitedLocation", "");
                          }}
                        />
                        {t("franchise.no")}
                      </label>
                    </fieldset>
                    {form.visitedYes ? (
                      <label className="form-field">
                        <span>{t("franchise.visitedWhich")}</span>
                        <select
                          value={form.visitedLocation}
                          onChange={(e) => update("visitedLocation", e.target.value)}
                        >
                          <option value="">{t("franchise.visitedSelect")}</option>
                          {locations.map((location) => (
                            <option key={location.id} value={location.name}>
                              {location.name}
                            </option>
                          ))}
                          <option value={t("franchise.visitedOther")}>{t("franchise.visitedOther")}</option>
                        </select>
                      </label>
                    ) : null}
                    <label className="franchise-terms">
                      <input
                        type="checkbox"
                        checked={form.termsAccepted}
                        onChange={(e) => update("termsAccepted", e.target.checked)}
                      />
                      <span>{t("franchise.terms")}</span>
                    </label>
                  </div>
                ) : null}

                {message && messageType === "error" ? (
                  <p className="form-message is-error">{message}</p>
                ) : null}

                <div className="franchise-actions">
                  {step > 1 ? (
                    <button type="button" className="btn alt" onClick={() => setStep((value) => value - 1)}>
                      {t("franchise.back")}
                    </button>
                  ) : (
                    <span />
                  )}
                  {step < TOTAL_STEPS ? (
                    <button type="button" className="btn primary" onClick={goNext}>
                      {t("franchise.next")}
                    </button>
                  ) : (
                    <button type="submit" className="btn primary" disabled={submitting}>
                      {submitting ? t("franchise.sending") : t("franchise.submit")}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
