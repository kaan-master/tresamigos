import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "tresamigos-catering-tablet-mode";

export type CateringTabletScreen = "hub" | "browse" | "configure" | "checkout" | "success";

interface CateringTabletContextValue {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggleEnabled: () => void;
  screen: CateringTabletScreen;
  setScreen: (screen: CateringTabletScreen) => void;
  goHub: () => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  toggleMenu: () => void;
}

const CateringTabletContext = createContext<CateringTabletContextValue | null>(null);

function readEnabled() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function CateringTabletProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(readEnabled);
  const [screen, setScreen] = useState<CateringTabletScreen>("hub");
  const [menuOpen, setMenuOpen] = useState(false);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (value) {
      setScreen("hub");
      setMenuOpen(false);
    } else {
      setMenuOpen(false);
      setScreen("hub");
    }
  }, []);

  const toggleEnabled = useCallback(() => setEnabled(!enabled), [enabled, setEnabled]);

  const goHub = useCallback(() => {
    setScreen("hub");
    setMenuOpen(false);
  }, []);

  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);

  useEffect(() => {
    document.body.classList.toggle("catering-tablet-mode", enabled);
    return () => document.body.classList.remove("catering-tablet-mode");
  }, [enabled]);

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      toggleEnabled,
      screen,
      setScreen,
      goHub,
      menuOpen,
      setMenuOpen,
      toggleMenu
    }),
    [enabled, setEnabled, toggleEnabled, screen, goHub, menuOpen, toggleMenu]
  );

  return <CateringTabletContext.Provider value={value}>{children}</CateringTabletContext.Provider>;
}

export function useCateringTablet() {
  const context = useContext(CateringTabletContext);
  if (!context) {
    throw new Error("useCateringTablet must be used within CateringTabletProvider");
  }
  return context;
}
