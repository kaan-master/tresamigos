import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { AdminLoadingPopup } from "../components/AdminLoadingPopup";
import { randomSaveError, randomSaveLoading, randomSaveSuccess } from "../lib/saveMessages";

type Tone = "loading" | "success" | "error";

interface PopupState {
  title: string;
  message?: string;
  tone: Tone;
}

interface RunSaveOptions {
  successMessage?: string;
  refresh?: () => Promise<void> | void;
}

interface AdminFeedbackValue {
  notifyLoading: (title?: string, message?: string) => void;
  notifySuccess: (title?: string, message?: string) => void;
  notifyError: (message?: string, title?: string) => void;
  clear: () => void;
  runSave: <T>(action: () => Promise<T>, options?: RunSaveOptions) => Promise<T>;
}

const AdminFeedbackContext = createContext<AdminFeedbackValue | null>(null);

export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    clearTimer();
    setPopup(null);
  }, [clearTimer]);

  const notifyLoading = useCallback(
    (title?: string, message?: string) => {
      clearTimer();
      const fallback = randomSaveLoading();
      setPopup({
        title: title || fallback.title,
        message: message ?? fallback.message,
        tone: "loading"
      });
    },
    [clearTimer]
  );

  const notifySuccess = useCallback(
    (title?: string, message?: string) => {
      clearTimer();
      const fallback = randomSaveSuccess();
      setPopup({
        title: title || fallback.title,
        message: message ?? fallback.message,
        tone: "success"
      });
      timerRef.current = window.setTimeout(() => setPopup(null), 3200);
    },
    [clearTimer]
  );

  const notifyError = useCallback(
    (message?: string, title?: string) => {
      clearTimer();
      const fallback = randomSaveError(message || "Probeer opnieuw.");
      setPopup({
        title: title || fallback.title,
        message: fallback.message,
        tone: "error"
      });
    },
    [clearTimer]
  );

  const runSave = useCallback(
    async <T,>(action: () => Promise<T>, options?: RunSaveOptions) => {
      notifyLoading();
      try {
        const result = await action();
        if (options?.refresh) await options.refresh();
        notifySuccess(undefined, options?.successMessage);
        return result;
      } catch (error) {
        notifyError(error instanceof Error ? error.message : "Probeer opnieuw.");
        throw error;
      }
    },
    [notifyLoading, notifySuccess, notifyError]
  );

  const value = useMemo(
    () => ({ notifyLoading, notifySuccess, notifyError, clear, runSave }),
    [notifyLoading, notifySuccess, notifyError, clear, runSave]
  );

  return (
    <AdminFeedbackContext.Provider value={value}>
      {children}
      <AdminLoadingPopup
        visible={Boolean(popup)}
        title={popup?.title || ""}
        message={popup?.message}
        tone={popup?.tone}
      />
    </AdminFeedbackContext.Provider>
  );
}

export function useAdminFeedback() {
  const context = useContext(AdminFeedbackContext);
  if (!context) {
    throw new Error("useAdminFeedback moet binnen AdminFeedbackProvider gebruikt worden.");
  }
  return context;
}
