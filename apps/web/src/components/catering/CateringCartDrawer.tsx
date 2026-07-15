import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { CateringCartLine } from "@tresamigos/types";
import { formatEuro } from "../../lib/catering";
import { useCateringCart } from "../../context/CateringCartContext";
import { useLanguage } from "../../i18n/LanguageProvider";
import { IconMinus, IconPlus, IconShoppingCart, IconTrash, IconX } from "./CateringIcons";

function configSummary(line: CateringCartLine) {
  const parts: string[] = [];
  if (line.servings) parts.push(`${line.servings} servings`);
  const config = line.configuration;
  if (Array.isArray(config.proteins) && config.proteins.length) parts.push((config.proteins as string[]).join(", "));
  if (Array.isArray(config.toppings) && config.toppings.length) parts.push((config.toppings as string[]).join(", "));
  if (Array.isArray(config.sauces) && config.sauces.length) parts.push((config.sauces as string[]).join(", "));
  return parts.join(" · ");
}

function isSimpleLine(line: CateringCartLine) {
  return !line.servings && Object.keys(line.configuration).length === 0;
}

interface Props {
  resolveImage?: (line: CateringCartLine) => string | undefined;
  onPlaceOrder: () => void;
}

export function CateringCartDrawer({ resolveImage, onPlaceOrder }: Props) {
  const { t } = useLanguage();
  const { cart, removeLine, updateLineQuantity, subtotalCents, drawerOpen, closeDrawer, lastAddedId } = useCateringCart();

  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return createPortal(
    <div className="catering-cart-drawer-root" role="presentation">
      <button type="button" className="catering-cart-drawer-backdrop" aria-label={t("common.close")} onClick={closeDrawer} />
      <aside className="catering-cart-drawer" role="dialog" aria-modal="true" aria-label={t("catering.cart")}>
        <header className="catering-cart-drawer-head">
          <div className="catering-cart-drawer-title">
            <IconShoppingCart width={20} height={20} />
            <div>
              <strong>{t("catering.cart")}</strong>
              <span>{cart.length ? `${cart.length} ${t("catering.cartItems")}` : t("catering.cartEmptyShort")}</span>
            </div>
          </div>
          <button type="button" className="catering-cart-drawer-close" aria-label={t("common.close")} onClick={closeDrawer}>
            <IconX width={18} height={18} />
          </button>
        </header>

        <div className="catering-cart-drawer-body">
          {cart.length ? (
            <ul className="catering-cart-drawer-lines">
              {cart.map((line) => {
                const image = resolveImage?.(line);
                const isNew = line.id === lastAddedId;
                const simple = isSimpleLine(line);
                return (
                  <li key={line.id} className={`catering-cart-drawer-line${isNew ? " is-new" : ""}`}>
                    <div className="catering-cart-drawer-thumb">
                      {image ? <img src={image} alt="" loading="lazy" /> : <span className="catering-cart-drawer-thumb-fallback" />}
                    </div>
                    <div className="catering-cart-drawer-copy">
                      <strong>{line.name.startsWith("catering.") ? t(line.name) : line.name}</strong>
                      {configSummary(line) ? <p>{configSummary(line)}</p> : null}
                      {simple ? (
                        <div className="catering-qty-stepper catering-qty-stepper-drawer">
                          <button type="button" aria-label={t("catering.qty.decrease")} onClick={() => updateLineQuantity(line.id, line.quantity - 1)}>
                            <IconMinus width={14} height={14} />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={line.quantity}
                            aria-label={t("catering.field.quantity")}
                            onChange={(event) => {
                              const next = Number(event.target.value);
                              if (Number.isFinite(next)) updateLineQuantity(line.id, next);
                            }}
                          />
                          <button type="button" aria-label={t("catering.qty.increase")} onClick={() => updateLineQuantity(line.id, line.quantity + 1)}>
                            <IconPlus width={14} height={14} />
                          </button>
                        </div>
                      ) : (
                        <span>
                          {line.quantity}× · {formatEuro(line.lineTotalCents)}
                        </span>
                      )}
                      {simple ? <span className="catering-cart-drawer-price">{formatEuro(line.lineTotalCents)}</span> : null}
                    </div>
                    <button type="button" className="catering-cart-drawer-remove" aria-label={t("catering.remove")} onClick={() => removeLine(line.id)}>
                      <IconTrash width={16} height={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="catering-cart-drawer-empty">{t("catering.cartEmpty")}</p>
          )}
        </div>

        <footer className="catering-cart-drawer-foot">
          <div className="catering-cart-total">
            <span>{t("catering.subtotal")}</span>
            <strong>{formatEuro(subtotalCents)}</strong>
          </div>
          <div className="catering-cart-drawer-actions">
            <button type="button" className="btn alt" onClick={closeDrawer}>
              {t("catering.continueShopping")}
            </button>
            <button type="button" className="btn primary" disabled={!cart.length} onClick={onPlaceOrder}>
              {t("catering.placeOrder")}
            </button>
          </div>
        </footer>
      </aside>
    </div>,
    document.body
  );
}
