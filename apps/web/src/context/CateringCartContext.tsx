import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CateringCartLine } from "@tresamigos/types";
import { cartItemCount, cartSubtotal } from "../lib/catering";

const STORAGE_KEY = "tresamigos-catering-cart";

interface CateringCartContextValue {
  cart: CateringCartLine[];
  setCart: React.Dispatch<React.SetStateAction<CateringCartLine[]>>;
  addLine: (line: CateringCartLine) => void;
  removeLine: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotalCents: number;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  lastAddedId: string | null;
  cartPulse: boolean;
}

const CateringCartContext = createContext<CateringCartContextValue | null>(null);

function readStoredCart(): CateringCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CateringCartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CateringCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CateringCartLine[]>(readStoredCart);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [cartPulse, setCartPulse] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const addLine = useCallback((line: CateringCartLine) => {
    setCart((current) => [...current, line]);
    setLastAddedId(line.id);
    setCartPulse(true);
    setDrawerOpen(true);
    window.setTimeout(() => setCartPulse(false), 600);
  }, []);

  const value = useMemo(
    () => ({
      cart,
      setCart,
      addLine,
      removeLine: (id: string) => setCart((current) => current.filter((line) => line.id !== id)),
      clearCart: () => setCart([]),
      itemCount: cartItemCount(cart),
      subtotalCents: cartSubtotal(cart),
      drawerOpen,
      setDrawerOpen,
      openDrawer,
      closeDrawer,
      lastAddedId,
      cartPulse
    }),
    [cart, addLine, drawerOpen, openDrawer, closeDrawer, lastAddedId, cartPulse]
  );

  return <CateringCartContext.Provider value={value}>{children}</CateringCartContext.Provider>;
}

export function useCateringCart() {
  const context = useContext(CateringCartContext);
  if (!context) {
    throw new Error("useCateringCart must be used within CateringCartProvider");
  }
  return context;
}
