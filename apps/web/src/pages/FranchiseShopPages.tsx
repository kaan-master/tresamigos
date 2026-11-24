import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import type {
  FranchiseShopCatalogProduct,
  FranchiseShopOrder,
  FranchiseShopOrderStatus,
  FranchiseShopPaymentMethod,
  FranchiseShopPaymentStatus,
  FranchiseShopSessionUser
} from "@tresamigos/types";
import {
  FRANCHISE_SHOP_ORDER_STATUS_COLORS,
  FRANCHISE_SHOP_ORDER_STATUS_LABELS,
  FRANCHISE_SHOP_PAYMENT_STATUS_LABELS
} from "@tresamigos/types";
import { assetUrl } from "../lib/api";
import { dismissSiteBoot } from "../lib/waitForPageImages";
import {
  clearFranchiseToken,
  downloadFranchisePdf,
  fetchFranchiseCatalog,
  fetchFranchiseMe,
  fetchFranchiseOrders,
  fetchFranchisePaymentStatus,
  getFranchiseToken,
  loginFranchise,
  logoutFranchise,
  placeFranchiseOrder,
  setFranchiseToken
} from "../lib/franchiseShopApi";
import "./franchise-shop.css";

type ShopTab = "catalog" | "orders" | "checkout";

const TERMINAL_PAYMENT: FranchiseShopPaymentStatus[] = ["paid", "failed", "canceled", "expired", "invoice"];

function orderStatusLabel(status: string) {
  return FRANCHISE_SHOP_ORDER_STATUS_LABELS[status as FranchiseShopOrderStatus] || status;
}

function orderStatusColor(status: string) {
  return FRANCHISE_SHOP_ORDER_STATUS_COLORS[status as FranchiseShopOrderStatus] || "#8a8886";
}

function paymentStatusLabel(status: string) {
  return FRANCHISE_SHOP_PAYMENT_STATUS_LABELS[status as FranchiseShopPaymentStatus] || status;
}

function productImage(path?: string) {
  if (!path) return "/assets/site/tres-amigos-logo-new.png";
  return assetUrl(path.replace(/^\/+/, ""));
}

function formatEuro(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format((cents || 0) / 100);
}

function QtyControl({
  value,
  onChange,
  ariaLabel
}: {
  value: number;
  onChange: (next: number) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="fs-qty" role="group" aria-label={ariaLabel || "Aantal"}>
      <button type="button" aria-label="Minder" onClick={() => onChange(value - 1)}>
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={String(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          onChange(digits ? Number(digits) : 0);
        }}
        aria-label="Aantal"
      />
      <button type="button" aria-label="Meer" onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

export function FranchiseLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dismissSiteBoot();
    if (getFranchiseToken()) navigate("/franchise/shop", { replace: true });
  }, [navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const data = await loginFranchise(email, password);
      setFranchiseToken(data.token);
      navigate("/franchise/shop", { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login mislukt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fs-shell fs-login">
      <form className="fs-card" onSubmit={(event) => void handleSubmit(event)}>
        <img className="fs-logo" src="/assets/site/tres-amigos-logo-new.png" alt="Tres Amigos" />
        <p className="fs-eyebrow">Franchise catalogus</p>
        <h1>Welkom terug</h1>
        <p className="fs-lead">Bestel materialen en merch voor jouw Tres Amigos-vestiging.</p>
        <label>
          <span>E-mail</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          <span>Wachtwoord</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {message ? <p className="fs-error">{message}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? "Bezig..." : "Inloggen"}
        </button>
        <Link className="fs-back" to="/franchise">
          Terug naar franchise
        </Link>
      </form>
    </div>
  );
}

export function FranchiseShopPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<FranchiseShopSessionUser | null>(null);
  const [products, setProducts] = useState<FranchiseShopCatalogProduct[]>([]);
  const [orders, setOrders] = useState<FranchiseShopOrder[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ShopTab>("catalog");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<FranchiseShopPaymentMethod>("invoice");
  const [paymentWatch, setPaymentWatch] = useState<{ orderId: string; label: string } | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    dismissSiteBoot();
    const token = getFranchiseToken();
    if (!token) {
      navigate("/franchise/login", { replace: true });
      return;
    }
    void (async () => {
      try {
        const [me, catalog, orderData] = await Promise.all([
          fetchFranchiseMe(),
          fetchFranchiseCatalog(),
          fetchFranchiseOrders().catch(() => ({ orders: [] as FranchiseShopOrder[] }))
        ]);
        setUser(me.user);
        setProducts(catalog.products);
        setOrders(orderData.orders);
        setQty(Object.fromEntries(catalog.products.map((product) => [product.id, 0])));
        setPaymentMethod(me.user.allowInvoicePayment === false ? "ideal" : "invoice");
      } catch {
        clearFranchiseToken();
        navigate("/franchise/login", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const orderId = searchParams.get("orderId") || "";
    const payment = searchParams.get("payment") || "";
    if (payment !== "return" || !orderId) return;
    setTab("orders");
    setPaymentWatch({ orderId, label: "Betaling controleren..." });
    setMessage("Terug van Mollie — status wordt bijgewerkt.");
    setSearchParams({}, { replace: true });
  }, [user, searchParams, setSearchParams]);

  useEffect(() => {
    if (!paymentWatch) return;
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      if (cancelled) return;
      attempts += 1;
      try {
        const result = await fetchFranchisePaymentStatus({ orderId: paymentWatch.orderId });
        setOrders((current) => {
          const rest = current.filter((item) => item.id !== result.order.id);
          return [result.order, ...rest];
        });
        const status = String(result.status || result.order.paymentStatus) as FranchiseShopPaymentStatus;
        if (TERMINAL_PAYMENT.includes(status) || result.settled) {
          setPaymentWatch(null);
          if (status === "paid") setMessage(`Betaling geslaagd voor ${result.order.orderNumber}. Factuur en pakbon staan klaar.`);
          else if (status === "failed" || status === "canceled" || status === "expired") {
            setMessage(`Betaling ${paymentStatusLabel(status).toLowerCase()} voor ${result.order.orderNumber}.`);
          } else setMessage(`Status: ${paymentStatusLabel(status)}.`);
          return;
        }
        setPaymentWatch({
          orderId: paymentWatch.orderId,
          label: `Wachten op bank… (${paymentStatusLabel(status)})`
        });
      } catch (error) {
        if (attempts >= 12) {
          setPaymentWatch(null);
          setMessage(error instanceof Error ? error.message : "Status ophalen mislukt.");
          return;
        }
      }
      pollRef.current = window.setTimeout(() => void poll(), 2500);
    }

    void poll();
    return () => {
      cancelled = true;
      if (pollRef.current != null) window.clearTimeout(pollRef.current);
    };
  }, [paymentWatch?.orderId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) =>
      `${product.name} ${product.description} ${product.sku}`.toLowerCase().includes(q)
    );
  }, [products, query]);

  const cart = useMemo(
    () =>
      products
        .map((product) => ({ product, quantity: qty[product.id] || 0 }))
        .filter((line) => line.quantity > 0),
    [products, qty]
  );

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotalCents = cart.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);

  function setLineQty(productId: string, next: number) {
    setQty((current) => ({
      ...current,
      [productId]: Math.max(0, Math.min(999, next))
    }));
  }

  async function handleLogout() {
    try {
      await logoutFranchise();
    } catch {
      clearFranchiseToken();
    }
    navigate("/franchise/login", { replace: true });
  }

  async function handleOrder() {
    if (!cart.length || submitting) return;
    const method: FranchiseShopPaymentMethod =
      user?.allowInvoicePayment === false ? "ideal" : paymentMethod;
    setSubmitting(true);
    setMessage("");
    try {
      const result = await placeFranchiseOrder(
        cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        notes,
        method
      );
      setQty(Object.fromEntries(products.map((product) => [product.id, 0])));
      setNotes("");
      setOrders((current) => [result.order, ...current]);
      if (result.checkoutUrl) {
        setMessage(`Bestelling ${result.order.orderNumber} — doorsturen naar iDEAL…`);
        window.location.href = result.checkoutUrl;
        return;
      }
      setMessage(result.message || `Bestelling ${result.order.orderNumber} is geplaatst.`);
      setTab("orders");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bestellen mislukt.");
    } finally {
      setSubmitting(false);
    }
  }

  async function downloadDocs(order: FranchiseShopOrder, kind: "invoice" | "packing-slip") {
    try {
      await downloadFranchisePdf(
        `/api/franchise/shop/orders/${order.id}/${kind === "invoice" ? "invoice.pdf" : "packing-slip.pdf"}`,
        kind === "invoice"
          ? `factuur-${order.invoiceNumber || order.orderNumber}.pdf`
          : `pakbon-${order.orderNumber}.pdf`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Download mislukt.");
    }
  }

  if (loading) {
    return (
      <div className="fs-shell fs-shop">
        <div className="fs-loading-wrap">
          <img src="/assets/site/tres-amigos-logo-new.png" alt="" />
          <p className="fs-lead">Catalogus laden...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/franchise/login" replace />;

  return (
    <div className="fs-shell fs-shop">
      <header className="fs-hero">
        <div className="fs-hero-brand">
          <img src="/assets/site/tres-amigos-logo-new.png" alt="Tres Amigos" />
          <div>
            <p className="fs-eyebrow">Tres Amigos</p>
            <h1>Franchise catalogus</h1>
            <p className="fs-lead">
              {user.locationCode} {user.locationName} · welkom {user.name.split(" ")[0]}
            </p>
          </div>
        </div>
        <nav className="fs-tabs" aria-label="Shop navigatie">
          <button type="button" className={tab === "catalog" ? "is-active" : ""} onClick={() => setTab("catalog")}>
            Catalogus
          </button>
          <button type="button" className={tab === "checkout" ? "is-active" : ""} onClick={() => setTab("checkout")}>
            Bestellijst{cartCount ? ` · ${cartCount}` : ""}
          </button>
          <button type="button" className={tab === "orders" ? "is-active" : ""} onClick={() => setTab("orders")}>
            Mijn orders
          </button>
          <button type="button" className="fs-ghost" onClick={() => void handleLogout()}>
            Uitloggen
          </button>
        </nav>
      </header>

      {tab === "catalog" ? (
        <>
          <div className="fs-catalog-head">
            <div>
              <h2>Assortiment</h2>
              <p className="fs-lead">
                Prijzen voor {user.locationCode} {user.locationName}. Bestel wat je nodig hebt voor de vestiging.
              </p>
            </div>
            <label className="fs-search">
              <span>Zoeken</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Zoek op naam of omschrijving..."
              />
            </label>
          </div>

          {products.length ? (
            filtered.length ? (
              <div className="fs-product-grid">
                {filtered.map((product) => {
                  const quantity = qty[product.id] || 0;
                  const hasPhoto = Boolean(product.image);
                  return (
                    <article key={product.id} className="fs-product-card">
                      <div className={`fs-product-media${hasPhoto ? "" : " is-logo"}`}>
                        <img src={productImage(product.image)} alt={product.name} loading="lazy" />
                      </div>
                      <div className="fs-product-body">
                        <div className="fs-product-title-row">
                          <h3>{product.name}</h3>
                          <strong className="fs-price">{formatEuro(product.priceCents)}</strong>
                        </div>
                        {product.description ? <p>{product.description}</p> : <p className="fs-muted">—</p>}
                        <div className="fs-product-foot">
                          <QtyControl value={quantity} onChange={(next) => setLineQty(product.id, next)} />
                          <button
                            type="button"
                            className="fs-add"
                            onClick={() => setLineQty(product.id, Math.max(1, quantity + 1))}
                          >
                            {quantity ? "Bijwerken" : "Toevoegen"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="fs-empty">
                <strong>Geen resultaten</strong>
                <p>Geen producten voor “{query}”.</p>
              </div>
            )
          ) : (
            <div className="fs-empty">
              <img src="/assets/site/tres-amigos-logo-new.png" alt="" />
              <strong>Catalogus komt eraan</strong>
              <p>Er staan nog geen producten klaar voor jouw vestiging. Neem contact op met Tres Amigos.</p>
            </div>
          )}

          {cartCount ? (
            <button type="button" className="fs-cart-fab" onClick={() => setTab("checkout")}>
              Bestellijst · {cartCount} artikel{cartCount === 1 ? "" : "en"}
            </button>
          ) : null}
        </>
      ) : null}

      {tab === "checkout" ? (
        <div className="fs-checkout">
          <section className="fs-checkout-main">
            <h2>Bestellijst</h2>
            {cart.length ? (
              <ul className="fs-checkout-lines">
                {cart.map((line) => (
                  <li key={line.product.id}>
                    <img src={productImage(line.product.image)} alt="" />
                    <div>
                      <strong>{line.product.name}</strong>
                      <span>
                        {formatEuro(line.product.priceCents)} · regel{" "}
                        {formatEuro(line.product.priceCents * line.quantity)}
                      </span>
                    </div>
                    <QtyControl value={line.quantity} onChange={(next) => setLineQty(line.product.id, next)} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="fs-empty">
                <strong>Nog leeg</strong>
                <p>Voeg artikelen toe vanuit de catalogus.</p>
                <button type="button" className="fs-add" onClick={() => setTab("catalog")}>
                  Naar catalogus
                </button>
              </div>
            )}
          </section>

          <aside className="fs-checkout-aside">
            <img className="fs-aside-logo" src="/assets/site/tres-amigos-logo-new.png" alt="" />
            <h2>Bestelling afronden</h2>
            <p className="fs-lead">
              Prijzen gelden voor {user.locationCode} {user.locationName}.
              {user.allowInvoicePayment === false
                ? " Dit account betaalt alleen via iDEAL."
                : " Kies factuur of iDEAL."}
            </p>
            {user.allowInvoicePayment !== false ? (
              <fieldset className="fs-pay-methods">
                <legend>Betaalwijze</legend>
                <label className={paymentMethod === "invoice" ? "is-active" : ""}>
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === "invoice"}
                    onChange={() => setPaymentMethod("invoice")}
                  />
                  <span>Op factuur</span>
                </label>
                <label className={paymentMethod === "ideal" ? "is-active" : ""}>
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === "ideal"}
                    onChange={() => setPaymentMethod("ideal")}
                  />
                  <span>iDEAL</span>
                </label>
              </fieldset>
            ) : (
              <p className="fs-lead">Betaalwijze: iDEAL</p>
            )}
            <label>
              <span>Opmerking</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Levertijd, contactpersoon, bijzonderheden..."
              />
            </label>
            <div className="fs-total">
              <span>{cartCount} artikel{cartCount === 1 ? "" : "en"}</span>
              <strong>{formatEuro(cartTotalCents)}</strong>
            </div>
            {message && tab === "checkout" ? (
              <p className={message.includes("geplaatst") || message.includes("Factuur") ? "fs-success" : "fs-error"}>
                {message}
              </p>
            ) : null}
            <button type="button" disabled={!cart.length || submitting} onClick={() => void handleOrder()}>
              {submitting
                ? "Bezig..."
                : (user.allowInvoicePayment === false ? "ideal" : paymentMethod) === "ideal"
                  ? "Betalen met iDEAL"
                  : "Bestelling op factuur"}
            </button>
          </aside>
        </div>
      ) : null}

      {tab === "orders" ? (
        <section className="fs-orders">
          <div className="fs-catalog-head">
            <div>
              <h2>Mijn orders</h2>
              <p className="fs-lead">Overzicht van geplaatste bestellingen en status.</p>
            </div>
          </div>
          {paymentWatch ? <p className="fs-lead">{paymentWatch.label}</p> : null}
          {message && tab === "orders" ? (
            <p
              className={
                message.toLowerCase().includes("mislukt") ||
                message.toLowerCase().includes("geannuleerd") ||
                message.toLowerCase().includes("verlopen")
                  ? "fs-error"
                  : "fs-success"
              }
            >
              {message}
            </p>
          ) : null}
          {orders.length ? (
            <div className="fs-order-list">
              {orders.map((order) => (
                <article key={order.id} className="fs-order-card">
                  <header>
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <span>{new Date(order.createdAt).toLocaleString("nl-NL")}</span>
                      <span className="fs-pay-meta">
                        {order.paymentMethod === "ideal" ? "iDEAL" : "Factuur"} · {paymentStatusLabel(order.paymentStatus)}
                        {order.invoiceNumber ? ` · ${order.invoiceNumber}` : ""}
                      </span>
                    </div>
                    <span className="fs-order-status">
                      <span
                        className="fs-order-status-dot"
                        style={{
                          background: orderStatusColor(order.status),
                          boxShadow: `0 0 0 3px ${orderStatusColor(order.status)}29`
                        }}
                        aria-hidden="true"
                      />
                      {orderStatusLabel(order.status)}
                    </span>
                  </header>
                  {order.question ? <p className="fs-order-next">{order.question}</p> : null}
                  <ul>
                    {order.items.map((item) => (
                      <li key={item.id}>
                        <span>
                          {item.quantity}× {item.productName}
                        </span>
                        <strong>{formatEuro(item.lineTotalCents)}</strong>
                      </li>
                    ))}
                  </ul>
                  <div className="fs-total">
                    <span>Totaal</span>
                    <strong>{formatEuro(order.subtotalCents)}</strong>
                  </div>
                  {order.documentsReady ? (
                    <div className="fs-doc-actions">
                      <button type="button" onClick={() => void downloadDocs(order, "invoice")}>
                        Factuur PDF
                      </button>
                      <button type="button" onClick={() => void downloadDocs(order, "packing-slip")}>
                        Pakbon PDF
                      </button>
                    </div>
                  ) : order.paymentMethod === "ideal" &&
                    (order.paymentStatus === "pending" || order.paymentStatus === "open") ? (
                    <p className="fs-lead">Wacht op iDEAL-betaling — daarna staan factuur en pakbon klaar.</p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="fs-empty">
              <strong>Nog geen orders</strong>
              <p>Plaats je eerste bestelling via de catalogus.</p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
