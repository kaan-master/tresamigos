import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CateringCartLine, CateringCategoryId } from "@tresamigos/types";
import type { SiteContent } from "@tresamigos/types";
import { CateringProductModal } from "../components/catering/CateringProductModal";
import { Helmet } from "../components/Helmet";
import { useLanguage } from "../i18n/LanguageProvider";
import { submitCatering } from "../lib/api";
import {
  CATERING_CATEGORIES,
  FulfillmentMode,
  LARGE_GROUP_EMAIL,
  buildSimpleLine,
  cartItemCount,
  cartSubtotal,
  formatEuro,
  fulfillmentHoursLabel,
  isDeliveryAvailableToday,
  isScheduledWithinHours,
  productsByCategory
} from "../lib/catering";
import type { CateringProduct } from "../lib/catering/catalog";

type ShopView = "landing" | "shop" | "cart" | "checkout" | "success";

interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  locationId: string;
  address: string;
  date: string;
  time: string;
}

const emptyCheckout = (): CheckoutForm => ({
  name: "",
  email: "",
  phone: "",
  company: "",
  notes: "",
  locationId: "",
  address: "",
  date: "",
  time: ""
});

function configSummary(line: CateringCartLine) {
  const parts: string[] = [];
  if (line.servings) parts.push(`${line.servings} servings`);
  const config = line.configuration;
  if (Array.isArray(config.proteins) && config.proteins.length) parts.push(`Proteins: ${(config.proteins as string[]).join(", ")}`);
  if (Array.isArray(config.toppings) && config.toppings.length) parts.push(`Toppings: ${(config.toppings as string[]).join(", ")}`);
  if (Array.isArray(config.sauces) && config.sauces.length) parts.push(`Sauces: ${(config.sauces as string[]).join(", ")}`);
  if (Array.isArray(config.tortillas) && config.tortillas.length) parts.push(`Tortilla: ${(config.tortillas as string[]).join(", ")}`);
  if (config.cream) parts.push(String(config.cream));
  return parts.join(" · ");
}

export function CateringPage({ content }: { content: SiteContent }) {
  const { t } = useLanguage();
  const { locations } = content;
  const activeLocations = locations.filter((location) => location.active !== false);

  const [view, setView] = useState<ShopView>("landing");
  const [fulfillment, setFulfillment] = useState<FulfillmentMode>("pickup");
  const [category, setCategory] = useState<CateringCategoryId>("buffet");
  const [cart, setCart] = useState<CateringCartLine[]>([]);
  const [activeProduct, setActiveProduct] = useState<CateringProduct | null>(null);
  const [checkout, setCheckout] = useState<CheckoutForm>(emptyCheckout);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const deliveryAvailable = isDeliveryAvailableToday();
  const subtotal = useMemo(() => cartSubtotal(cart), [cart]);
  const itemCount = useMemo(() => cartItemCount(cart), [cart]);
  const visibleProducts = useMemo(() => productsByCategory(category), [category]);

  useEffect(() => {
    if (view === "landing") return;
    window.scrollTo({ top: 0, behavior: "auto" });
    document.querySelector(".catering-page")?.classList.add("in-view");
  }, [view]);

  useEffect(() => {
    if (!deliveryAvailable && fulfillment === "delivery") {
      setFulfillment("pickup");
    }
  }, [deliveryAvailable, fulfillment]);

  function openProduct(product: CateringProduct) {
    if (product.configurable) {
      setActiveProduct(product);
      return;
    }
    const line = buildSimpleLine(product, 1);
    line.name = t(product.nameKey);
    setCart((current) => [...current, line]);
  }

  function addLine(line: CateringCartLine) {
    setCart((current) => [...current, line]);
  }

  function removeLine(id: string) {
    setCart((current) => current.filter((line) => line.id !== id));
  }

  function validateCheckout() {
    setMessage("");
    if (!cart.length) {
      setMessage(t("catering.error.emptyCart"));
      return false;
    }
    if (fulfillment === "pickup" && !checkout.locationId) {
      setMessage(t("catering.error.location"));
      return false;
    }
    if (fulfillment === "delivery" && checkout.address.trim().length < 8) {
      setMessage(t("catering.error.address"));
      return false;
    }
    if (!checkout.date || !checkout.time) {
      setMessage(t("catering.error.datetime"));
      return false;
    }
    if (!isScheduledWithinHours(fulfillment, checkout.date, checkout.time)) {
      setMessage(
        fulfillment === "pickup"
          ? t("catering.error.pickupHours")
          : t("catering.error.deliveryHours")
      );
      return false;
    }
    if (!checkout.name.trim()) {
      setMessage(t("contact.errorName"));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkout.email.trim())) {
      setMessage(t("contact.errorEmail"));
      return false;
    }
    return true;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validateCheckout() || submitting) return;

    setSubmitting(true);
    try {
      const response = await submitCatering({
        items: cart.map((line) => ({ ...line, name: line.name.startsWith("catering.") ? t(line.name) : line.name })),
        subtotalCents: subtotal,
        fulfillment,
        locationId: checkout.locationId,
        address: checkout.address,
        eventDate: checkout.date,
        eventTime: checkout.time,
        name: checkout.name,
        email: checkout.email,
        phone: checkout.phone,
        company: checkout.company,
        notes: checkout.notes
      });
      setOrderNumber(response.order?.orderNumber || "");
      setView("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("contact.errorSend"));
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    setView("landing");
    setCart([]);
    setCheckout(emptyCheckout());
    setOrderNumber("");
    setMessage("");
  }

  if (view === "landing") {
    return (
      <>
        <Helmet title={t("catering.seoTitle")} description={t("catering.seoDesc")} />
        <section className="catering-landing">
          <div className="shell catering-landing-grid">
            <div className="catering-landing-copy">
              <p className="eyebrow">{t("catering.eyebrow")}</p>
              <h1>{t("catering.title")}</h1>
              <p>{t("catering.intro")}</p>
              <button type="button" className="btn primary" onClick={() => setView("shop")}>
                {t("catering.start")}
              </button>
            </div>
            <div className="catering-landing-visual">
              <img src="/assets/brand/breakfast-lunch-dinner.png" alt={t("catering.title")} />
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Helmet title={t("catering.seoTitle")} description={t("catering.seoDesc")} />
      <section className="catering-page catering-shop">
        <div className="shell">
          <div className="catering-shop-head">
            <div>
              <p className="eyebrow">{t("catering.eyebrow")}</p>
              <h1>{t("catering.shopTitle")}</h1>
              <p className="catering-hours">
                {t("catering.pickupHours")}: {fulfillmentHoursLabel("pickup")} · {t("catering.deliveryHours")}:{" "}
                {fulfillmentHoursLabel("delivery")}
              </p>
              {!deliveryAvailable ? <p className="catering-hint">{t("catering.deliveryUnavailable")}</p> : null}
              <p className="catering-hint">
                {t("catering.largeGroup")}{" "}
                <a href={`mailto:${LARGE_GROUP_EMAIL}`}>{LARGE_GROUP_EMAIL}</a>
              </p>
            </div>
            <button type="button" className="btn primary catering-cart-btn" onClick={() => setView("cart")}>
              {t("catering.cart")} ({itemCount}) · {formatEuro(subtotal)}
            </button>
          </div>

          {view === "success" ? (
            <div className="catering-success">
              <p className="eyebrow">{t("catering.success.eyebrow")}</p>
              <h2>{t("catering.success.title")}</h2>
              {orderNumber ? <p>{t("catering.success.orderNumber").replace("{number}", orderNumber)}</p> : null}
              <p>{t("catering.success.body")}</p>
              <button type="button" className="btn primary" onClick={restart}>
                {t("catering.success.new")}
              </button>
            </div>
          ) : null}

          {view === "shop" ? (
            <>
              <div className="catering-mode-grid">
                <button
                  type="button"
                  className={`catering-mode${fulfillment === "pickup" ? " is-selected" : ""}`}
                  onClick={() => setFulfillment("pickup")}
                >
                  {t("catering.mode.pickup")}
                </button>
                <button
                  type="button"
                  className={`catering-mode${fulfillment === "delivery" ? " is-selected" : ""}`}
                  disabled={!deliveryAvailable}
                  onClick={() => setFulfillment("delivery")}
                >
                  {t("catering.mode.delivery")}
                </button>
              </div>

              <div className="catering-category-tabs">
                {CATERING_CATEGORIES.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={category === entry.id ? "active" : ""}
                    onClick={() => setCategory(entry.id)}
                  >
                    {t(entry.labelKey)}
                  </button>
                ))}
              </div>

              <div className="catering-product-grid">
                {visibleProducts.map((product) => (
                  <button key={product.id} type="button" className="catering-product-card" onClick={() => openProduct(product)}>
                    <img src={product.image} alt={t(product.nameKey)} loading="lazy" />
                    <div>
                      <strong>{t(product.nameKey)}</strong>
                      <p>{t(product.descKey)}</p>
                      <span>{formatEuro(product.basePriceCents)}+</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {view === "cart" ? (
            <div className="catering-cart-panel">
              <h2>{t("catering.cartReview")}</h2>
              {cart.length ? (
                <div className="catering-cart-lines">
                  {cart.map((line) => (
                    <article key={line.id} className="catering-cart-line">
                      <div>
                        <strong>{line.name.startsWith("catering.") ? t(line.name) : line.name}</strong>
                        <p>{configSummary(line)}</p>
                        <span>
                          {line.quantity}× · {formatEuro(line.lineTotalCents)}
                        </span>
                      </div>
                      <button type="button" className="btn alt" onClick={() => removeLine(line.id)}>
                        {t("catering.remove")}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="catering-hint">{t("catering.cartEmpty")}</p>
              )}
              <div className="catering-cart-total">
                <span>{t("catering.subtotal")}</span>
                <strong>{formatEuro(subtotal)}</strong>
              </div>
              <div className="catering-actions">
                <button type="button" className="btn alt" onClick={() => setView("shop")}>
                  {t("catering.continueShopping")}
                </button>
                <button type="button" className="btn primary" disabled={!cart.length} onClick={() => setView("checkout")}>
                  {t("catering.checkout")}
                </button>
              </div>
            </div>
          ) : null}

          {view === "checkout" ? (
            <form className="catering-checkout" onSubmit={handleSubmit}>
              <h2>{t("catering.step.checkout")}</h2>
              <p>{t("catering.guestCheckout")}</p>

              {fulfillment === "pickup" ? (
                <label className="form-field">
                  <span>{t("catering.field.location")}</span>
                  <select
                    value={checkout.locationId}
                    onChange={(event) => setCheckout((current) => ({ ...current, locationId: event.target.value }))}
                  >
                    <option value="">{t("catering.field.locationPlaceholder")}</option>
                    {activeLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="form-field">
                  <span>{t("catering.field.address")}</span>
                  <textarea
                    value={checkout.address}
                    onChange={(event) => setCheckout((current) => ({ ...current, address: event.target.value }))}
                    placeholder={t("catering.field.addressPlaceholder")}
                  />
                </label>
              )}

              <div className="contact-form-row catering-datetime">
                <label className="form-field">
                  <span>{t("catering.field.date")}</span>
                  <input
                    type="date"
                    value={checkout.date}
                    onChange={(event) => setCheckout((current) => ({ ...current, date: event.target.value }))}
                  />
                </label>
                <label className="form-field">
                  <span>{t("catering.field.time")}</span>
                  <input
                    type="time"
                    value={checkout.time}
                    onChange={(event) => setCheckout((current) => ({ ...current, time: event.target.value }))}
                  />
                </label>
              </div>

              <label className="form-field">
                <span>{t("contact.name")}</span>
                <input value={checkout.name} onChange={(event) => setCheckout((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="form-field">
                <span>{t("contact.emailField")}</span>
                <input
                  type="email"
                  value={checkout.email}
                  onChange={(event) => setCheckout((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label className="form-field">
                <span>{t("apply.phone")}</span>
                <input value={checkout.phone} onChange={(event) => setCheckout((current) => ({ ...current, phone: event.target.value }))} />
              </label>
              <label className="form-field">
                <span>{t("catering.field.company")}</span>
                <input value={checkout.company} onChange={(event) => setCheckout((current) => ({ ...current, company: event.target.value }))} />
              </label>
              <label className="form-field">
                <span>{t("catering.field.notes")}</span>
                <textarea
                  value={checkout.notes}
                  onChange={(event) => setCheckout((current) => ({ ...current, notes: event.target.value }))}
                  placeholder={t("catering.field.notesPlaceholder")}
                />
              </label>

              <div className="catering-cart-total">
                <span>{t("catering.subtotal")}</span>
                <strong>{formatEuro(subtotal)}</strong>
              </div>

              <div className="catering-payment-placeholder">
                <strong>{t("catering.payment.title")}</strong>
                <p>{t("catering.payment.body")}</p>
              </div>

              {message ? <p className="contact-form-message error">{message}</p> : null}

              <div className="catering-actions">
                <button type="button" className="btn alt" onClick={() => setView("cart")}>
                  {t("common.back")}
                </button>
                <button type="submit" className="btn primary" disabled={submitting}>
                  {submitting ? t("common.submitting") : t("catering.pay")}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </section>

      {activeProduct ? (
        <CateringProductModal
          product={activeProduct}
          open={Boolean(activeProduct)}
          onClose={() => setActiveProduct(null)}
          onAdd={addLine}
        />
      ) : null}
    </>
  );
}
