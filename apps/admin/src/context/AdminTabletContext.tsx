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
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
    setScreen(value ? "hub" : "panel");
    setMenuOpen(false);
    setSearchQuery("");
    if (!value && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, []);

  const toggleEnabled = useCallback(() => setEnabled(!enabled), [enabled, setEnabled]);

  const goHub = useCallback(() => {
    setScreen("hub");
    setMenuOpen(false);
    setSearchQuery("");
  }, []);

  const openPanel = useCallback(() => {
    setScreen("panel");
    setMenuOpen(false);
  }, []);

  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* browser may block without user gesture */
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle("admin-tablet-mode", enabled);
    return () => document.body.classList.remove("admin-tablet-mode");
  }, [enabled]);

  useEffect(() => {
    function onFullscreenChange() {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      document.body.classList.toggle("admin-fullscreen", active);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    onFullscreenChange();
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.body.classList.remove("admin-fullscreen");
    };
  }, []);

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
      toggleMenu,
      searchQuery,
      setSearchQuery,
      isFullscreen,
      toggleFullscreen
    }),
    [
      enabled,
      setEnabled,
      toggleEnabled,
      screen,
      goHub,
      openPanel,
      menuOpen,
      toggleMenu,
      searchQuery,
      isFullscreen,
      toggleFullscreen
    ]
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
