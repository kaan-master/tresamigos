import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import type { SiteContent } from "@tresamigos/types";

type PersistFn = (next?: SiteContent) => Promise<SiteContent | null>;

interface QuietSaveValue {
  saving: boolean;
  saveHint: string;
  contentRef: React.MutableRefObject<SiteContent | null>;
  markDirty: (keys?: string[]) => void;
  markSaved: (keys?: string[]) => void;
  isSaved: (key: string) => boolean;
  fieldClass: (key: string, extra?: string) => string;
  persist: (mode?: "manual" | "auto") => Promise<boolean>;
  schedulePersist: () => void;
  onContentChange: (next: SiteContent) => void;
}

const QuietSaveContext = createContext<QuietSaveValue | null>(null);

interface ProviderProps {
  content: SiteContent | null;
  onChange: (content: SiteContent) => void;
  onSaveQuiet: (next?: SiteContent) => Promise<SiteContent | null>;
  saving: boolean;
  children: ReactNode;
}

export function QuietSaveProvider({ content, onChange, onSaveQuiet, saving, children }: ProviderProps) {
  const contentRef = useRef<SiteContent | null>(content);
  const dirtyKeysRef = useRef<Set<string>>(new Set());
  const highlightTimer = useRef<number | null>(null);
  const autoSaveTimer = useRef<number | null>(null);
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set());
  const [saveHint, setSaveHint] = useState("");
  const saveQuietRef = useRef(onSaveQuiet);
  const savingRef = useRef(saving);

  contentRef.current = content;
  saveQuietRef.current = onSaveQuiet;
  savingRef.current = saving;

  useEffect(() => {
    return () => {
      if (highlightTimer.current != null) window.clearTimeout(highlightTimer.current);
      if (autoSaveTimer.current != null) window.clearTimeout(autoSaveTimer.current);
    };
  }, []);

  const markDirty = useCallback((keys: string[] = ["*"]) => {
    for (const key of keys) dirtyKeysRef.current.add(key);
  }, []);

  const markSaved = useCallback((keys: string[] = ["*"]) => {
    const highlight = new Set(keys.length ? keys : ["*"]);
    setSavedFields(highlight);
    setSaveHint("Opgeslagen");
    if (highlightTimer.current != null) window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => {
      setSavedFields(new Set());
      setSaveHint("");
    }, 2200);
  }, []);

  const isSaved = useCallback((key: string) => savedFields.has(key) || savedFields.has("*"), [savedFields]);

  const fieldClass = useCallback(
    (key: string, extra = "") => {
      const base = isSaved(key) ? "ta-field is-saved" : "ta-field";
      return extra ? `${base} ${extra}` : base;
    },
    [isSaved]
  );

  const onContentChange = useCallback(
    (next: SiteContent) => {
      contentRef.current = next;
      onChange(next);
    },
    [onChange]
  );

  const persist = useCallback(
    async (mode: "manual" | "auto" = "manual") => {
      if (savingRef.current) return false;
      const dirty = [...dirtyKeysRef.current];
      if (mode === "auto" && !dirty.length) return false;
      if (!contentRef.current) return false;

      // Geen stale provider-payload: AdminDashboard contentRef is al bijgewerkt via onChange.
      const saved = await saveQuietRef.current();
      if (!saved) return false;

      contentRef.current = saved;
      dirtyKeysRef.current.clear();
      markSaved(dirty.length ? dirty : ["*"]);
      if (mode === "auto") setSaveHint("Automatisch opgeslagen");
      return true;
    },
    [markSaved]
  );

  const schedulePersist = useCallback(() => {
    if (autoSaveTimer.current != null) window.clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = window.setTimeout(() => {
      void persist("auto");
    }, 450);
  }, [persist]);

  const value = useMemo(
    () => ({
      saving,
      saveHint,
      contentRef,
      markDirty,
      markSaved,
      isSaved,
      fieldClass,
      persist,
      schedulePersist,
      onContentChange
    }),
    [saving, saveHint, markDirty, markSaved, isSaved, fieldClass, persist, schedulePersist, onContentChange]
  );

  return <QuietSaveContext.Provider value={value}>{children}</QuietSaveContext.Provider>;
}

export function useQuietSave() {
  const context = useContext(QuietSaveContext);
  if (!context) {
    throw new Error("useQuietSave moet binnen QuietSaveProvider gebruikt worden.");
  }
  return context;
}

export function useQuietSaveOptional() {
  return useContext(QuietSaveContext);
}

/** Vangt blur op inputs en slaat stil op met highlight op de dichtstbijzijnde regel/veld. */
export function QuietSaveCapture({ children }: { children: ReactNode }) {
  const quiet = useQuietSaveOptional();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !quiet) return;

    function resolveLine(target: EventTarget | null): HTMLElement | null {
      if (!(target instanceof HTMLElement)) return null;
      return (
        target.closest<HTMLElement>("[data-save-line]") ||
        target.closest<HTMLElement>(".ta-link-row") ||
        target.closest<HTMLElement>(".ta-field") ||
        null
      );
    }

    function onFocusIn(event: FocusEvent) {
      const el = event.target;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return;
      el.dataset.quietBefore = el.type === "checkbox" || el.type === "radio" ? String(el.checked) : el.value;
    }

    function onFocusOut(event: FocusEvent) {
      const el = event.target;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return;
      if (el.readOnly || el.disabled) return;
      if (el.closest("[data-quiet-skip]")) return;

      const before = el.dataset.quietBefore ?? "";
      const after = el.type === "checkbox" || el.type === "radio" ? String(el.checked) : el.value;
      if (before === after) return;

      const line = resolveLine(el);
      const key =
        line?.dataset.saveKey ||
        el.name ||
        el.id ||
        `field:${line ? Array.from(root!.querySelectorAll(".ta-field, .ta-link-row, [data-save-line]")).indexOf(line) : 0}`;

      quiet!.markDirty([key]);
      if (line) {
        line.classList.add("is-saving");
        line.dataset.saveKey = key;
      }

      window.setTimeout(() => {
        void quiet!.persist("auto").then((ok) => {
          if (!line) return;
          line.classList.remove("is-saving");
          if (ok) {
            line.classList.add("is-saved");
            window.setTimeout(() => line.classList.remove("is-saved"), 2200);
          }
        });
      }, 0);
    }

    function onChange(event: Event) {
      const el = event.target;
      if (!(el instanceof HTMLInputElement)) return;
      if (el.type !== "checkbox" && el.type !== "radio") return;
      if (el.closest("[data-quiet-skip]")) return;

      const line = resolveLine(el);
      const key = line?.dataset.saveKey || el.name || el.id || "toggle";
      quiet!.markDirty([key]);
      if (line) line.dataset.saveKey = key;
      quiet!.schedulePersist();
      window.setTimeout(() => {
        void quiet!.persist("auto").then((ok) => {
          if (!line || !ok) return;
          line.classList.add("is-saved");
          window.setTimeout(() => line.classList.remove("is-saved"), 2200);
        });
      }, 80);
    }

    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    root.addEventListener("change", onChange);
    return () => {
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      root.removeEventListener("change", onChange);
    };
  }, [quiet]);

  return (
    <div className="ta-quiet-save-root" ref={rootRef} data-quiet-save="">
      {children}
    </div>
  );
}
