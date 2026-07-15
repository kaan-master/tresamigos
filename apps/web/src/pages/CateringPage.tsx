import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { CateringCartLine, CateringCategoryId } from "@tresamigos/types";
import type { SiteContent } from "@tresamigos/types";
import { CateringCartDrawer } from "../components/catering/CateringCartDrawer";
import { CateringDateTimeFields } from "../components/catering/CateringDateTimeFields";
import { CateringProductConfigurator } from "../components/catering/CateringProductModal";
import { CateringSimpleProductCard } from "../components/catering/CateringSimpleProductCard";
import { CateringFlowSteps, type FlowStep } from "../components/catering/CateringFlowSteps";
import { Helmet } from "../components/Helmet";
import { useCateringCart } from "../context/CateringCartContext";
import { useLanguage } from "../i18n/LanguageProvider";
import { submitCatering } from "../lib/api";
import {
  CATERING_CATEGORIES,
  FulfillmentMode,
  formatEuro,
  fulfillmentHoursLabel,
  isDeliveryAvailableToday,
  isPickupAvailable,
  isScheduledWithinHours,
  productDescription,
  productLabel,
  resolveCateringCatalog
} from "../lib/catering";
import { cateringImageUrl } from "../lib/catering/images";
import type { CateringProduct } from "../lib/catering/catalog";

type ShopView = "landing" | "shop" | "configure" | "checkout" | "success";

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

export function CateringPage({ content }: { content: SiteContent }) {
  const { t, lang } = useLanguage();
  const { locations } = content;
  const activeLocations = locations.filter((location) => location.active !== false);
  const [searchParams] = useSearchParams();
  const {
    cart,
    addLine,
    clearCart,
    subtotalCents: subtotal,
    openDrawer,
    closeDrawer,
    drawerOpen
  } = useCateringCart();

  const fulfillmentSettings = content.site.catering.fulfillment;
  const pickupEnabled = isPickupAvailable(fulfillmentSettings);
  const deliveryEnabled = isDeliveryAvailableToday(fulfillmentSettings);

  const [view, setView] = useState<ShopView>("shop");
  const [fulfillment, setFulfillment] = useState<FulfillmentMode>(() => (pickupEnabled ? "pickup" : "delivery"));
  const [category, setCategory] = useState<CateringCategoryId>("tacos");
  const [activeProduct, setActiveProduct] = useState<CateringProduct | null>(null);
  const [checkout, setCheckout] = useState<CheckoutForm>(emptyCheckout);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const catalog = useMemo(() => resolveCateringCatalog(content.site.catering, lang), [content.site.catering, lang]);
  const visibleProducts = useMemo(() => catalog.productsByCategory(category), [catalog, category]);
  const productImageMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of catalog.products) {
      map.set(product.id, product.image);
    }
    return map;
  }, [catalog.products]);

  const categoryTabs = useMemo(() => {
    const fromSettings = catalog.categories.filter((entry) => entry.visible).sort((a, b) => a.sortOrder - b.sortOrder);
    const base = fromSettings.length ? fromSettings.map((entry) => ({ id: entry.id })) : CATERING_CATEGORIES.map((entry) => ({ id: entry.id }));
    return base.filter((entry) => catalog.productsByCategory(entry.id).length > 0);
  }, [catalog]);

  const resolveLineImage = useCallback(
    (line: CateringCartLine) => cateringImageUrl(line.imageUrl || productImageMap.get(line.productId)),
    [productImageMap]
  );

  useEffect(() => {
    if (categoryTabs.length && !categoryTabs.some((entry) => entry.id === category)) {
      setCategory(categoryTabs[0].id);
    }
  }, [categoryTabs, category]);

  useEffect(() => {
    if (searchParams.get("view") !== "cart") return;
    setView((current) => (current === "landing" ? "shop" : current));
    if (cart.length) openDrawer();
  }, [searchParams, cart.length, openDrawer]);

  useEffect(() => {
    if (view === "landing") return;
    window.scrollTo({ top: 0, behavior: "auto" });
    document.querySelector(".catering-page")?.classList.add("in-view");
  }, [view]);

  useEffect(() => {
    if (!deliveryEnabled && fulfillment === "delivery") {
      setFulfillment(pickupEnabled ? "pickup" : "delivery");
    }
    if (!pickupEnabled && fulfillment === "pickup") {
      setFulfillment(deliveryEnabled ? "delivery" : "pickup");
    }
  }, [deliveryEnabled, pickupEnabled, fulfillment]);

  useEffect(() => {
    document.body.classList.toggle("catering-drawer-open", drawerOpen);
    return () => document.body.classList.remove("catering-drawer-open");
  }, [drawerOpen]);

  function openProduct(product: CateringProduct) {
    if (!product.configurable) return;
    setActiveProduct(product);
    setView("configure");
  }

  function flowStep(): FlowStep {
    if (view === "success") return "done";
    if (view === "checkout") return "checkout";
    if (view === "configure") return "package";
    if (view === "shop") return "category";
    return "method";
  }

  function navigateFlow(step: FlowStep) {
    if (step === "method" || step === "category") setView("shop");
    if (step === "package") {
      setActiveProduct(null);
      setView("shop");
    }
    if (step === "checkout" && cart.length) {
      closeDrawer();
      setView("checkout");
    }
  }

  function goToCheckout() {
    closeDrawer();
    setView("checkout");
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
    if (!isScheduledWithinHours(fulfillment, checkout.date, checkout.time, fulfillmentSettings)) {
      const hours = fulfillmentHoursLabel(fulfillment, fulfillmentSettings);
      setMessage(
        fulfillment === "pickup"
          ? t("catering.error.pickupHours").replace("{hours}", hours)
          : t("catering.error.deliveryHours").replace("{hours}", hours)
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
      clearCart();
      setView("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("contact.errorSend"));
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    setView("shop");
    clearCart();
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
      {view === "configure" && activeProduct ? (
        <div className="shell">
          <CateringFlowSteps current="package" onNavigate={navigateFlow} />
          <CateringProductConfigurator
            product={activeProduct}
            settings={content.site.catering}
            onBack={() => {
              setActiveProduct(null);
              setView("shop");
            }}
            onAdd={addLine}
          />
        </div>
      ) : (
        <section className="catering-page catering-shop">
          <div className="shell catering-shell">
            <CateringFlowSteps current={flowStep()} onNavigate={navigateFlow} />

            <div className="catering-shop-head">
              <div>
                <p className="eyebrow">{t("catering.eyebrow")}</p>
                <h1>
                  {view === "checkout"
                    ? t("catering.step.orderDetails")
                    : view === "success"
                      ? t("catering.success.title")
                      : t("catering.shopTitle")}
                </h1>
                {view === "shop" ? (
                  <>
                    <p className="catering-hours">
                      {pickupEnabled ? (
                        <>
                          {t("catering.pickupHours")}: {fulfillmentHoursLabel("pickup", fulfillmentSettings)}
                        </>
                      ) : null}
                      {pickupEnabled && deliveryEnabled ? " · " : null}
                      {deliveryEnabled ? (
                        <>
                          {t("catering.deliveryHours")}: {fulfillmentHoursLabel("delivery", fulfillmentSettings)}
                        </>
                      ) : null}
                    </p>
                    {!deliveryEnabled ? <p className="catering-hint">{t("catering.deliveryUnavailable")}</p> : null}
                    <p className="catering-group-notice">
                      {t("catering.largeGroupNotice")}{" "}
                      <a href={`mailto:${catalog.largeGroupEmail}`}>{catalog.largeGroupEmail}</a>.
                    </p>
                  </>
                ) : null}
              </div>
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
                  {pickupEnabled ? (
                    <button
                      type="button"
                      className={`catering-mode${fulfillment === "pickup" ? " is-selected" : ""}`}
                      onClick={() => setFulfillment("pickup")}
                    >
                      {t("catering.mode.pickup")}
                    </button>
                  ) : null}
                  {deliveryEnabled ? (
                    <button
                      type="button"
                      className={`catering-mode${fulfillment === "delivery" ? " is-selected" : ""}`}
                      onClick={() => setFulfillment("delivery")}
                    >
                      {t("catering.mode.delivery")}
                    </button>
                  ) : null}
                </div>

                <div className="catering-category-tabs">
                  {categoryTabs.map((entry) => (
                    <button key={entry.id} type="button" className={category === entry.id ? "active" : ""} onClick={() => setCategory(entry.id)}>
                      {catalog.categoryLabel(entry.id, t)}
                    </button>
                  ))}
                </div>

                <div className="catering-product-grid">
                  {visibleProducts.map((product) =>
                    product.configurable ? (
                      <button key={product.id} type="button" className="catering-product-card" onClick={() => openProduct(product)}>
                        <div className="catering-product-card-media">
                          <img src={cateringImageUrl(product.image)} alt={productLabel(product, t)} loading="lazy" />
                        </div>
                        <div>
                          <strong>{productLabel(product, t)}</strong>
                          <p>{productDescription(product, t)}</p>
                          <span>{formatEuro(product.basePriceCents)}+</span>
                        </div>
                      </button>
                    ) : (
                      <CateringSimpleProductCard key={product.id} product={product} />
                    )
                  )}
                </div>
              </>
            ) : null}

            {view === "checkout" ? (
              <form className="catering-checkout" onSubmit={handleSubmit}>
                <p className="catering-checkout-intro">{t("catering.guestCheckout")}</p>

                {fulfillment === "pickup" ? (
                  <div className="form-field">
                    <span>{t("catering.field.location")}</span>
                    <div className="catering-choice-grid catering-location-grid">
                      {activeLocations.map((location) => (
                        <button
                          key={location.id}
                          type="button"
                          className={`catering-choice catering-location-choice${checkout.locationId === location.id ? " is-selected" : ""}`}
                          onClick={() => setCheckout((current) => ({ ...current, locationId: location.id }))}
                        >
                          <strong>{location.name}</strong>
                          <span>{location.area}</span>
                        </button>
                      ))}
                    </div>
                  </div>
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

                <CateringDateTimeFields
                  date={checkout.date}
                  time={checkout.time}
                  onDateChange={(value) => setCheckout((current) => ({ ...current, date: value }))}
                  onTimeChange={(value) => setCheckout((current) => ({ ...current, time: value }))}
                />

                <div className="catering-checkout-contact">
                  <label className="form-field">
                    <span>{t("contact.name")}</span>
                    <input value={checkout.name} onChange={(event) => setCheckout((current) => ({ ...current, name: event.target.value }))} />
                  </label>
                  <label className="form-field">
                    <span>{t("contact.emailField")}</span>
                    <input type="email" value={checkout.email} onChange={(event) => setCheckout((current) => ({ ...current, email: event.target.value }))} />
                  </label>
                  <label className="form-field">
                    <span>{t("apply.phone")}</span>
                    <input value={checkout.phone} onChange={(event) => setCheckout((current) => ({ ...current, phone: event.target.value }))} />
                  </label>
                  <label className="form-field">
                    <span>{t("catering.field.company")}</span>
                    <input value={checkout.company} onChange={(event) => setCheckout((current) => ({ ...current, company: event.target.value }))} />
                  </label>
                </div>

                <label className="form-field">
                  <span>{t("catering.field.notes")}</span>
                  <textarea
                    value={checkout.notes}
                    onChange={(event) => setCheckout((current) => ({ ...current, notes: event.target.value }))}
                    placeholder={t("catering.field.notesPlaceholder")}
                  />
                </label>

                <div className="catering-checkout-summary">
                  <div className="catering-cart-total">
                    <span>{t("catering.subtotal")}</span>
                    <strong>{formatEuro(subtotal)}</strong>
                  </div>
                  <p className="catering-checkout-note">{t("catering.orderNote")}</p>
                </div>

                {message ? <p className="contact-form-message error">{message}</p> : null}

                <div className="catering-actions">
                  <button type="button" className="btn alt" onClick={() => setView("shop")}>
                    {t("common.back")}
                  </button>
                  <button type="submit" className="btn primary" disabled={submitting}>
                    {submitting ? t("common.submitting") : t("catering.placeOrder")}
                  </button>
                </div>
              </form>
            ) : null}

            <CateringCartDrawer resolveImage={resolveLineImage} onPlaceOrder={goToCheckout} />
          </div>
        </section>
      )}
    </>
  );
}
