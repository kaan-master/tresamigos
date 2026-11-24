import { FormEvent, useEffect, useMemo, useState } from "react";
import { OrderProcessFlow } from "./OrderProcessFlow";
import {
  FRANCHISE_SHOP_ORDER_CHANNELS,
  FRANCHISE_SHOP_ORDER_CHANNEL_LABELS,
  FRANCHISE_SHOP_ORDER_STATUSES,
  FRANCHISE_SHOP_ORDER_STATUS_COLORS,
  FRANCHISE_SHOP_ORDER_STATUS_LABELS,
  type FranchiseAccount,
  type FranchiseShopOrder,
  type FranchiseShopOrderAction,
  type FranchiseShopOrderChannel,
  type FranchiseShopOrderStatus,
  type FranchiseShopProduct,
  type SiteContent
} from "@tresamigos/types";
import { api, downloadPdf } from "../lib/api";
import { mediaAssetUrl } from "../lib/media";
import { useAdminFeedback } from "../context/AdminFeedbackContext";
import { AdminListRow, AdminSearchBar } from "./AdminListUi";
import { IconPdf } from "./AdminIcons";
import { MediaField } from "./MediaPickerModal";
import { StatusChip, StatusCombo } from "./StatusCombo";
import { FranchiseOrderWorkflow } from "./FranchiseOrderWorkflow";

export type FranchiseShopView = "products" | "accounts" | "orders";

interface Props {
  content: SiteContent;
  /** Controlled view when embedded in Franchise Entra hub */
  view: FranchiseShopView;
}

const STATUS_OPTIONS = FRANCHISE_SHOP_ORDER_STATUSES.map((status) => ({
  value: status,
  label: FRANCHISE_SHOP_ORDER_STATUS_LABELS[status],
  color: FRANCHISE_SHOP_ORDER_STATUS_COLORS[status]
}));

function formatEuro(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function parseEuroToCents(value: string): number | undefined {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) return undefined;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return undefined;
  return Math.round(amount * 100);
}

function centsToEuroInput(cents: number | undefined) {
  if (cents == null || !Number.isFinite(cents)) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

type RegisterLine = { productId: string; quantity: string; priceEuro: string };

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
    allowInvoicePayment: true,
    active: true
  });
  const [orderStatus, setOrderStatus] = useState<FranchiseShopOrderStatus>("in_afwachting");
  const [orderNotes, setOrderNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [showProcess, setShowProcess] = useState(false);
  const [processHighlight, setProcessHighlight] = useState<FranchiseShopOrderStatus | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showManualStatus, setShowManualStatus] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    accountId: "",
    locationId: content.locations[0]?.id || "",
    contactName: "",
    contactPhone: "",
    channel: "whatsapp" as FranchiseShopOrderChannel,
    notes: "",
    incomplete: false,
    missingData: "",
    items: [] as RegisterLine[]
  });

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
    setStatusFilter("");
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
        allowInvoicePayment: true,
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
      allowInvoicePayment: selectedAccount.allowInvoicePayment !== false,
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
    return orders.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (!q) return true;
      return `${item.orderNumber} ${item.invoiceNumber} ${item.accountName} ${item.locationName}`.toLowerCase().includes(q);
    });
  }, [orders, query, statusFilter]);

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
            allowInvoicePayment: accountForm.allowInvoicePayment,
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

  async function saveOrderStatus(next: FranchiseShopOrderStatus) {
    if (!selectedOrder || savingStatus || selectedOrder.status === next) return;
    setOrderStatus(next);
    setSavingStatus(true);
    try {
      await runSave(
        async () => {
          const data = await api<{ order: FranchiseShopOrder }>(`/api/admin/franchise-shop/orders/${selectedOrder.id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: next, adminNotes: orderNotes })
          });
          setOrders((current) => current.map((item) => (item.id === data.order.id ? data.order : item)));
        },
        { successMessage: `Status: ${FRANCHISE_SHOP_ORDER_STATUS_LABELS[next]}.` }
      );
    } catch {
      setOrderStatus(selectedOrder.status);
    } finally {
      setSavingStatus(false);
    }
  }

  async function saveOrder() {
    if (!selectedOrder) return;
    await runSave(async () => {
      const data = await api<{ order: FranchiseShopOrder }>(`/api/admin/franchise-shop/orders/${selectedOrder.id}`, {
        method: "PATCH",
        body: JSON.stringify({ adminNotes: orderNotes })
      });
      setOrders((current) => current.map((item) => (item.id === data.order.id ? data.order : item)));
    });
  }

  async function saveOrderItems(items: Array<{ productId: string; quantity: number }>) {
    if (!selectedOrder) return;
    await runSave(async () => {
      const data = await api<{ order: FranchiseShopOrder }>(`/api/admin/franchise-shop/orders/${selectedOrder.id}`, {
        method: "PATCH",
        body: JSON.stringify({ items })
      });
      setOrders((current) => current.map((item) => (item.id === data.order.id ? data.order : item)));
    });
  }

  async function applyOrderAction(input: {
    action: FranchiseShopOrderAction;
    note?: string;
    toStatus?: FranchiseShopOrderStatus;
    deviationKind?: string;
  }) {
    if (!selectedOrder || savingStatus) return;
    setSavingStatus(true);
    try {
      await runSave(
        async () => {
          const data = await api<{ order: FranchiseShopOrder; message?: string }>(
            `/api/admin/franchise-shop/orders/${selectedOrder.id}/actions`,
            { method: "POST", body: JSON.stringify(input) }
          );
          setOrders((current) => current.map((item) => (item.id === data.order.id ? data.order : item)));
          setOrderStatus(data.order.status);
        },
        { successMessage: "Stap gezet." }
      );
    } finally {
      setSavingStatus(false);
    }
  }

  function registerLocationId() {
    const account = accounts.find((item) => item.id === registerForm.accountId);
    return account?.locationId || registerForm.locationId;
  }

  function catalogPriceEuro(productId: string, locationId: string) {
    const product = products.find((item) => item.id === productId);
    const cents = product?.prices?.[locationId];
    return centsToEuroInput(cents);
  }

  function setRegisterLine(index: number, patch: Partial<RegisterLine>) {
    setRegisterForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, ...patch };
        if (patch.productId != null && !patch.priceEuro) {
          const suggested = catalogPriceEuro(patch.productId, registerLocationId());
          if (suggested) next.priceEuro = suggested;
        }
        return next;
      })
    }));
  }

  async function registerOrder() {
    const locationId = registerLocationId();
    if (!registerForm.accountId && !locationId) {
      setMessage("Kies een vestiging of een franchise-account.");
      return;
    }
    if (
      registerForm.channel === "whatsapp" &&
      !registerForm.accountId &&
      registerForm.contactPhone.replace(/\D/g, "").length < 8
    ) {
      setMessage("Vul een WhatsApp-nummer in (of kies een account).");
      return;
    }
    const items = registerForm.items
      .filter((item) => item.productId && Number(item.quantity) > 0)
      .map((item) => {
        const unitPriceCents = parseEuroToCents(item.priceEuro);
        return {
          productId: item.productId,
          quantity: Number(item.quantity),
          ...(unitPriceCents != null ? { unitPriceCents } : {})
        };
      });
    await runSave(
      async () => {
        const data = await api<{ order: FranchiseShopOrder; message?: string }>("/api/admin/franchise-shop/orders", {
          method: "POST",
          body: JSON.stringify({
            accountId: registerForm.accountId || undefined,
            locationId: registerForm.accountId ? undefined : locationId,
            contactName: registerForm.contactName || undefined,
            contactPhone: registerForm.contactPhone || undefined,
            channel: registerForm.channel,
            notes: registerForm.notes,
            incomplete: registerForm.incomplete,
            missingData: registerForm.missingData,
            items
          })
        });
        setOrders((current) => [data.order, ...current]);
        setSelectedOrderId(data.order.id);
        setShowRegister(false);
        setShowProcess(false);
        setRegisterForm({
          accountId: "",
          locationId: locations[0]?.id || "",
          contactName: "",
          contactPhone: "",
          channel: "whatsapp",
          notes: "",
          incomplete: false,
          missingData: "",
          items: []
        });
      },
      { successMessage: "Bestelling geregistreerd." }
    );
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
                  meta={`${item.email} · ${item.locationCode} ${item.locationName}${item.company ? ` · ${item.company}` : ""} · ${item.allowInvoicePayment !== false ? "factuur+iDEAL" : "alleen iDEAL"}`}
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
                <input
                  type="checkbox"
                  checked={accountForm.allowInvoicePayment}
                  onChange={(e) => setAccountForm((c) => ({ ...c, allowInvoicePayment: e.target.checked }))}
                />
                <span>Mag op factuur betalen (uit = alleen iDEAL)</span>
              </label>
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
            <StatusCombo
              compact
              value={statusFilter}
              emptyLabel="Alle statussen"
              options={STATUS_OPTIONS}
              onChange={setStatusFilter}
            />
            <div className="ta-toolbar">
              <button
                className="ta-btn ta-btn-primary"
                type="button"
                onClick={() => {
                  setShowRegister(true);
                  setShowProcess(false);
                  setSelectedOrderId(null);
                }}
              >
                + Bestelling registreren
              </button>
            </div>
            <div className="ta-list-scroll">
              {filteredOrders.map((item) => (
                <AdminListRow
                  key={item.id}
                  title={item.orderNumber}
                  meta={`${FRANCHISE_SHOP_ORDER_CHANNEL_LABELS[item.channel] || "Portaal"} · ${item.locationCode} ${item.locationName} · ${formatEuro(item.subtotalCents)}`}
                  badgeNode={
                    <StatusChip
                      status={item.status}
                      label={FRANCHISE_SHOP_ORDER_STATUS_LABELS[item.status] || item.status}
                      color={FRANCHISE_SHOP_ORDER_STATUS_COLORS[item.status] || "#8a8886"}
                    />
                  }
                  active={item.id === selectedOrderId && !showProcess && !showRegister}
                  onClick={() => {
                    setSelectedOrderId(item.id);
                    setShowProcess(false);
                    setShowRegister(false);
                  }}
                />
              ))}
            </div>
          </div>
          {showRegister ? (
            <div className="ta-detail-pane">
              <div className="ta-toolbar ta-toolbar-spread">
                <h3 className="ta-section-title">Bestelling registreren</h3>
                <button className="ta-btn ta-btn-ghost" type="button" onClick={() => setShowRegister(false)}>
                  Annuleren
                </button>
              </div>
              <p className="ta-seo-hint">
                Voor WhatsApp/e-mail: account is optioneel. Bij WhatsApp vul je een nummer in. Vul per regel een prijs in euro
                in als er nog geen catalogusprijs is.
              </p>
              <div className="ta-grid">
                <label className="ta-field">
                  <span>Kanaal</span>
                  <select
                    value={registerForm.channel}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, channel: event.target.value as FranchiseShopOrderChannel }))
                    }
                  >
                    {FRANCHISE_SHOP_ORDER_CHANNELS.filter((channel) => channel !== "portaal").map((channel) => (
                      <option key={channel} value={channel}>
                        {FRANCHISE_SHOP_ORDER_CHANNEL_LABELS[channel]}
                      </option>
                    ))}
                    <option value="portaal">Portaal (handmatig)</option>
                  </select>
                </label>
                <label className="ta-field">
                  <span>Franchise-account (optioneel)</span>
                  <select
                    value={registerForm.accountId}
                    onChange={(event) => {
                      const accountId = event.target.value;
                      const account = accounts.find((item) => item.id === accountId);
                      setRegisterForm((current) => ({
                        ...current,
                        accountId,
                        locationId: account?.locationId || current.locationId,
                        contactName: current.contactName || account?.name || "",
                        contactPhone: current.contactPhone
                      }));
                    }}
                  >
                    <option value="">Geen account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.locationCode} {account.name} · {account.email}
                      </option>
                    ))}
                  </select>
                </label>
                {!registerForm.accountId ? (
                  <label className="ta-field">
                    <span>Vestiging</span>
                    <select
                      value={registerForm.locationId}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, locationId: event.target.value }))}
                    >
                      <option value="">Kies vestiging</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.code} {location.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="ta-field">
                  <span>Naam / contact</span>
                  <input
                    value={registerForm.contactName}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, contactName: event.target.value }))}
                    placeholder="Optioneel"
                  />
                </label>
                <label className="ta-field">
                  <span>
                    {registerForm.channel === "whatsapp" ? "WhatsApp-nummer" : "Telefoon"}
                    {registerForm.channel === "whatsapp" && !registerForm.accountId ? " *" : ""}
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={registerForm.contactPhone}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, contactPhone: event.target.value }))}
                    placeholder="06 12345678"
                    required={registerForm.channel === "whatsapp" && !registerForm.accountId}
                  />
                </label>
                <label className="ta-field ta-grid-wide">
                  <span>Opmerking van de vestiging</span>
                  <textarea
                    value={registerForm.notes}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, notes: event.target.value }))}
                    rows={2}
                  />
                </label>
                <label className="ta-toggle ta-grid-wide">
                  <input
                    type="checkbox"
                    checked={registerForm.incomplete}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, incomplete: event.target.checked }))}
                  />
                  <span>Registratie onvolledig — ontbrekende gegevens opvragen</span>
                </label>
                {registerForm.incomplete ? (
                  <label className="ta-field ta-grid-wide">
                    <span>Wat ontbreekt er?</span>
                    <textarea
                      value={registerForm.missingData}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, missingData: event.target.value }))}
                      rows={2}
                    />
                  </label>
                ) : null}
              </div>
              <div className="ta-link-table fs-register-lines" style={{ marginTop: 12 }}>
                <div className="ta-link-row fs-register-head" aria-hidden="true">
                  <span>Product</span>
                  <span>Aantal</span>
                  <span>Prijs (€)</span>
                  <span />
                </div>
                {registerForm.items.map((line, index) => (
                  <div className="ta-link-row" key={`${line.productId}-${index}`}>
                    <select value={line.productId} onChange={(event) => setRegisterLine(index, { productId: event.target.value })}>
                      <option value="">Product</option>
                      {products.filter((product) => product.active).map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      aria-label="Aantal"
                      value={line.quantity}
                      onChange={(event) => setRegisterLine(index, { quantity: event.target.value })}
                    />
                    <label className="fs-euro-field">
                      <span aria-hidden="true">€</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        aria-label="Prijs in euro"
                        value={line.priceEuro}
                        onChange={(event) => setRegisterLine(index, { priceEuro: event.target.value })}
                      />
                    </label>
                    <button
                      className="ta-btn ta-btn-ghost"
                      type="button"
                      onClick={() =>
                        setRegisterForm((current) => ({
                          ...current,
                          items: current.items.filter((_, itemIndex) => itemIndex !== index)
                        }))
                      }
                    >
                      Weg
                    </button>
                  </div>
                ))}
              </div>
              <div className="ta-toolbar" style={{ marginTop: 8 }}>
                <button
                  className="ta-btn"
                  type="button"
                  onClick={() => {
                    const productId = products.find((product) => product.active)?.id || "";
                    setRegisterForm((current) => ({
                      ...current,
                      items: [
                        ...current.items,
                        {
                          productId,
                          quantity: "1",
                          priceEuro: catalogPriceEuro(productId, registerLocationId())
                        }
                      ]
                    }));
                  }}
                >
                  + Product
                </button>
              </div>
              <div className="ta-form-save">
                <button className="ta-btn ta-btn-primary" type="button" onClick={() => void registerOrder()}>
                  Registreren
                </button>
              </div>
            </div>
          ) : showProcess || !selectedOrder ? (
            <div className="ta-detail-pane order-flow-pane">
              <div className="ta-toolbar ta-toolbar-spread">
                <h3 className="ta-section-title">Werkwijze bestellingen</h3>
                {selectedOrder ? (
                  <button className="ta-btn ta-btn-ghost" type="button" onClick={() => setShowProcess(false)}>
                    Terug naar bestelling
                  </button>
                ) : null}
              </div>
              <p className="ta-seo-hint">Van binnenkomst tot ontvangst op de vestiging. Nieuwe stappen zet je op de bestelling zelf.</p>
              <OrderProcessFlow highlightStatus={processHighlight || selectedOrder?.status || null} />
            </div>
          ) : selectedOrder ? (
            <div className="ta-detail-pane">
              <div className="ta-toolbar ta-toolbar-spread">
                <h3 className="ta-section-title">{selectedOrder.orderNumber}</h3>
                <div className="ta-toolbar">
                  <button
                    className="ta-btn ta-btn-ghost order-workflow-help-btn"
                    type="button"
                    title="Werkwijze"
                    aria-label="Werkwijze bekijken"
                    onClick={() => {
                      setProcessHighlight(selectedOrder.status);
                      setShowProcess(true);
                    }}
                  >
                    ?
                  </button>
                  <button
                    className="ta-btn ta-btn-ghost"
                    type="button"
                    disabled={!selectedOrder.documentsReady && selectedOrder.paymentMethod === "ideal"}
                    onClick={() => void downloadInvoice(selectedOrder)}
                  >
                    <IconPdf width={16} height={16} />
                    Factuur PDF
                  </button>
                  <button
                    className="ta-btn ta-btn-ghost"
                    type="button"
                    disabled={!selectedOrder.documentsReady && selectedOrder.paymentMethod === "ideal"}
                    onClick={() => void downloadPackingSlip(selectedOrder)}
                  >
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
                  <span>Betaling</span>
                  <input
                    readOnly
                    value={`${selectedOrder.paymentMethod === "ideal" ? "iDEAL" : "Factuur"} · ${selectedOrder.paymentStatus}${selectedOrder.paidAt ? ` · ${new Date(selectedOrder.paidAt).toLocaleString("nl-NL")}` : ""}`}
                  />
                </label>
                <label className="ta-field">
                  <span>Franchise</span>
                  <input readOnly value={`${selectedOrder.locationCode} ${selectedOrder.locationName}`} />
                </label>
                <label className="ta-field">
                  <span>Contact</span>
                  <input
                    readOnly
                    value={[
                      selectedOrder.accountName,
                      selectedOrder.accountEmail || null,
                      selectedOrder.contactPhone || null
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
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
                <label className="ta-field ta-grid-wide">
                  <span>Admin notities</span>
                  <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} rows={3} />
                </label>
              </div>
              <FranchiseOrderWorkflow
                order={selectedOrder}
                busy={savingStatus}
                onAction={(input) => void applyOrderAction(input)}
                onOpenHelp={(status) => {
                  setProcessHighlight(status || selectedOrder.status);
                  setShowProcess(true);
                }}
              />
              <button className="ta-btn ta-btn-ghost" type="button" onClick={() => setShowManualStatus((value) => !value)}>
                {showManualStatus ? "Handmatige status verbergen" : "Status handmatig zetten"}
              </button>
              {showManualStatus ? (
                <label className="ta-field">
                  <span>Handmatige status</span>
                  <StatusCombo
                    value={orderStatus}
                    disabled={savingStatus}
                    options={STATUS_OPTIONS}
                    onChange={(next) => {
                      if (next) void saveOrderStatus(next as FranchiseShopOrderStatus);
                    }}
                  />
                </label>
              ) : null}
              <div className="ta-link-table" style={{ marginTop: 12 }}>
                {selectedOrder.items.map((item) => (
                  <div className="ta-link-row" key={item.id}>
                    <strong>{item.productName}</strong>
                    <span>
                      {item.quantity} × {formatEuro(item.unitPriceCents)} = {formatEuro(item.lineTotalCents)}
                    </span>
                    {selectedOrder.status === "registratie_onvolledig" ? (
                      <button
                        className="ta-btn ta-btn-ghost"
                        type="button"
                        onClick={() =>
                          void saveOrderItems(selectedOrder.items.filter((line) => line.id !== item.id).map((line) => ({
                            productId: line.productId,
                            quantity: line.quantity
                          })))
                        }
                      >
                        Weg
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              {selectedOrder.status === "registratie_onvolledig" ? (
                <div className="ta-toolbar" style={{ marginTop: 8 }}>
                  <select
                    value=""
                    onChange={(event) => {
                      const productId = event.target.value;
                      if (!productId) return;
                      const existing = selectedOrder.items.find((item) => item.productId === productId);
                      void saveOrderItems([
                        ...selectedOrder.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
                        { productId, quantity: existing ? existing.quantity + 1 : 1 }
                      ].reduce<Array<{ productId: string; quantity: number }>>((lines, line) => {
                        const found = lines.find((item) => item.productId === line.productId);
                        if (found) found.quantity = line.quantity;
                        else lines.push(line);
                        return lines;
                      }, []));
                    }}
                  >
                    <option value="">+ Product toevoegen</option>
                    {products.filter((product) => product.active).map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <p style={{ fontWeight: 800, marginTop: 12 }}>Totaal: {formatEuro(selectedOrder.subtotalCents)}</p>
              <div className="ta-form-save">
                <button className="ta-btn ta-btn-primary" type="button" onClick={() => void saveOrder()}>
                  Notities opslaan
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
