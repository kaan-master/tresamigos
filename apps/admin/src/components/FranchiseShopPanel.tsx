import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  FranchiseAccount,
  FranchiseShopOrder,
  FranchiseShopOrderStatus,
  FranchiseShopProduct,
  SiteContent
} from "@tresamigos/types";
import { api, downloadPdf } from "../lib/api";
import { mediaAssetUrl } from "../lib/media";
import { useAdminFeedback } from "../context/AdminFeedbackContext";
import { AdminListRow, AdminSearchBar } from "./AdminListUi";
import { IconPdf } from "./AdminIcons";
import { MediaField } from "./MediaPickerModal";

export type FranchiseShopView = "products" | "accounts" | "orders";

interface Props {
  content: SiteContent;
  /** Controlled view when embedded in Franchise Entra hub */
  view: FranchiseShopView;
}

const STATUS_LABELS: Record<FranchiseShopOrderStatus, string> = {
  nieuw: "Nieuw",
  bevestigd: "Bevestigd",
  verzonden: "Verzonden",
  afgerond: "Afgerond",
  geannuleerd: "Geannuleerd"
};

function formatEuro(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function FranchiseShopPanel({ content, view }: Props) {
  const { runSave } = useAdminFeedback();
  const [products, setProducts] = useState<FranchiseShopProduct[]>([]);
  const [accounts, setAccounts] = useState<FranchiseAccount[]>([]);
  const [orders, setOrders] = useState<FranchiseShopOrder[]>([]);
  const [query, setQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    sku: "",
    image: "",
    active: true,
    prices: {} as Record<string, string>
  });
  const [accountForm, setAccountForm] = useState({
    name: "",
    email: "",
    password: "",
    locationId: content.locations[0]?.id || "",
    company: "",
    vatId: "",
    kvk: "",
    active: true
  });
  const [orderStatus, setOrderStatus] = useState<FranchiseShopOrderStatus>("nieuw");
  const [orderNotes, setOrderNotes] = useState("");

  const locations = content.locations;

  async function loadAll() {
    try {
      const [productsData, accountsData, ordersData] = await Promise.all([
        api<{ products: FranchiseShopProduct[] }>("/api/admin/franchise-shop/products"),
        api<{ accounts: FranchiseAccount[] }>("/api/admin/franchise-shop/accounts"),
        api<{ orders: FranchiseShopOrder[] }>("/api/admin/franchise-shop/orders")
      ]);
      setProducts(productsData.products);
      setAccounts(accountsData.accounts);
      setOrders(ordersData.orders);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Laden mislukt.");
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    setQuery("");
  }, [view]);

  const selectedProduct = products.find((item) => item.id === selectedProductId) || null;
  const selectedAccount = accounts.find((item) => item.id === selectedAccountId) || null;
  const selectedOrder = orders.find((item) => item.id === selectedOrderId) || null;

  useEffect(() => {
    if (!selectedProduct) {
      setProductForm({
        name: "",
        description: "",
        sku: "",
        image: "",
        active: true,
        prices: Object.fromEntries(locations.map((location) => [location.id, ""]))
      });
      return;
    }
    setProductForm({
      name: selectedProduct.name,
      description: selectedProduct.description,
      sku: selectedProduct.sku,
      image: selectedProduct.image,
      active: selectedProduct.active,
      prices: Object.fromEntries(
        locations.map((location) => [
          location.id,
          selectedProduct.prices[location.id] != null ? String((selectedProduct.prices[location.id] / 100).toFixed(2)).replace(".", ",") : ""
        ])
      )
    });
  }, [selectedProduct, locations]);

  useEffect(() => {
    if (!selectedAccount) {
      setAccountForm({
        name: "",
        email: "",
        password: "",
        locationId: locations[0]?.id || "",
        company: "",
        vatId: "",
        kvk: "",
        active: true
      });
      return;
    }
    setAccountForm({
      name: selectedAccount.name,
      email: selectedAccount.email,
      password: "",
      locationId: selectedAccount.locationId,
      company: selectedAccount.company || "",
      vatId: selectedAccount.vatId || "",
      kvk: selectedAccount.kvk || "",
      active: selectedAccount.active
    });
  }, [selectedAccount, locations]);

  useEffect(() => {
    if (!selectedOrder) return;
    setOrderStatus(selectedOrder.status);
    setOrderNotes(selectedOrder.adminNotes);
  }, [selectedOrder]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((item) => `${item.name} ${item.sku} ${item.description}`.toLowerCase().includes(q));
  }, [products, query]);

  const filteredAccounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((item) =>
      `${item.name} ${item.email} ${item.locationName} ${item.locationCode}`.toLowerCase().includes(q)
    );
  }, [accounts, query]);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((item) =>
      `${item.orderNumber} ${item.invoiceNumber} ${item.accountName} ${item.locationName}`.toLowerCase().includes(q)
    );
  }, [orders, query]);

  function parsePriceCents(value: string) {
    const normalized = value.trim().replace(/\./g, "").replace(",", ".");
    if (!normalized) return null;
    const number = Number(normalized);
    if (!Number.isFinite(number)) return null;
    return Math.round(number * 100);
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    const prices: Record<string, number> = {};
    for (const [locationId, value] of Object.entries(productForm.prices)) {
      const cents = parsePriceCents(value);
      if (cents != null) prices[locationId] = cents;
    }

    await runSave(async () => {
      if (selectedProduct) {
        const data = await api<{ product: FranchiseShopProduct }>(`/api/admin/franchise-shop/products/${selectedProduct.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: productForm.name,
            description: productForm.description,
            sku: productForm.sku,
            image: productForm.image,
            active: productForm.active,
            prices
          })
        });
        setProducts((current) => current.map((item) => (item.id === data.product.id ? data.product : item)));
      } else {
        const data = await api<{ product: FranchiseShopProduct }>("/api/admin/franchise-shop/products", {
          method: "POST",
          body: JSON.stringify({
            name: productForm.name,
            description: productForm.description,
            sku: productForm.sku,
            image: productForm.image,
            active: productForm.active,
            prices
          })
        });
        setProducts((current) => [...current, data.product]);
        setSelectedProductId(data.product.id);
      }
    });
  }

  async function saveAccount(event: FormEvent) {
    event.preventDefault();
    await runSave(async () => {
      if (selectedAccount) {
        const data = await api<{ account: FranchiseAccount }>(`/api/admin/franchise-shop/accounts/${selectedAccount.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: accountForm.name,
            email: accountForm.email,
            locationId: accountForm.locationId,
            company: accountForm.company,
            vatId: accountForm.vatId,
            kvk: accountForm.kvk,
            active: accountForm.active,
            ...(accountForm.password ? { password: accountForm.password } : {})
          })
        });
        setAccounts((current) => current.map((item) => (item.id === data.account.id ? data.account : item)));
      } else {
        const data = await api<{ account: FranchiseAccount }>("/api/admin/franchise-shop/accounts", {
          method: "POST",
          body: JSON.stringify(accountForm)
        });
        setAccounts((current) => [...current, data.account]);
        setSelectedAccountId(data.account.id);
      }
    });
  }

  async function saveOrder() {
    if (!selectedOrder) return;
    await runSave(async () => {
      const data = await api<{ order: FranchiseShopOrder }>(`/api/admin/franchise-shop/orders/${selectedOrder.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: orderStatus, adminNotes: orderNotes })
      });
      setOrders((current) => current.map((item) => (item.id === data.order.id ? data.order : item)));
    });
  }

  async function downloadInvoice(order: FranchiseShopOrder) {
    try {
      await downloadPdf(`/api/admin/franchise-shop/orders/${order.id}/invoice.pdf`, `factuur-${order.invoiceNumber || order.orderNumber}.pdf`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Factuur downloaden mislukt.");
    }
  }

  async function downloadPackingSlip(order: FranchiseShopOrder) {
    try {
      await downloadPdf(`/api/admin/franchise-shop/orders/${order.id}/packing-slip.pdf`, `pakbon-${order.orderNumber}.pdf`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pakbon downloaden mislukt.");
    }
  }

  return (
    <div>
      {message ? <p className="ta-seo-hint">{message}</p> : null}

      {view === "products" ? (
        <div className="ta-master-detail">
          <div className="ta-list-pane">
            <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek product..." />
            <div className="ta-toolbar">
              <button className="ta-btn ta-btn-primary" type="button" onClick={() => setSelectedProductId(null)}>
                + Product
              </button>
            </div>
            <div className="ta-list-scroll">
              {filteredProducts.map((item) => (
                <AdminListRow
                  key={item.id}
                  title={item.name}
                  meta={`${item.sku || "geen SKU"} · ${Object.keys(item.prices).length} prijzen`}
                  badge={item.active ? "Actief" : "Uit"}
                  thumb={item.image ? mediaAssetUrl(item.image) : undefined}
                  active={item.id === selectedProductId}
                  onClick={() => setSelectedProductId(item.id)}
                />
              ))}
            </div>
          </div>
          <div className="ta-detail-pane">
            <h3 className="ta-section-title">{selectedProduct ? "Product bewerken" : "Nieuw product"}</h3>
            <form onSubmit={(event) => void saveProduct(event)}>
              <div className="ta-grid">
                <MediaField
                  label="Afbeelding"
                  value={productForm.image}
                  placeholder="Kies of upload via media library"
                  onChange={(image) => setProductForm((c) => ({ ...c, image }))}
                />
                <label className="ta-field">
                  <span>Naam</span>
                  <input required value={productForm.name} onChange={(e) => setProductForm((c) => ({ ...c, name: e.target.value }))} />
                </label>
                <label className="ta-field">
                  <span>SKU</span>
                  <input value={productForm.sku} onChange={(e) => setProductForm((c) => ({ ...c, sku: e.target.value }))} />
                </label>
                <label className="ta-field ta-grid-wide">
                  <span>Omschrijving</span>
                  <input value={productForm.description} onChange={(e) => setProductForm((c) => ({ ...c, description: e.target.value }))} />
                </label>
              </div>
              <label className="ta-toggle">
                <input type="checkbox" checked={productForm.active} onChange={(e) => setProductForm((c) => ({ ...c, active: e.target.checked }))} />
                <span>Actief in franchise shop</span>
              </label>
              <h4 className="ta-section-title" style={{ marginTop: 18 }}>
                Prijzen per franchise
              </h4>
              <p className="ta-seo-hint">Laat leeg om het product voor die vestiging niet aan te bieden.</p>
              <div className="ta-grid">
                {locations.map((location) => (
                  <label className="ta-field" key={location.id}>
                    <span>
                      {location.code} {location.name}
                    </span>
                    <input
                      inputMode="decimal"
                      placeholder="0,00"
                      value={productForm.prices[location.id] || ""}
                      onChange={(e) =>
                        setProductForm((c) => ({
                          ...c,
                          prices: { ...c.prices, [location.id]: e.target.value }
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="ta-form-save">
                <button className="ta-btn ta-btn-primary" type="submit">
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {view === "accounts" ? (
        <div className="ta-master-detail">
          <div className="ta-list-pane">
            <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek account..." />
            <div className="ta-toolbar">
              <button className="ta-btn ta-btn-primary" type="button" onClick={() => setSelectedAccountId(null)}>
                + Account
              </button>
            </div>
            <div className="ta-list-scroll">
              {filteredAccounts.map((item) => (
                <AdminListRow
                  key={item.id}
                  title={item.name}
                  meta={`${item.email} · ${item.locationCode} ${item.locationName}${item.company ? ` · ${item.company}` : ""}`}
                  badge={item.active ? "Actief" : "Uit"}
                  active={item.id === selectedAccountId}
                  onClick={() => setSelectedAccountId(item.id)}
                />
              ))}
            </div>
          </div>
          <div className="ta-detail-pane">
            <h3 className="ta-section-title">{selectedAccount ? "Account bewerken" : "Nieuw franchise account"}</h3>
            <form onSubmit={(event) => void saveAccount(event)}>
              <div className="ta-grid">
                <label className="ta-field">
                  <span>Naam</span>
                  <input required value={accountForm.name} onChange={(e) => setAccountForm((c) => ({ ...c, name: e.target.value }))} />
                </label>
                <label className="ta-field">
                  <span>E-mail</span>
                  <input required type="email" value={accountForm.email} onChange={(e) => setAccountForm((c) => ({ ...c, email: e.target.value }))} />
                </label>
                <label className="ta-field">
                  <span>{selectedAccount ? "Nieuw wachtwoord (optioneel)" : "Wachtwoord"}</span>
                  <input
                    type="password"
                    required={!selectedAccount}
                    minLength={8}
                    value={accountForm.password}
                    onChange={(e) => setAccountForm((c) => ({ ...c, password: e.target.value }))}
                  />
                </label>
                <label className="ta-field">
                  <span>Vestiging / franchise</span>
                  <select value={accountForm.locationId} onChange={(e) => setAccountForm((c) => ({ ...c, locationId: e.target.value }))}>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.code} {location.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ta-field">
                  <span>Bedrijfsnaam</span>
                  <input
                    value={accountForm.company}
                    onChange={(e) => setAccountForm((c) => ({ ...c, company: e.target.value }))}
                    placeholder="Optioneel / voor facturen"
                  />
                </label>
                <label className="ta-field">
                  <span>BTW-id</span>
                  <input
                    value={accountForm.vatId}
                    onChange={(e) => setAccountForm((c) => ({ ...c, vatId: e.target.value.toUpperCase() }))}
                    placeholder="NL000000000B01"
                  />
                </label>
                <label className="ta-field">
                  <span>KvK-nummer</span>
                  <input
                    value={accountForm.kvk}
                    onChange={(e) => setAccountForm((c) => ({ ...c, kvk: e.target.value }))}
                    placeholder="12345678"
                  />
                </label>
              </div>
              <label className="ta-toggle">
                <input type="checkbox" checked={accountForm.active} onChange={(e) => setAccountForm((c) => ({ ...c, active: e.target.checked }))} />
                <span>Account actief</span>
              </label>
              <div className="ta-form-save">
                <button className="ta-btn ta-btn-primary" type="submit">
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {view === "orders" ? (
        <div className="ta-master-detail">
          <div className="ta-list-pane">
            <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek order of factuur..." />
            <div className="ta-list-scroll">
              {filteredOrders.map((item) => (
                <AdminListRow
                  key={item.id}
                  title={item.orderNumber}
                  meta={`${item.locationCode} ${item.locationName} · ${formatEuro(item.subtotalCents)}`}
                  badge={STATUS_LABELS[item.status]}
                  active={item.id === selectedOrderId}
                  onClick={() => setSelectedOrderId(item.id)}
                />
              ))}
            </div>
          </div>
          {selectedOrder ? (
            <div className="ta-detail-pane">
              <div className="ta-toolbar ta-toolbar-spread">
                <h3 className="ta-section-title">{selectedOrder.orderNumber}</h3>
                <div className="ta-toolbar">
                  <button className="ta-btn ta-btn-ghost" type="button" onClick={() => void downloadInvoice(selectedOrder)}>
                    <IconPdf width={16} height={16} />
                    Factuur PDF
                  </button>
                  <button className="ta-btn ta-btn-ghost" type="button" onClick={() => void downloadPackingSlip(selectedOrder)}>
                    <IconPdf width={16} height={16} />
                    Pakbon PDF
                  </button>
                </div>
              </div>
              <div className="ta-grid">
                <label className="ta-field">
                  <span>Factuurnummer</span>
                  <input readOnly value={selectedOrder.invoiceNumber || "—"} />
                </label>
                <label className="ta-field">
                  <span>Franchise</span>
                  <input readOnly value={`${selectedOrder.locationCode} ${selectedOrder.locationName}`} />
                </label>
                <label className="ta-field">
                  <span>Contact</span>
                  <input readOnly value={`${selectedOrder.accountName} · ${selectedOrder.accountEmail}`} />
                </label>
                <label className="ta-field">
                  <span>Bedrijf</span>
                  <input readOnly value={selectedOrder.accountCompany || "—"} />
                </label>
                <label className="ta-field">
                  <span>BTW / KvK</span>
                  <input
                    readOnly
                    value={[selectedOrder.accountVatId || null, selectedOrder.accountKvk ? `KvK ${selectedOrder.accountKvk}` : null]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  />
                </label>
                <label className="ta-field">
                  <span>Status</span>
                  <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value as FranchiseShopOrderStatus)}>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ta-field ta-grid-wide">
                  <span>Admin notities</span>
                  <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} rows={3} />
                </label>
              </div>
              <div className="ta-link-table" style={{ marginTop: 12 }}>
                {selectedOrder.items.map((item) => (
                  <div className="ta-link-row" key={item.id}>
                    <strong>{item.productName}</strong>
                    <span>
                      {item.quantity} × {formatEuro(item.unitPriceCents)} = {formatEuro(item.lineTotalCents)}
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ fontWeight: 800, marginTop: 12 }}>Totaal: {formatEuro(selectedOrder.subtotalCents)}</p>
              <div className="ta-form-save">
                <button className="ta-btn ta-btn-primary" type="button" onClick={() => void saveOrder()}>
                  Status opslaan
                </button>
              </div>
            </div>
          ) : (
            <div className="ta-detail-pane ta-empty">Selecteer een bestelling.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
