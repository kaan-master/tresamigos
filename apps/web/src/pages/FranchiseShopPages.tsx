import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import type { FranchiseShopCatalogProduct, FranchiseShopSessionUser } from "@tresamigos/types";
import { dismissSiteBoot } from "../lib/waitForPageImages";
import {
  clearFranchiseToken,
  fetchFranchiseCatalog,
  fetchFranchiseMe,
  getFranchiseToken,
  loginFranchise,
  logoutFranchise,
  placeFranchiseOrder,
  setFranchiseToken
} from "../lib/franchiseShopApi";
import "./franchise-shop.css";

function formatEuro(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
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
    <div className="fs-shell">
      <form className="fs-card" onSubmit={(event) => void handleSubmit(event)}>
        <p className="fs-eyebrow">Franchise</p>
        <h1>Franchise login</h1>
        <p className="fs-lead">Log in om merch en materialen te bestellen voor jouw vestiging.</p>
        <label>
          <span>E-mail</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          <span>Wachtwoord</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
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
  const [qty, setQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
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
        const [me, catalog] = await Promise.all([fetchFranchiseMe(), fetchFranchiseCatalog()]);
        setUser(me.user);
        setProducts(catalog.products);
        setQty(Object.fromEntries(catalog.products.map((product) => [product.id, 0])));
      } catch {
        clearFranchiseToken();
        navigate("/franchise/login", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const cart = useMemo(
    () =>
      products
        .map((product) => ({ product, quantity: qty[product.id] || 0 }))
        .filter((line) => line.quantity > 0),
    [products, qty]
  );

  const total = cart.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);

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
      setMessage(`Bestelling ${result.order.orderNumber} geplaatst. Factuur: ${result.order.invoiceNumber}.`);
      setQty(Object.fromEntries(products.map((product) => [product.id, 0])));
      setNotes("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bestellen mislukt.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="fs-shell"><p className="fs-lead">Laden...</p></div>;
  if (!user) return <Navigate to="/franchise/login" replace />;

  return (
    <div className="fs-shell fs-shop">
      <header className="fs-shop-head">
        <div>
          <p className="fs-eyebrow">Franchise shop</p>
          <h1>Hallo {user.name}</h1>
          <p className="fs-lead">
            {user.locationCode} {user.locationName} · prijzen voor jouw franchise
          </p>
        </div>
        <button type="button" className="fs-ghost" onClick={() => void handleLogout()}>
          Uitloggen
        </button>
      </header>

      <div className="fs-shop-grid">
        <section className="fs-products">
          {products.length ? (
            products.map((product) => (
              <article key={product.id} className="fs-product">
                <div>
                  <h2>{product.name}</h2>
                  {product.description ? <p>{product.description}</p> : null}
                  <strong>{formatEuro(product.priceCents)}</strong>
                </div>
                <label>
                  <span>Aantal</span>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={qty[product.id] || 0}
                    onChange={(e) =>
                      setQty((current) => ({
                        ...current,
                        [product.id]: Math.max(0, Math.min(999, Number(e.target.value) || 0))
                      }))
                    }
                  />
                </label>
              </article>
            ))
          ) : (
            <p className="fs-lead">Nog geen producten met prijs voor jouw franchise.</p>
          )}
        </section>

        <aside className="fs-cart">
          <h2>Winkelwagen</h2>
          {cart.length ? (
            <ul>
              {cart.map((line) => (
                <li key={line.product.id}>
                  <span>
                    {line.quantity}× {line.product.name}
                  </span>
                  <strong>{formatEuro(line.product.priceCents * line.quantity)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="fs-lead">Nog leeg.</p>
          )}
          <label>
            <span>Opmerking</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </label>
          <div className="fs-total">
            <span>Totaal</span>
            <strong>{formatEuro(total)}</strong>
          </div>
          {message ? <p className="fs-error">{message}</p> : null}
          <button type="button" disabled={!cart.length || submitting} onClick={() => void handleOrder()}>
            {submitting ? "Bezig..." : "Bestelling plaatsen"}
          </button>
        </aside>
      </div>
    </div>
  );
}
