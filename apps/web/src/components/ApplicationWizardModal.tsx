import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { VacancyJob } from "@tresamigos/types";
import { WEEK_DAYS } from "@tresamigos/types";
import { assetUrl, submitApplication } from "../lib/api";

const DAY_SHORT: Record<(typeof WEEK_DAYS)[number], string> = {
  Maandag: "Ma",
  Dinsdag: "Di",
  Woensdag: "Wo",
  Donderdag: "Do",
  Vrijdag: "Vr",
  Zaterdag: "Za",
  Zondag: "Zo"
};

const TOTAL_STEPS = 5;

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
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
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
        setMessage("Vul je naam in.");
        setMessageType("error");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        setMessage("Vul een geldig e-mailadres in.");
        setMessageType("error");
        return false;
      }
    }

    if (currentStep === 2 && !form.days.length) {
      setMessage("Selecteer minimaal één beschikbare dag.");
      setMessageType("error");
      return false;
    }

    if (currentStep === 3) {
      if (form.experience.trim().length < 20) {
        setMessage("Beschrijf je ervaring in minimaal een paar zinnen.");
        setMessageType("error");
        return false;
      }
      if (form.motivation.trim().length < 20) {
        setMessage("Schrijf waarom je bij Tres Amigos wilt werken.");
        setMessageType("error");
        return false;
      }
    }

    if (currentStep === 4 && form.pdf) {
      const isPdf = form.pdf.type === "application/pdf" || form.pdf.name.toLowerCase().endsWith(".pdf");
      if (!isPdf || form.pdf.size > 4_000_000) {
        setMessage("Upload een PDF van maximaal 4 MB.");
        setMessageType("error");
        return false;
      }
    }

    return true;
  }

  async function fileToDataUrl(file: File | null) {
    if (!file) return null;
    return new Promise<{ name: string; size: number; data: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, size: file.size, data: String(reader.result || "") });
      reader.onerror = () => reject(new Error("PDF kon niet gelezen worden."));
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
      setMessage("Je sollicitatie is ontvangen. We nemen contact met je op.");
      setMessageType("success");
      setStep(TOTAL_STEPS);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verzenden mislukt.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  function nextStep() {
    if (validateStep(step)) setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  }

  return (
    <div className="application-modal" role="dialog" aria-modal="true" aria-label={`Solliciteren als ${job.title}`}>
      <button className="application-modal-backdrop" type="button" aria-label="Sluiten" onClick={onClose} disabled={submitting} />
      <div className="application-modal-panel">
        <button className="application-modal-close" type="button" aria-label="Sluiten" onClick={onClose} disabled={submitting}>
          ×
        </button>

        <div className="application-modal-grid">
          <aside className="application-modal-visual" aria-hidden="true">
            <img src={assetUrl(formImage)} alt="" loading="lazy" />
          </aside>

          <div className="application-shell application-shell-modal">
            <div className="application-progress">
              <div style={{ width: `${progress}%` }} />
            </div>
            <p className="application-meta">
              <span>Stap {Math.min(step, TOTAL_STEPS)} van {TOTAL_STEPS}</span>
              <strong className="application-role">{job.title}</strong>
            </p>

            <form className="application-form application-form-modal" onSubmit={handleSubmit}>
              {messageType === "success" && step === TOTAL_STEPS ? (
                <div className="application-step active application-success">
                  <h2>Bedankt!</h2>
                  <p>{message}</p>
                  <button className="btn primary" type="button" onClick={onClose}>
                    Sluiten
                  </button>
                </div>
              ) : (
                <>
                  {step === 1 ? (
                    <div className="application-step active">
                      <h2>Contact</h2>
                      <p>We gebruiken deze gegevens om je te bereiken over je sollicitatie.</p>
                      <div className="form-row">
                        <label className="form-field">
                          <span>Naam *</span>
                          <input
                            value={form.name}
                            onChange={(event) => setForm({ ...form, name: event.target.value })}
                            autoComplete="name"
                            required
                          />
                        </label>
                        <label className="form-field">
                          <span>E-mail *</span>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(event) => setForm({ ...form, email: event.target.value })}
                            autoComplete="email"
                            required
                          />
                        </label>
                        <label className="form-field">
                          <span>Telefoon</span>
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
                      <h2>Beschikbaarheid</h2>
                      <p>Kies de dagen waarop je kunt werken.</p>
                      <div className="day-picker">
                        {WEEK_DAYS.map((day) => (
                          <label key={day} title={day}>
                            <input type="checkbox" checked={form.days.includes(day)} onChange={() => toggleDay(day)} />
                            <span>{DAY_SHORT[day]}</span>
                          </label>
                        ))}
                      </div>
                      <label className="form-field">
                        <span>Opmerking</span>
                        <textarea
                          value={form.availabilityNote}
                          onChange={(event) => setForm({ ...form, availabilityNote: event.target.value })}
                          placeholder="Bijv. alleen ochtenden, geen zondagen…"
                        />
                      </label>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="application-step active">
                      <h2>Ervaring & motivatie</h2>
                      <p>Vertel kort wie je bent en waarom je past bij ons team.</p>
                      <label className="form-field">
                        <span>Ervaring *</span>
                        <textarea
                          value={form.experience}
                          onChange={(event) => setForm({ ...form, experience: event.target.value })}
                          placeholder="Relevante horeca- of keukenervaring…"
                          rows={5}
                        />
                      </label>
                      <label className="form-field">
                        <span>Motivatie *</span>
                        <textarea
                          value={form.motivation}
                          onChange={(event) => setForm({ ...form, motivation: event.target.value })}
                          placeholder="Waarom Tres Amigos en deze functie?"
                          rows={5}
                        />
                      </label>
                    </div>
                  ) : null}

                  {step === 4 ? (
                    <div className="application-step active">
                      <h2>CV / PDF</h2>
                      <p>Voeg optioneel je CV toe als PDF (max. 4 MB).</p>
                      <div className="pdf-upload">
                        <input
                          ref={fileRef}
                          type="file"
                          accept="application/pdf,.pdf"
                          hidden
                          onChange={(event) => setForm({ ...form, pdf: event.target.files?.[0] || null })}
                        />
                        <button className="pdf-dropzone" type="button" onClick={() => fileRef.current?.click()}>
                          <strong>{form.pdf?.name || "Kies een PDF"}</strong>
                          <small>{form.pdf ? "Klik om een ander bestand te kiezen" : "Sleep hierheen of klik om te uploaden"}</small>
                        </button>
                        {form.pdf ? (
                          <button className="text-link pdf-clear" type="button" onClick={() => setForm({ ...form, pdf: null })}>
                            Verwijder PDF
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {step === 5 ? (
                    <div className="application-step active">
                      <h2>Controleer & verstuur</h2>
                      <p>Check je gegevens voordat je solliciteert.</p>
                      <div className="application-summary">
                        <div>
                          <span>Functie</span>
                          <strong>{job.title}</strong>
                        </div>
                        <div>
                          <span>Contact</span>
                          <strong>
                            {form.name} · {form.email}
                            {form.phone ? ` · ${form.phone}` : ""}
                          </strong>
                        </div>
                        <div>
                          <span>Dagen</span>
                          <strong>{form.days.join(", ")}</strong>
                        </div>
                        <div>
                          <span>Ervaring</span>
                          <strong>{form.experience.slice(0, 120)}{form.experience.length > 120 ? "…" : ""}</strong>
                        </div>
                        <div>
                          <span>Motivatie</span>
                          <strong>{form.motivation.slice(0, 120)}{form.motivation.length > 120 ? "…" : ""}</strong>
                        </div>
                        <div>
                          <span>PDF</span>
                          <strong>{form.pdf?.name || "Geen PDF toegevoegd"}</strong>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {message && messageType !== "success" ? <p className={`form-message ${messageType}`.trim()}>{message}</p> : null}

                  <div className="application-actions">
                    {step > 1 ? (
                      <button className="btn alt" type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={submitting}>
                        Terug
                      </button>
                    ) : (
                      <span />
                    )}
                    {step < TOTAL_STEPS ? (
                      <button className="btn primary" type="button" onClick={nextStep}>
                        Volgende
                      </button>
                    ) : (
                      <button className="btn primary" type="submit" disabled={submitting}>
                        {submitting ? "Versturen…" : "Sollicitatie versturen"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
