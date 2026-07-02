import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const value = useMemo(
    () => ({
      cart,
      setCart,
      addLine: (line: CateringCartLine) => setCart((current) => [...current, line]),
      removeLine: (id: string) => setCart((current) => current.filter((line) => line.id !== id)),
      clearCart: () => setCart([]),
      itemCount: cartItemCount(cart),
      subtotalCents: cartSubtotal(cart)
    }),
    [cart]
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
