import { FormEvent, useMemo, useState } from "react";
import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { useLanguage } from "../i18n/LanguageProvider";
import { assetUrl, submitFranchiseInquiry } from "../lib/api";
import { pageSeo } from "../lib/seo";

const TOTAL_STEPS = 4;
const HERO_IMAGE = "/assets/site/restaurant-interior.jpg";
const STORY_IMAGE = "/assets/site/quesadilla-drinks.webp";

const INVESTMENT_KEYS = ["10", "25", "50", "75", "100", "150", "200", "250plus"] as const;
const FINANCING_KEYS = ["equity", "bank", "investors", "exploring"] as const;

type InvestmentKey = (typeof INVESTMENT_KEYS)[number];
type FinancingKey = (typeof FINANCING_KEYS)[number];

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  desiredLocation: string;
  currentRole: string;
  company: string;
  investment: InvestmentKey | "";
  financing: FinancingKey[];
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
  financing: [],
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
  const [customDesiredLocation, setCustomDesiredLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"" | "success" | "error">("");

  const progress = useMemo(() => Math.round((step / TOTAL_STEPS) * 100), [step]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleFinancing(key: FinancingKey) {
    setForm((current) => {
      const exists = current.financing.includes(key);
      return {
        ...current,
        financing: exists ? current.financing.filter((item) => item !== key) : [...current.financing, key]
      };
    });
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
      return "";
    }
    if (current === 3) {
      if (!form.investment) return t("franchise.errorInvestment");
      if (!form.financing.length) return t("franchise.errorFinancing");
      return "";
    }
    if (current === 4) {
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
    const error = validateStep(4);
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
        form.visitedYes === false ? t("franchise.visitedNo") : form.visitedLocation.trim();
      const investmentLabel = form.investment ? t(`franchise.invest.${form.investment}`) : "";
      const financingLabel = form.financing.map((key) => t(`franchise.finance.${key}`)).join(", ");
      const result = await submitFranchiseInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        desiredLocation: form.desiredLocation.trim(),
        currentRole: form.currentRole.trim(),
        company: form.company.trim(),
        investment: investmentLabel,
        financing: financingLabel,
        visitedLocation,
        termsAccepted: form.termsAccepted
      });
      setDone(true);
      setMessage(result.message || t("franchise.success"));
      setMessageType("success");
      setForm(emptyForm());
      setCustomDesiredLocation(false);
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

      <header
        className="franchise-hero"
        style={{ backgroundImage: `url(${assetUrl(HERO_IMAGE)})` }}
      >
        <div className="franchise-hero-veil" aria-hidden="true" />
        <div className="shell franchise-hero-inner">
          <p className="franchise-hero-brand">Tres Amigos</p>
          <h1>{t("franchise.heroTitle")}</h1>
          <p className="franchise-hero-lead">{t("franchise.heroLead")}</p>
          <a className="btn primary franchise-hero-cta" href="#franchise-aanvraag">
            {t("franchise.heroCta")}
          </a>
        </div>
      </header>

      <section className="section franchise-story">
        <div className="shell franchise-story-grid">
          <div>
            <p className="franchise-eyebrow">{t("franchise.storyEyebrow")}</p>
            <h2 className="section-title">{t("franchise.storyTitle")}</h2>
            <p className="lead">{t("franchise.storyBody")}</p>
            <p className="franchise-story-note">{t("franchise.storyNote")}</p>
          </div>
          <figure className="franchise-story-visual">
            <img src={assetUrl(STORY_IMAGE)} alt={t("franchise.storyImageAlt")} loading="lazy" />
          </figure>
        </div>
      </section>

      <section className="section section-soft franchise-benefits">
        <div className="shell">
          <div className="franchise-benefits-head">
            <h2 className="section-title">{t("franchise.benefitsTitle")}</h2>
            <p className="lead">{t("franchise.benefitsIntro")}</p>
          </div>
          <ul className="franchise-benefit-list">
            <li>
              <strong>{t("franchise.benefit1Title")}</strong>
              <span>{t("franchise.benefit1Body")}</span>
            </li>
            <li>
              <strong>{t("franchise.benefit2Title")}</strong>
              <span>{t("franchise.benefit2Body")}</span>
            </li>
            <li>
              <strong>{t("franchise.benefit3Title")}</strong>
              <span>{t("franchise.benefit3Body")}</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="section franchise-money">
        <div className="shell franchise-money-inner">
          <h2 className="section-title">{t("franchise.moneyTitle")}</h2>
          <p className="lead">{t("franchise.moneyIntro")}</p>
          <div className="franchise-money-points">
            <p>
              <strong>{t("franchise.moneyEquityLabel")}</strong> {t("franchise.moneyEquity")}
            </p>
            <p>
              <strong>{t("franchise.moneyTotalLabel")}</strong> {t("franchise.moneyTotal")}
            </p>
            <p>
              <strong>{t("franchise.moneySupportLabel")}</strong> {t("franchise.moneySupport")}
            </p>
          </div>
        </div>
      </section>

      <main id="franchise-aanvraag" className="section franchise-apply">
        <div className="shell">
          <div className="franchise-apply-head">
            <h2 className="section-title">{t("franchise.applyTitle")}</h2>
            <p className="lead">{t("franchise.applyIntro")}</p>
          </div>

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
              <form className="franchise-form" onSubmit={(event) => void handleSubmit(event)}>
                <div className="franchise-progress" aria-hidden="true">
                  <div style={{ width: `${progress}%` }} />
                </div>
                <p className="franchise-step-label">
                  {t("franchise.step")} {step}/{TOTAL_STEPS}
                </p>

                {step === 1 ? (
                  <div className="franchise-step">
                    <h3>{t("franchise.step1Title")}</h3>
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
                    <h3>{t("franchise.step2Title")}</h3>
                    <label className="form-field">
                      <span>{t("franchise.desiredLocation")}</span>
                      <select
                        value={customDesiredLocation ? "__other__" : form.desiredLocation}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "__other__") {
                            setCustomDesiredLocation(true);
                            update("desiredLocation", "");
                            return;
                          }
                          setCustomDesiredLocation(false);
                          update("desiredLocation", value);
                        }}
                      >
                        <option value="">{t("franchise.desiredSelect")}</option>
                        {locations.map((location) => {
                          const value = location.area || location.name;
                          return (
                            <option key={location.id} value={value}>
                              {value}
                            </option>
                          );
                        })}
                        <option value="__other__">{t("franchise.desiredOther")}</option>
                      </select>
                    </label>
                    {customDesiredLocation ? (
                      <label className="form-field">
                        <span>{t("franchise.desiredOtherLabel")}</span>
                        <input
                          value={form.desiredLocation}
                          onChange={(e) => update("desiredLocation", e.target.value)}
                          placeholder={t("franchise.desiredPlaceholder")}
                        />
                      </label>
                    ) : null}
                    <label className="form-field">
                      <span>{t("franchise.currentRole")}</span>
                      <input value={form.currentRole} onChange={(e) => update("currentRole", e.target.value)} />
                    </label>
                    <label className="form-field">
                      <span>{t("franchise.company")}</span>
                      <input value={form.company} onChange={(e) => update("company", e.target.value)} />
                    </label>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="franchise-step">
                    <h3>{t("franchise.step3Title")}</h3>
                    <p className="franchise-step-help">{t("franchise.step3Help")}</p>

                    <label className="form-field">
                      <span>{t("franchise.investment")}</span>
                      <select
                        value={form.investment}
                        onChange={(e) => update("investment", e.target.value as InvestmentKey | "")}
                      >
                        <option value="">{t("franchise.investSelect")}</option>
                        {INVESTMENT_KEYS.map((key) => (
                          <option key={key} value={key}>
                            {t(`franchise.invest.${key}`)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <fieldset className="franchise-choice">
                      <legend>{t("franchise.financing")}</legend>
                      <p className="franchise-choice-hint">{t("franchise.financingHint")}</p>
                      {FINANCING_KEYS.map((key) => (
                        <label key={key}>
                          <input
                            type="checkbox"
                            checked={form.financing.includes(key)}
                            onChange={() => toggleFinancing(key)}
                          />
                          {t(`franchise.finance.${key}`)}
                        </label>
                      ))}
                    </fieldset>
                  </div>
                ) : null}

                {step === 4 ? (
                  <div className="franchise-step">
                    <h3>{t("franchise.step4Title")}</h3>
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
