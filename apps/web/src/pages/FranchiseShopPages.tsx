import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import type { FranchiseShopCatalogProduct, FranchiseShopOrder, FranchiseShopSessionUser } from "@tresamigos/types";
import { assetUrl } from "../lib/api";
import { dismissSiteBoot } from "../lib/waitForPageImages";
import {
  clearFranchiseToken,
  fetchFranchiseCatalog,
  fetchFranchiseMe,
  fetchFranchiseOrders,
  getFranchiseToken,
  loginFranchise,
  logoutFranchise,
  placeFranchiseOrder,
  setFranchiseToken
} from "../lib/franchiseShopApi";
import "./franchise-shop.css";

type ShopTab = "catalog" | "orders" | "checkout";

const STATUS_LABELS: Record<string, string> = {
  nieuw: "Nieuw",
  bevestigd: "Bevestigd",
  verzonden: "Verzonden",
  afgerond: "Afgerond",
  geannuleerd: "Geannuleerd"
};

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
        <Link className="fs-back" to="/">
          Terug naar website
        </Link>
      </form>
    </div>
  );
}

export function FranchiseShopPage() {
  const navigate = useNavigate();
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
      } catch {
        clearFranchiseToken();
        navigate("/franchise/login", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

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
    setSubmitting(true);
    setMessage("");
    try {
      const result = await placeFranchiseOrder(
        cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        notes
      );
      setMessage(`Bestelling ${result.order.orderNumber} is geplaatst.`);
      setQty(Object.fromEntries(products.map((product) => [product.id, 0])));
      setNotes("");
      setOrders((current) => [result.order, ...current]);
      setTab("orders");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bestellen mislukt.");
    } finally {
      setSubmitting(false);
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
              Prijzen gelden voor {user.locationCode} {user.locationName}. Facturatie via Tres Amigos.
            </p>
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
              <p className={message.includes("geplaatst") ? "fs-success" : "fs-error"}>{message}</p>
            ) : null}
            <button type="button" disabled={!cart.length || submitting} onClick={() => void handleOrder()}>
              {submitting ? "Bezig..." : "Bestelling plaatsen"}
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
          {message && tab === "orders" ? <p className="fs-success">{message}</p> : null}
          {orders.length ? (
            <div className="fs-order-list">
              {orders.map((order) => (
                <article key={order.id} className="fs-order-card">
                  <header>
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <span>{new Date(order.createdAt).toLocaleString("nl-NL")}</span>
                    </div>
                    <span className="fs-order-status">{STATUS_LABELS[order.status] || order.status}</span>
                  </header>
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
