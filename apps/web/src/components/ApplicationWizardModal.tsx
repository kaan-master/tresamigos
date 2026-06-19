import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { VacancyJob } from "@tresamigos/types";
import { APPLICATION_ATTACHMENT_EXTENSIONS, APPLICATION_ATTACHMENT_MAX_BYTES, WEEK_DAYS } from "@tresamigos/types";
import { useLanguage } from "../i18n/LanguageProvider";
import { DAY_I18N_KEYS, DAY_SHORT_I18N_KEYS } from "../i18n/translations";
import { assetUrl, submitApplication } from "../lib/api";

const TOTAL_STEPS = 5;

const ATTACHMENT_ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isAllowedAttachment(file: File) {
  const lower = file.name.toLowerCase();
  const extOk = APPLICATION_ATTACHMENT_EXTENSIONS.some((ext) => lower.endsWith(ext));
  const mimeOk =
    !file.type ||
    file.type === "application/pdf" ||
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/octet-stream";
  return extOk && mimeOk && file.size <= APPLICATION_ATTACHMENT_MAX_BYTES;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  days: string[];
  availabilityNote: string;
  experience: string;
  motivation: string;
  pdf: File | null;
}

const emptyForm = (): FormState => ({
  name: "",
  email: "",
  phone: "",
  days: [],
  availabilityNote: "",
  experience: "",
  motivation: "",
  pdf: null
});

interface Props {
  open: boolean;
  job: VacancyJob | null;
  formImage: string;
  onClose: () => void;
}

export function ApplicationWizardModal({ open, job, formImage, onClose }: Props) {
  const { t } = useLanguage();
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"" | "success" | "error">("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const progress = useMemo(() => Math.round((step / TOTAL_STEPS) * 100), [step]);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setForm(emptyForm());
    setMessage("");
    setMessageType("");
    setSubmitting(false);
  }, [open, job?.id]);

  useEffect(() => {
    if (!open) return;
    overlayRef.current?.scrollTo(0, 0);
  }, [open, job?.id, step]);

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  if (!open || !job) return null;

  function dayShort(day: string) {
    const key = DAY_SHORT_I18N_KEYS[day];
    return key ? t(key) : day.slice(0, 2);
  }

  function dayLong(day: string) {
    const key = DAY_I18N_KEYS[day];
    return key ? t(key) : day;
  }

  function toggleDay(day: string) {
    setForm((current) => ({
      ...current,
      days: current.days.includes(day) ? current.days.filter((item) => item !== day) : [...current.days, day]
    }));
  }

  function validateStep(currentStep: number) {
    setMessage("");
    setMessageType("");

    if (currentStep === 1) {
      if (!form.name.trim()) {
        setMessage(t("apply.errorName"));
        setMessageType("error");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        setMessage(t("apply.errorEmail"));
        setMessageType("error");
        return false;
      }
    }

    if (currentStep === 2 && !form.days.length) {
      setMessage(t("apply.errorDays"));
      setMessageType("error");
      return false;
    }

    if (currentStep === 3) {
      if (form.experience.trim().length < 20) {
        setMessage(t("apply.errorExperience"));
        setMessageType("error");
        return false;
      }
      if (form.motivation.trim().length < 20) {
        setMessage(t("apply.errorMotivation"));
        setMessageType("error");
        return false;
      }
    }

    if (currentStep === 4 && form.pdf && !isAllowedAttachment(form.pdf)) {
      setMessage(t("apply.errorFile"));
      setMessageType("error");
      return false;
    }

    return true;
  }

  async function fileToDataUrl(file: File | null) {
    if (!file) return null;
    return new Promise<{ name: string; size: number; data: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, size: file.size, data: String(reader.result || "") });
      reader.onerror = () => reject(new Error(t("apply.errorSend")));
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!job) return;
    for (let index = 1; index <= 4; index += 1) {
      if (!validateStep(index)) {
        setStep(index);
        return;
      }
    }

    setSubmitting(true);
    try {
      const pdf = await fileToDataUrl(form.pdf);
      await submitApplication({
        role: job.id,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        days: form.days,
        availabilityNote: form.availabilityNote.trim(),
        experience: form.experience.trim(),
        motivation: form.motivation.trim(),
        pdf
      });
      setMessage(t("apply.success"));
      setMessageType("success");
      setStep(TOTAL_STEPS);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("apply.errorSend"));
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  function nextStep() {
    if (validateStep(step)) setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  }

  const daysSummary = form.days.map((day) => dayLong(day)).join(", ");

  return createPortal(
    <div
      className="application-modal"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("apply.applyAs", { role: job.title })}
    >
      <button className="application-modal-backdrop" type="button" aria-label={t("common.close")} onClick={onClose} disabled={submitting} />
      <div className="application-modal-panel">
        <div className="application-modal-grid">
          <aside className="application-modal-visual" aria-hidden="true">
            <img src={assetUrl(formImage)} alt="" loading="lazy" />
          </aside>

          <div className="application-shell application-shell-modal">
            <div className="application-progress">
              <div style={{ width: `${progress}%` }} />
            </div>

            <header className="application-modal-head">
              <div className="application-modal-head-row">
                <span className="application-step-label">
                  {t("apply.step", { current: Math.min(step, TOTAL_STEPS), total: TOTAL_STEPS })}
                </span>
                <button
                  className="application-modal-close"
                  type="button"
                  aria-label={t("common.close")}
                  onClick={onClose}
                  disabled={submitting}
                >
                  ×
                </button>
              </div>
              <h2 className="application-modal-role">{job.title}</h2>
            </header>

            <form className="application-form application-form-modal" onSubmit={handleSubmit}>
              {messageType === "success" && step === TOTAL_STEPS ? (
                <div className="application-step active application-success">
                  <h2>{t("apply.thanks")}</h2>
                  <p>{message}</p>
                  <button className="btn primary" type="button" onClick={onClose}>
                    {t("common.close")}
                  </button>
                </div>
              ) : (
                <>
                  {step === 1 ? (
                    <div className="application-step active">
                      <h2>{t("apply.contact.title")}</h2>
                      <p>{t("apply.contact.intro")}</p>
                      <div className="form-row">
                        <label className="form-field">
                          <span>{t("apply.name")} *</span>
                          <input
                            value={form.name}
                            onChange={(event) => setForm({ ...form, name: event.target.value })}
                            autoComplete="name"
                            required
                          />
                        </label>
                        <label className="form-field">
                          <span>{t("apply.email")} *</span>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(event) => setForm({ ...form, email: event.target.value })}
                            autoComplete="email"
                            required
                          />
                        </label>
                        <label className="form-field">
                          <span>{t("apply.phone")}</span>
                          <input
                            value={form.phone}
                            onChange={(event) => setForm({ ...form, phone: event.target.value })}
                            autoComplete="tel"
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="application-step active">
                      <h2>{t("apply.availability.title")}</h2>
                      <p>{t("apply.availability.intro")}</p>
                      <div className="day-picker">
                        {WEEK_DAYS.map((day) => (
                          <label key={day} title={dayLong(day)}>
                            <input type="checkbox" checked={form.days.includes(day)} onChange={() => toggleDay(day)} />
                            <span>{dayShort(day)}</span>
                          </label>
                        ))}
                      </div>
                      <label className="form-field">
                        <span>{t("apply.availability.note")}</span>
                        <textarea
                          value={form.availabilityNote}
                          onChange={(event) => setForm({ ...form, availabilityNote: event.target.value })}
                          placeholder={t("apply.availability.notePlaceholder")}
                        />
                      </label>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="application-step active">
                      <h2>{t("apply.experience.title")}</h2>
                      <p>{t("apply.experience.intro")}</p>
                      <label className="form-field">
                        <span>{t("apply.experience.field")} *</span>
                        <textarea
                          value={form.experience}
                          onChange={(event) => setForm({ ...form, experience: event.target.value })}
                          placeholder={t("apply.experience.placeholder")}
                          rows={5}
                        />
                      </label>
                      <label className="form-field">
                        <span>{t("apply.motivation.field")} *</span>
                        <textarea
                          value={form.motivation}
                          onChange={(event) => setForm({ ...form, motivation: event.target.value })}
                          placeholder={t("apply.motivation.placeholder")}
                          rows={5}
                        />
                      </label>
                    </div>
                  ) : null}

                  {step === 4 ? (
                    <div className="application-step active">
                      <h2>{t("apply.cv.title")}</h2>
                      <p>{t("apply.cv.intro")}</p>
                      <div className="pdf-upload">
                        <input
                          ref={fileRef}
                          type="file"
                          accept={ATTACHMENT_ACCEPT}
                          hidden
                          onChange={(event) => setForm({ ...form, pdf: event.target.files?.[0] || null })}
                        />
                        <button className="pdf-dropzone" type="button" onClick={() => fileRef.current?.click()}>
                          <strong>{form.pdf?.name || t("apply.cv.choose")}</strong>
                          <small>{form.pdf ? t("apply.cv.change") : t("apply.cv.hint")}</small>
                        </button>
                        {form.pdf ? (
                          <button className="text-link pdf-clear" type="button" onClick={() => setForm({ ...form, pdf: null })}>
                            {t("apply.cv.remove")}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {step === 5 ? (
                    <div className="application-step active">
                      <h2>{t("apply.review.title")}</h2>
                      <p>{t("apply.review.intro")}</p>
                      <div className="application-summary">
                        <div>
                          <span>{t("apply.review.role")}</span>
                          <strong>{job.title}</strong>
                        </div>
                        <div>
                          <span>{t("apply.review.contact")}</span>
                          <strong>
                            {form.name} · {form.email}
                            {form.phone ? ` · ${form.phone}` : ""}
                          </strong>
                        </div>
                        <div>
                          <span>{t("apply.review.days")}</span>
                          <strong>{daysSummary}</strong>
                        </div>
                        <div>
                          <span>{t("apply.review.experience")}</span>
                          <strong>
                            {form.experience.slice(0, 120)}
                            {form.experience.length > 120 ? "…" : ""}
                          </strong>
                        </div>
                        <div>
                          <span>{t("apply.review.motivation")}</span>
                          <strong>
                            {form.motivation.slice(0, 120)}
                            {form.motivation.length > 120 ? "…" : ""}
                          </strong>
                        </div>
                        <div>
                          <span>{t("apply.review.attachment")}</span>
                          <strong>{form.pdf?.name || t("apply.review.noAttachment")}</strong>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {message && messageType !== "success" ? <p className={`form-message ${messageType}`.trim()}>{message}</p> : null}

                  <div className="application-actions">
                    {step > 1 ? (
                      <button className="btn alt" type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={submitting}>
                        {t("common.back")}
                      </button>
                    ) : (
                      <span />
                    )}
                    {step < TOTAL_STEPS ? (
                      <button className="btn primary" type="button" onClick={nextStep}>
                        {t("common.next")}
                      </button>
                    ) : (
                      <button className="btn primary" type="submit" disabled={submitting}>
                        {submitting ? t("common.submitting") : t("apply.submit")}
                      </button>
                    )}
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
