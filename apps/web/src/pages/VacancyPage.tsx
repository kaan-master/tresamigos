import { FormEvent, useMemo, useState } from "react";
import type { ApplicationRole } from "@tresamigos/types";
import { APPLICATION_ROLES, WEEK_DAYS } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { submitApplication } from "../lib/api";

const roles: { title: string; role: ApplicationRole; copy: string }[] = [
  {
    title: "Crew member - Kitchen",
    role: "Crew member - Kitchen",
    copy: "Prep, grill, assemble and keep the line moving during peak hours."
  },
  {
    title: "Service - Front",
    role: "Service - Front",
    copy: "Welcome guests, take orders and keep the front-of-house experience sharp."
  },
  {
    title: "Runner - Delivery",
    role: "Runner - Delivery",
    copy: "Support delivery flow, packing and handoff with speed and care."
  }
];

export function VacancyPage() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<ApplicationRole>(APPLICATION_ROLES[0]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"" | "success" | "error">("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    days: [] as string[],
    availabilityNote: "",
    experience: "",
    motivation: "",
    pdf: null as File | null
  });

  const progress = useMemo(() => Math.round(((step + 1) / 5) * 100), [step]);

  function toggleDay(day: string) {
    setForm((current) => ({
      ...current,
      days: current.days.includes(day) ? current.days.filter((item) => item !== day) : [...current.days, day]
    }));
  }

  function validateStep() {
    setMessage("");
    setMessageType("");
    if (step === 1 && (!form.name.trim() || !form.email.trim())) {
      setMessage("Vul naam en een geldig e-mailadres in.");
      setMessageType("error");
      return false;
    }
    if (step === 2 && !form.days.length) {
      setMessage("Selecteer minimaal een beschikbare dag.");
      setMessageType("error");
      return false;
    }
    if (step === 4 && form.pdf && (form.pdf.type !== "application/pdf" || form.pdf.size > 4_000_000)) {
      setMessage("Upload een PDF van maximaal 4 MB.");
      setMessageType("error");
      return false;
    }
    return true;
  }

  async function fileToDataUrl(file: File | null) {
    if (!file) return null;
    return new Promise<{ name: string; size: number; data: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({ name: file.name, size: file.size, data: String(reader.result || "") });
      reader.onerror = () => reject(new Error("PDF kon niet gelezen worden."));
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const pdf = await fileToDataUrl(form.pdf);
      await submitApplication({
        role,
        name: form.name,
        email: form.email,
        phone: form.phone,
        days: form.days,
        availabilityNote: form.availabilityNote,
        experience: form.experience,
        motivation: form.motivation,
        pdf
      });
      setMessage("Je sollicitatie is ontvangen en staat nu in de admin.");
      setMessageType("success");
      setStep(0);
      setForm({
        name: "",
        email: "",
        phone: "",
        days: [],
        availabilityNote: "",
        experience: "",
        motivation: "",
        pdf: null
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verzenden mislukt.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet title="Work With Us | Tres Amigos" description="Solliciteer bij Tres Amigos Amsterdam." />
      <header className="page-head compact">
        <div className="shell">
          <div className="eyebrow">Work with us</div>
          <h1>Join the crew</h1>
          <p>Five-step intake for kitchen, service and runner roles. Your application goes straight into the admin dashboard.</p>
        </div>
      </header>
      <main className="section application-app">
        <div className="shell application-shell">
          <div className="application-progress">
            <div style={{ width: `${progress}%` }} />
          </div>
          <p className="application-meta">
            <span>Stap {step + 1} van 5</span>
            <strong>{role}</strong>
          </p>

          <form className="application-form" onSubmit={handleSubmit}>
            {step === 0 ? (
              <div className="application-step active">
                <h2>Kies je rol</h2>
                <div className="application-option-grid">
                  {roles.map((item) => (
                    <button
                      className={`application-option${role === item.role ? " selected" : ""}`}
                      type="button"
                      key={item.role}
                      onClick={() => setRole(item.role)}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.copy}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="application-step active">
                <h2>Contact</h2>
                <div className="form-row">
                  <label>
                    Naam
                    <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                  </label>
                  <label>
                    E-mail
                    <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
                  </label>
                  <label>
                    Telefoon
                    <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                  </label>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="application-step active">
                <h2>Beschikbaarheid</h2>
                <div className="day-picker">
                  {WEEK_DAYS.map((day) => (
                    <label key={day}>
                      <input type="checkbox" checked={form.days.includes(day)} onChange={() => toggleDay(day)} />
                      {day}
                    </label>
                  ))}
                </div>
                <label>
                  Opmerking
                  <textarea value={form.availabilityNote} onChange={(event) => setForm({ ...form, availabilityNote: event.target.value })} />
                </label>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="application-step active">
                <h2>Ervaring & motivatie</h2>
                <label>
                  Ervaring
                  <textarea value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} />
                </label>
                <label>
                  Motivatie
                  <textarea value={form.motivation} onChange={(event) => setForm({ ...form, motivation: event.target.value })} />
                </label>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="application-step active">
                <h2>CV / PDF</h2>
                <label>
                  Upload PDF (optioneel)
                  <input type="file" accept="application/pdf" onChange={(event) => setForm({ ...form, pdf: event.target.files?.[0] || null })} />
                </label>
                <div className="application-summary">
                  <div>
                    <span>Rol</span>
                    <strong>{role}</strong>
                  </div>
                  <div>
                    <span>Contact</span>
                    <strong>
                      {form.name || "-"} · {form.email || "-"}
                    </strong>
                  </div>
                  <div>
                    <span>Dagen</span>
                    <strong>{form.days.length ? form.days.join(", ") : "Nog niet gekozen"}</strong>
                  </div>
                  <div>
                    <span>PDF</span>
                    <strong>{form.pdf?.name || "Geen PDF toegevoegd"}</strong>
                  </div>
                </div>
              </div>
            ) : null}

            <p className={`form-message ${messageType}`.trim()}>{message}</p>

            <div className="application-actions">
              {step > 0 ? (
                <button className="btn alt" type="button" onClick={() => setStep((current) => Math.max(0, current - 1))}>
                  Terug
                </button>
              ) : null}
              {step < 4 ? (
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => {
                    if (validateStep()) setStep((current) => Math.min(4, current + 1));
                  }}
                >
                  Volgende
                </button>
              ) : (
                <button className="btn primary" type="submit" disabled={submitting}>
                  {submitting ? "Versturen..." : "Sollicitatie versturen"}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
