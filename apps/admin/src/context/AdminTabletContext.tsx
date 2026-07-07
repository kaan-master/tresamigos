import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "tresamigos-admin-tablet-mode";

export type AdminTabletScreen = "hub" | "panel";

interface AdminTabletContextValue {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggleEnabled: () => void;
  screen: AdminTabletScreen;
  setScreen: (screen: AdminTabletScreen) => void;
  goHub: () => void;
  openPanel: () => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  toggleMenu: () => void;
}

const AdminTabletContext = createContext<AdminTabletContextValue | null>(null);

function readEnabled() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AdminTabletProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(readEnabled);
  const [screen, setScreen] = useState<AdminTabletScreen>("hub");
  const [menuOpen, setMenuOpen] = useState(false);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
    setScreen(value ? "hub" : "panel");
    setMenuOpen(false);
  }, []);

  const toggleEnabled = useCallback(() => setEnabled(!enabled), [enabled, setEnabled]);

  const goHub = useCallback(() => {
    setScreen("hub");
    setMenuOpen(false);
  }, []);

  const openPanel = useCallback(() => {
    setScreen("panel");
    setMenuOpen(false);
  }, []);

  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);

  useEffect(() => {
    document.body.classList.toggle("admin-tablet-mode", enabled);
    return () => document.body.classList.remove("admin-tablet-mode");
  }, [enabled]);

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      toggleEnabled,
      screen,
      setScreen,
      goHub,
      openPanel,
      menuOpen,
      setMenuOpen,
      toggleMenu
    }),
    [enabled, setEnabled, toggleEnabled, screen, goHub, openPanel, menuOpen, toggleMenu]
  );

  return <AdminTabletContext.Provider value={value}>{children}</AdminTabletContext.Provider>;
}

export function useAdminTablet() {
  const context = useContext(AdminTabletContext);
  if (!context) {
    throw new Error("useAdminTablet must be used within AdminTabletProvider");
  }
  return context;
}
