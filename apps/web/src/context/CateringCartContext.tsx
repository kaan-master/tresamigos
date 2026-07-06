import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CateringCartLine } from "@tresamigos/types";
import { cartItemCount, cartSubtotal } from "../lib/catering";

const STORAGE_KEY = "tresamigos-catering-cart";

interface CateringCartContextValue {
  cart: CateringCartLine[];
  setCart: React.Dispatch<React.SetStateAction<CateringCartLine[]>>;
  addLine: (line: CateringCartLine) => void;
  updateLineQuantity: (id: string, quantity: number) => void;
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

function isMergeableSimpleLine(line: CateringCartLine) {
  return !line.servings && Object.keys(line.configuration).length === 0;
}

function mergeLines(current: CateringCartLine[], line: CateringCartLine) {
  if (!isMergeableSimpleLine(line)) return [...current, line];

  const existing = current.find((entry) => entry.productId === line.productId && isMergeableSimpleLine(entry));
  if (!existing) return [...current, line];

  const quantity = existing.quantity + line.quantity;
  return current.map((entry) =>
    entry.id === existing.id
      ? {
          ...entry,
          quantity,
          lineTotalCents: entry.unitPriceCents * quantity
        }
      : entry
  );
}

function recalcLine(line: CateringCartLine, quantity: number): CateringCartLine {
  return {
    ...line,
    quantity,
    lineTotalCents: line.unitPriceCents * quantity
  };
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
    setCart((current) => {
      const merged = mergeLines(current, line);
      const target = isMergeableSimpleLine(line)
        ? merged.find((entry) => entry.productId === line.productId && isMergeableSimpleLine(entry))
        : merged.find((entry) => entry.id === line.id);
      setLastAddedId(target?.id || line.id);
      return merged;
    });
    setCartPulse(true);
    setDrawerOpen(true);
    window.setTimeout(() => setCartPulse(false), 600);
  }, []);

  const updateLineQuantity = useCallback((id: string, quantity: number) => {
    setCart((current) => {
      if (quantity < 1) return current.filter((line) => line.id !== id);
      return current.map((line) => (line.id === id ? recalcLine(line, quantity) : line));
    });
  }, []);

  const value = useMemo(
    () => ({
      cart,
      setCart,
      addLine,
      updateLineQuantity,
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
    [cart, addLine, updateLineQuantity, drawerOpen, openDrawer, closeDrawer, lastAddedId, cartPulse]
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
