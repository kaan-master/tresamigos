import { FormEvent, useMemo, useState } from "react";
import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { useLanguage } from "../i18n/LanguageProvider";
import { submitCatering } from "../lib/api";
import {
  CATERING_BOXES,
  CATERING_DIET,
  CATERING_PROTEINS,
  CATERING_SALSAS,
  CATERING_STEPS,
  CATERING_TOPPINGS,
  type CateringBoxId,
  type FulfillmentMode
} from "../lib/catering";

interface CateringForm {
  boxId: CateringBoxId | "";
  quantity: number;
  proteins: string[];
  toppings: string[];
  salsas: string[];
  diet: string[];
  notes: string;
  fulfillment: FulfillmentMode;
  locationId: string;
  address: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

const emptyForm = (): CateringForm => ({
  boxId: "",
  quantity: 10,
  proteins: [],
  toppings: [],
  salsas: [],
  diet: [],
  notes: "",
  fulfillment: "pickup",
  locationId: "",
  address: "",
  date: "",
  time: "",
  name: "",
  email: "",
  phone: "",
  company: ""
});

function toggleItem(list: string[], item: string) {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

export function CateringPage({ content }: { content: SiteContent }) {
  const { t } = useLanguage();
  const { locations } = content;
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CateringForm>(emptyForm);

  const activeLocations = locations.filter((location) => location.active !== false);
  const selectedBox = CATERING_BOXES.find((box) => box.id === form.boxId);
  const progress = useMemo(() => Math.round((step / CATERING_STEPS) * 100), [step]);

  const heroImage = selectedBox?.image ?? "/assets/brand/breakfast-lunch-dinner.png";

  function validate(currentStep: number) {
    setMessage("");

    if (currentStep === 1 && !form.boxId) {
      setMessage(t("catering.error.box"));
      return false;
    }
    if (currentStep === 2 && (form.quantity < 5 || form.quantity > 200)) {
      setMessage(t("catering.error.quantity"));
      return false;
    }
    if (currentStep === 3 && !form.proteins.length) {
      setMessage(t("catering.error.customize"));
      return false;
    }
    if (currentStep === 5) {
      if (form.fulfillment === "pickup" && !form.locationId) {
        setMessage(t("catering.error.location"));
        return false;
      }
      if (form.fulfillment === "delivery" && form.address.trim().length < 8) {
        setMessage(t("catering.error.address"));
        return false;
      }
      if (!form.date || !form.time) {
        setMessage(t("catering.error.datetime"));
        return false;
      }
    }
    if (currentStep === 6) {
      if (!form.name.trim()) {
        setMessage(t("contact.errorName"));
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        setMessage(t("contact.errorEmail"));
        return false;
      }
    }

    return true;
  }

  function goNext() {
    if (!validate(step)) return;
    if (step < CATERING_STEPS) {
      setStep((current) => current + 1);
      return;
    }
    setDone(true);
  }

  function goBack() {
    setMessage("");
    if (step > 1) setStep((current) => current - 1);
  }

  async function handlePay(event: FormEvent) {
    event.preventDefault();
    if (!validate(6) || submitting) return;

    setSubmitting(true);
    setMessage("");
    try {
      await submitCatering({
        boxId: form.boxId,
        quantity: form.quantity,
        proteins: form.proteins,
        toppings: form.toppings,
        salsas: form.salsas,
        diet: form.diet,
        notes: form.notes,
        fulfillment: form.fulfillment,
        locationId: form.locationId,
        address: form.address,
        eventDate: form.date,
        eventTime: form.time,
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company
      });
      setDone(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("contact.errorSend"));
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    setStarted(false);
    setStep(1);
    setDone(false);
    setMessage("");
    setForm(emptyForm());
  }

  return (
    <>
      <Helmet title={t("catering.seoTitle")} description={t("catering.seoDesc")} />

      {!started ? (
        <section className="catering-landing">
          <div className="shell catering-landing-grid">
            <div className="catering-landing-copy">
              <p className="eyebrow">{t("catering.eyebrow")}</p>
              <h1>{t("catering.title")}</h1>
              <p>{t("catering.intro")}</p>
              <button type="button" className="btn primary" onClick={() => setStarted(true)}>
                {t("catering.start")}
              </button>
            </div>
            <div className="catering-landing-visual">
              <img src="/assets/brand/breakfast-lunch-dinner.png" alt={t("catering.title")} />
            </div>
          </div>
        </section>
      ) : (
        <section className="section catering-page">
          <div className="shell">
            <div className="catering-app">
              <div className="catering-app-visual">
                <img src={heroImage} alt={selectedBox ? t(selectedBox.titleKey) : t("catering.title")} />
              </div>

              <div className="catering-app-panel">
                {done ? (
                  <div className="catering-success">
                    <p className="eyebrow">{t("catering.success.eyebrow")}</p>
                    <h2>{t("catering.success.title")}</h2>
                    <p>{t("catering.success.body")}</p>
                    <div className="catering-actions">
                      <button type="button" className="btn primary" onClick={restart}>
                        {t("catering.success.new")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="catering-head">
                      <p className="application-step-label">
                        {t("apply.step")
                          .replace("{current}", String(step))
                          .replace("{total}", String(CATERING_STEPS))}
                      </p>
                      <div className="application-progress" aria-hidden="true">
                        <span style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    {step === 1 ? (
                      <div className="catering-step">
                        <h2>{t("catering.step.type")}</h2>
                        <p>{t("catering.step.typeIntro")}</p>
                        <div className="catering-box-grid">
                          {CATERING_BOXES.map((box) => (
                            <button
                              key={box.id}
                              type="button"
                              className={`catering-box-card${form.boxId === box.id ? " is-selected" : ""}`}
                              onClick={() => setForm((current) => ({ ...current, boxId: box.id }))}
                            >
                              <img src={box.image} alt={t(box.titleKey)} />
                              <strong>{t(box.titleKey)}</strong>
                              <span>{t(box.descKey)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {step === 2 ? (
                      <div className="catering-step">
                        <h2>{t("catering.step.quantity")}</h2>
                        <p>{t("catering.step.quantityIntro")}</p>
                        <label className="form-field">
                          <span>{t("catering.field.persons")}</span>
                          <input
                            type="number"
                            min={5}
                            max={200}
                            value={form.quantity}
                            onChange={(event) =>
                              setForm((current) => ({ ...current, quantity: Number(event.target.value) || 0 }))
                            }
                          />
                        </label>
                        <p className="catering-hint">{t("catering.quantityHint")}</p>
                      </div>
                    ) : null}

                    {step === 3 ? (
                      <div className="catering-step">
                        <h2>{t("catering.step.customize")}</h2>
                        <p>{t("catering.step.customizeIntro")}</p>

                        <h3 className="catering-group-label">{t("catering.group.proteins")}</h3>
                        <div className="catering-chip-grid">
                          {CATERING_PROTEINS.map((item) => (
                            <label key={item} className="catering-chip">
                              <input
                                type="checkbox"
                                checked={form.proteins.includes(item)}
                                onChange={() => setForm((current) => ({ ...current, proteins: toggleItem(current.proteins, item) }))}
                              />
                              <span>{item}</span>
                            </label>
                          ))}
                        </div>

                        <h3 className="catering-group-label">{t("catering.group.toppings")}</h3>
                        <div className="catering-chip-grid">
                          {CATERING_TOPPINGS.map((item) => (
                            <label key={item} className="catering-chip">
                              <input
                                type="checkbox"
                                checked={form.toppings.includes(item)}
                                onChange={() => setForm((current) => ({ ...current, toppings: toggleItem(current.toppings, item) }))}
                              />
                              <span>{item}</span>
                            </label>
                          ))}
                        </div>

                        <h3 className="catering-group-label">{t("catering.group.salsas")}</h3>
                        <div className="catering-chip-grid">
                          {CATERING_SALSAS.map((item) => (
                            <label key={item} className="catering-chip">
                              <input
                                type="checkbox"
                                checked={form.salsas.includes(item)}
                                onChange={() => setForm((current) => ({ ...current, salsas: toggleItem(current.salsas, item) }))}
                              />
                              <span>{item}</span>
                            </label>
                          ))}
                        </div>

                        <h3 className="catering-group-label">{t("catering.group.diet")}</h3>
                        <div className="catering-chip-grid">
                          {CATERING_DIET.map((item) => (
                            <label key={item} className="catering-chip">
                              <input
                                type="checkbox"
                                checked={form.diet.includes(item)}
                                onChange={() => setForm((current) => ({ ...current, diet: toggleItem(current.diet, item) }))}
                              />
                              <span>{item}</span>
                            </label>
                          ))}
                        </div>

                        <label className="form-field">
                          <span>{t("catering.field.notes")}</span>
                          <textarea
                            value={form.notes}
                            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                            placeholder={t("catering.field.notesPlaceholder")}
                          />
                        </label>
                      </div>
                    ) : null}

                    {step === 4 ? (
                      <div className="catering-step">
                        <h2>{t("catering.step.review")}</h2>
                        <p>{t("catering.step.reviewIntro")}</p>
                        <dl className="catering-summary">
                          <div>
                            <dt>{t("catering.summary.box")}</dt>
                            <dd>{selectedBox ? t(selectedBox.titleKey) : "—"}</dd>
                          </div>
                          <div>
                            <dt>{t("catering.field.persons")}</dt>
                            <dd>{form.quantity}</dd>
                          </div>
                          <div>
                            <dt>{t("catering.group.proteins")}</dt>
                            <dd>{form.proteins.join(", ") || "—"}</dd>
                          </div>
                          <div>
                            <dt>{t("catering.group.toppings")}</dt>
                            <dd>{form.toppings.join(", ") || "—"}</dd>
                          </div>
                          <div>
                            <dt>{t("catering.group.salsas")}</dt>
                            <dd>{form.salsas.join(", ") || "—"}</dd>
                          </div>
                          <div>
                            <dt>{t("catering.group.diet")}</dt>
                            <dd>{form.diet.join(", ") || "—"}</dd>
                          </div>
                          {form.notes ? (
                            <div>
                              <dt>{t("catering.field.notes")}</dt>
                              <dd>{form.notes}</dd>
                            </div>
                          ) : null}
                        </dl>
                      </div>
                    ) : null}

                    {step === 5 ? (
                      <div className="catering-step">
                        <h2>{t("catering.step.fulfillment")}</h2>
                        <p>{t("catering.step.fulfillmentIntro")}</p>

                        <div className="catering-mode-grid">
                          <button
                            type="button"
                            className={`catering-mode${form.fulfillment === "pickup" ? " is-selected" : ""}`}
                            onClick={() => setForm((current) => ({ ...current, fulfillment: "pickup" }))}
                          >
                            {t("catering.mode.pickup")}
                          </button>
                          <button
                            type="button"
                            className={`catering-mode${form.fulfillment === "delivery" ? " is-selected" : ""}`}
                            onClick={() => setForm((current) => ({ ...current, fulfillment: "delivery" }))}
                          >
                            {t("catering.mode.delivery")}
                          </button>
                        </div>

                        {form.fulfillment === "pickup" ? (
                          <label className="form-field">
                            <span>{t("catering.field.location")}</span>
                            <select
                              value={form.locationId}
                              onChange={(event) => setForm((current) => ({ ...current, locationId: event.target.value }))}
                            >
                              <option value="">{t("catering.field.locationPlaceholder")}</option>
                              {activeLocations.map((location) => (
                                <option key={location.id} value={location.id}>
                                  {location.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : (
                          <label className="form-field">
                            <span>{t("catering.field.address")}</span>
                            <textarea
                              value={form.address}
                              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                              placeholder={t("catering.field.addressPlaceholder")}
                            />
                          </label>
                        )}

                        <div className="contact-form-row catering-datetime">
                          <label className="form-field">
                            <span>{t("catering.field.date")}</span>
                            <input
                              type="date"
                              value={form.date}
                              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                            />
                          </label>
                          <label className="form-field">
                            <span>{t("catering.field.time")}</span>
                            <input
                              type="time"
                              value={form.time}
                              onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                            />
                          </label>
                        </div>
                      </div>
                    ) : null}

                    {step === 6 ? (
                      <form className="catering-step" onSubmit={handlePay}>
                        <h2>{t("catering.step.checkout")}</h2>
                        <p>{t("catering.step.checkoutIntro")}</p>

                        <label className="form-field">
                          <span>{t("contact.name")}</span>
                          <input
                            value={form.name}
                            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                          />
                        </label>
                        <label className="form-field">
                          <span>{t("contact.emailField")}</span>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                          />
                        </label>
                        <label className="form-field">
                          <span>{t("apply.phone")}</span>
                          <input
                            value={form.phone}
                            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                          />
                        </label>
                        <label className="form-field">
                          <span>{t("catering.field.company")}</span>
                          <input
                            value={form.company}
                            onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                          />
                        </label>

                        <div className="catering-payment-placeholder">
                          <strong>{t("catering.payment.title")}</strong>
                          <p>{t("catering.payment.body")}</p>
                        </div>

                        {message ? <p className="contact-form-message error">{message}</p> : null}

                        <div className="catering-actions">
                          <button type="button" className="btn alt" onClick={goBack}>
                            {t("common.back")}
                          </button>
                          <button type="submit" className="btn primary" disabled={submitting}>
                            {submitting ? t("common.submitting") : t("catering.pay")}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {message ? <p className="contact-form-message error">{message}</p> : null}
                        <div className="catering-actions">
                          <button type="button" className="btn alt" onClick={goBack} disabled={step === 1}>
                            {t("common.back")}
                          </button>
                          <button type="button" className="btn primary" onClick={goNext}>
                            {step === CATERING_STEPS ? t("catering.pay") : t("common.next")}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
