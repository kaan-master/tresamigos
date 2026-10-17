import type { ReactNode } from "react";
import { useAdminFeedback } from "../../context/AdminFeedbackContext";

export function humanError(error: unknown, fallback = "Er ging iets mis. Probeer het opnieuw."): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const text = raw.trim();
  if (!text || /^failed to fetch$/i.test(text) || /^networkerror/i.test(text)) {
    return "Geen verbinding met de server. Je invoer blijft staan. Probeer opnieuw.";
  }
  return text || fallback;
}

export function Alert({ children }: { tone?: string; children: ReactNode }) {
  return (
    <p className="todo-alert" role="alert">
      {children}
    </p>
  );
}

export function Skeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="todo-skeleton" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

export function PhoneBar({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <header className="todo-phone-bar">
      {onBack ? (
        <button type="button" onClick={onBack}>
          Terug
        </button>
      ) : null}
      <strong>{title}</strong>
    </header>
  );
}

export function useTodoUi() {
  const { notifyError, notifySuccess } = useAdminFeedback();
  function toast(tone: "error" | "success", message: string) {
    if (tone === "error") notifyError(message);
    else notifySuccess(message);
  }
  async function confirm(opts: { title: string; body: string; confirmLabel?: string; danger?: boolean }) {
    return window.confirm(`${opts.title}\n\n${opts.body}`);
  }
  return { canWrite: true, toast, confirm };
}
