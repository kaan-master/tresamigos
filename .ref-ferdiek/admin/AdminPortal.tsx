import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiBarChart2, FiBox, FiChevronDown, FiChevronRight, FiDownload, FiExternalLink, FiFileText, FiGlobe, FiImage, FiLayers, FiLogOut, FiMail, FiSave, FiSearch, FiSettings, FiTruck, FiUpload, FiUsers } from 'react-icons/fi'
import ProductCatalogManager from '../ProductCatalogManager'
import logo from '../assets/logo.png'
import { AdminIntegrationsScreen, AdminProductSeoScreen, AdminSeoOverviewScreen, AdminSitePageSeoScreen } from './AdminSeoPages'
import AdminAnalytics, { BarChart, DonutChart } from './AdminAnalytics'
import AdminNewsletter from './AdminNewsletter'
import AdminMediaLibrary from './AdminMediaLibrary'
import { AdminMailTemplatesScreen } from './AdminMailTemplates'
import AdminMobileAppShell from './AdminMobileAppShell'
import {
  dismissOrderIds,
  getNewTodayIncomingOrders,
  readDismissedOrderIdsForToday,
} from './adminOrderNotifications'
import { useAdminDisplayPreferences, useAdminMobileViewport } from './useAdminDisplayPreferences'
import {
  type ApiAdminActiveCart,
  apiAdminAnalytics,
  type ApiAdminAnalytics as ApiAdminAnalyticsPayload,
  apiAdminCustomerActivity,
  apiAdminOrders,
  type ApiAdminCustomerActivity,
  type ApiAdminPageVisit,
  apiAdminProducts,
  apiAdminSettings,
  apiAdminUsers,
  apiCreateEmployee,
  apiDashboard,
  apiDownloadAdminInvoicePdf,
  type ApiInvoiceStatus,
  apiUploadInvoiceLogo,
  apiUpdateAdminSettings,
  apiUpdateOrder,
  apiUpdateShipment,
  resolveApiAssetUrl,
  type ApiAdminOrder,
  type ApiAdminUser,
  type ApiBusinessSettings,
  type ApiUserRole,
} from '../api'
import { fallbackProducts, formatPrice, getDefaultVariant, normalizeProduct, type Product } from '../catalog'

type SessionUser = {
  id?: string
  name: string
  email: string
  role?: ApiUserRole
  token?: string
}

type AdminPortalProps = {
  user: SessionUser | null
  onLogout: () => void
  overlayMode?: boolean
  onCloseOverlay?: () => void
}

type DashboardStats = {
  users: number
  orders: number
  paidOrders: number
  products: number
  activeCarts: number
}

type EmployeeFormState = {
  name: string
  email: string
  password: string
  phone: string
}

type OrderDraft = {
  status: ApiAdminOrder['status']
  paymentStatus: ApiAdminOrder['paymentStatus']
  invoiceStatus: ApiInvoiceStatus
  trackingCode: string
  notes: string
}

type AdminCustomer = ApiAdminUser & {
  orders: ApiAdminOrder[]
  orderCount: number
  totalSpentCents: number
  latestOrderAt?: string
}

type LocalStoredOrder = {
  id: string
  createdAt: string
  customerName: string
  email: string
  bank: string
  total: number
  status: string
  items: Array<{
    slug: string
    variantId?: string
    variantName?: string
    name: string
    quantity: number
    price: number
  }>
}

type SettingsFormState = {
  companyName: string
  legalName: string
  vatNumber: string
  chamberOfCommerceNumber: string
  supportEmail: string
  supportPhone: string
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
  invoiceLogoUrl: string
  iban: string
  bic: string
  invoiceVatRateBasisPoints: string
  invoiceDueDays: string
  invoiceFootnote: string
  termsText: string
  idealEnabled: boolean
  creditCardEnabled: boolean
  applePayEnabled: boolean
  bancontactEnabled: boolean
  invoicePaymentEnabled: boolean
}

const paymentMethodOptions: Array<{
  name: keyof Pick<
    SettingsFormState,
    'idealEnabled' | 'creditCardEnabled' | 'applePayEnabled' | 'bancontactEnabled' | 'invoicePaymentEnabled'
  >
  title: string
  description: string
}> = [
  {
    name: 'idealEnabled',
    title: 'iDEAL',
    description: 'Toon iDEAL als standaard betaalmethode in de checkout.',
  },
  {
    name: 'creditCardEnabled',
    title: 'Creditcard',
    description: 'Activeer creditcardbetalingen voor klanten die direct willen afrekenen.',
  },
  {
    name: 'applePayEnabled',
    title: 'Apple Pay',
    description: 'Laat mobiele klanten snel afrekenen via Apple Pay.',
  },
  {
    name: 'bancontactEnabled',
    title: 'Bancontact',
    description: 'Maak Bancontact zichtbaar voor Belgische klanten in checkout.',
  },
  {
    name: 'invoicePaymentEnabled',
    title: 'Betalen op factuur',
    description: 'Sta toe dat zakelijke klanten op factuur bestellen.',
  },
]

const emptySettings: SettingsFormState = {
  companyName: '',
  legalName: '',
  vatNumber: '',
  chamberOfCommerceNumber: '',
  supportEmail: '',
  supportPhone: '',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  country: 'Nederland',
  invoiceLogoUrl: '',
  iban: '',
  bic: '',
  invoiceVatRateBasisPoints: '21',
  invoiceDueDays: '14',
  invoiceFootnote: '',
  termsText: '',
  idealEnabled: true,
  creditCardEnabled: true,
  applePayEnabled: true,
  bancontactEnabled: true,
  invoicePaymentEnabled: false,
}

const initialEmployeeForm: EmployeeFormState = {
  name: '',
  email: '',
  password: '',
  phone: '',
}

const orderStatusOptions: ApiAdminOrder['status'][] = [
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]

const paymentStatusOptions: ApiAdminOrder['paymentStatus'][] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED']
const invoiceStatusOptions: ApiInvoiceStatus[] = ['ISSUED', 'PAID', 'VOID']

function isAdmin(user: SessionUser | null) {
  return user?.role === 'OWNER' || user?.role === 'EMPLOYEE'
}

function formatOrderStatusLabel(status: ApiAdminOrder['status']) {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'Wacht op betaling'
    case 'PAID':
      return 'Betaald'
    case 'PROCESSING':
      return 'In verwerking'
    case 'SHIPPED':
      return 'Verzonden'
    case 'DELIVERED':
      return 'Afgeleverd'
    case 'CANCELLED':
      return 'Geannuleerd'
    default:
      return status
  }
}

function formatPaymentStatusLabel(status: ApiAdminOrder['paymentStatus']) {
  switch (status) {
    case 'PENDING':
      return 'In afwachting'
    case 'PAID':
      return 'Betaald'
    case 'FAILED':
      return 'Mislukt'
    case 'REFUNDED':
      return 'Terugbetaald'
    default:
      return status
  }
}

function formatShipmentCarrierLabel(carrier?: ApiAdminOrder['shipment'] extends infer T
  ? T extends { carrier?: infer Carrier | null }
    ? Carrier | null
    : never
  : never) {
  switch (carrier) {
    case 'POSTNL':
      return 'PostNL'
    case 'DHL':
      return 'DHL'
    case 'DPD':
      return 'DPD'
    case 'OTHER':
      return 'Andere vervoerder'
    default:
      return 'Nog niet ingesteld'
  }
}

function formatInvoiceStatusLabel(status?: ApiInvoiceStatus | null) {
  switch (status) {
    case 'ISSUED':
      return 'Uitgegeven'
    case 'PAID':
      return 'Betaald'
    case 'VOID':
      return 'Vervallen'
    default:
      return 'Niet aangemaakt'
  }
}

function getGeneratedTrackingUrl(trackingCode: string) {
  const trimmed = trackingCode.trim()
  if (!trimmed) {
    return ''
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://jouw.postnl.nl/track-and-trace/${trimmed}`
}

function formatDurationLabel(durationSeconds: number) {
  if (durationSeconds < 60) {
    return `${durationSeconds}s`
  }

  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60
  return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds}s`
}

type AdminDashboardRangePreset = 'today' | '7d' | '30d' | 'thisMonth' | 'lastMonth'

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getDashboardRangePreset(preset: AdminDashboardRangePreset) {
  const today = new Date()
  const from = new Date(today)
  const to = new Date(today)

  if (preset === '7d') {
    from.setDate(today.getDate() - 6)
  }

  if (preset === '30d') {
    from.setDate(today.getDate() - 29)
  }

  if (preset === 'thisMonth') {
    from.setDate(1)
  }

  if (preset === 'lastMonth') {
    from.setMonth(today.getMonth() - 1, 1)
    to.setDate(0)
  }

  return { from: toDateInput(from), to: toDateInput(to) }
}

function formatAdminStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING_PAYMENT: 'Wacht op betaling',
    PAID: 'Betaald',
    PROCESSING: 'Verwerking',
    SHIPPED: 'Verzonden',
    DELIVERED: 'Geleverd',
    CANCELLED: 'Geannuleerd',
    PENDING: 'Open',
    FAILED: 'Mislukt',
    REFUNDED: 'Terugbetaald',
  }

  return labels[status] ?? status
}

function toSettingsForm(settings?: ApiBusinessSettings | null): SettingsFormState {
  return {
    companyName: settings?.companyName ?? '',
    legalName: settings?.legalName ?? '',
    vatNumber: settings?.vatNumber ?? '',
    chamberOfCommerceNumber: settings?.chamberOfCommerceNumber ?? '',
    supportEmail: settings?.supportEmail ?? '',
    supportPhone: settings?.supportPhone ?? '',
    street: settings?.street ?? '',
    houseNumber: settings?.houseNumber ?? '',
    postalCode: settings?.postalCode ?? '',
    city: settings?.city ?? '',
    country: settings?.country ?? 'Nederland',
    invoiceLogoUrl: settings?.invoiceLogoUrl ?? '',
    iban: settings?.iban ?? '',
    bic: settings?.bic ?? '',
    invoiceVatRateBasisPoints: String((settings?.invoiceVatRateBasisPoints ?? 2100) / 100),
    invoiceDueDays: String(settings?.invoiceDueDays ?? 14),
    invoiceFootnote: settings?.invoiceFootnote ?? '',
    termsText: settings?.termsText ?? '',
    idealEnabled: settings?.idealEnabled ?? true,
    creditCardEnabled: settings?.creditCardEnabled ?? true,
    applePayEnabled: settings?.applePayEnabled ?? true,
    bancontactEnabled: settings?.bancontactEnabled ?? true,
    invoicePaymentEnabled: settings?.invoicePaymentEnabled ?? false,
  }
}

function toOrderDraftMap(orders: ApiAdminOrder[]) {
  return Object.fromEntries(
    orders.map((order) => [
      order.id,
      {
        status: order.status,
        paymentStatus: order.paymentStatus,
        invoiceStatus: order.invoice?.status ?? 'ISSUED',
        trackingCode: order.shipment?.trackingCode ?? '',
        notes: order.notes ?? '',
      } satisfies OrderDraft,
    ]),
  ) as Record<string, OrderDraft>
}

function readLocalOrders(): LocalStoredOrder[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem('ferdiek-orders')
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as LocalStoredOrder[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function mapLocalOrdersToAdminOrders(localOrders: LocalStoredOrder[]): ApiAdminOrder[] {
  return localOrders.map((order) => ({
    id: order.id,
    orderNumber: order.id,
    status: order.bank.startsWith('Testbetaling') ? 'PAID' : 'PENDING_PAYMENT',
    paymentStatus: order.bank.startsWith('Testbetaling') ? 'PAID' : 'PENDING',
    totalCents: Math.round(order.total * 100),
    createdAt: order.createdAt,
    notes: null,
    user: {
      id: order.email,
      name: order.customerName,
      email: order.email,
      role: 'BUYER',
    },
    items: order.items.map((item, index) => ({
      id: `${order.id}-${index + 1}`,
      quantity: item.quantity,
      priceCents: Math.round(item.price * 100),
      nameSnapshot: item.name,
      subtitleSnapshot: item.variantName ?? 'Variant',
    })),
    invoice: order.bank.startsWith('Testbetaling')
      ? {
          invoiceNumber: `TEST-${order.id}`,
          status: 'PAID',
        }
      : null,
    shipment: null,
  }))
}

function buildLocalStats(localOrders: ApiAdminOrder[], products: Product[]): DashboardStats {
  const paidOrders = localOrders.filter((order) => order.paymentStatus === 'PAID').length
  const uniqueUsers = new Set(localOrders.map((order) => order.user.email)).size

  return {
    users: uniqueUsers,
    orders: localOrders.length,
    paidOrders,
    products: products.length,
    activeCarts: 0,
  }
}

function buildAdminCustomers(users: ApiAdminUser[], orders: ApiAdminOrder[]): AdminCustomer[] {
  const ordersByUserId = new Map<string, ApiAdminOrder[]>()

  orders.forEach((order) => {
    const currentOrders = ordersByUserId.get(order.user.id) ?? []
    currentOrders.push(order)
    ordersByUserId.set(order.user.id, currentOrders)
  })

  return users
    .filter((user) => user.role === 'BUYER')
    .map((user) => {
      const customerOrders = [...(ordersByUserId.get(user.id) ?? [])].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )

      return {
        ...user,
        orders: customerOrders,
        orderCount: customerOrders.length,
        totalSpentCents: customerOrders.reduce((sum, order) => sum + order.totalCents, 0),
        latestOrderAt: customerOrders[0]?.createdAt,
      }
    })
    .sort((left, right) => {
      const rightDate = right.latestOrderAt ? new Date(right.latestOrderAt).getTime() : 0
      const leftDate = left.latestOrderAt ? new Date(left.latestOrderAt).getTime() : 0
      return rightDate - leftDate
    })
}

function formatAddressLine(address: ApiAdminUser['addresses'][number]) {
  return [address.street, address.houseNumber, address.postalCode, address.city, address.country].filter(Boolean).join(', ')
}

function AdminShell({
  user,
  title,
  description,
  children,
  onLogout,
  overlayMode = false,
  onCloseOverlay,
  newTodayOrdersCount = 0,
  onAcknowledgeNewOrders,
}: {
  user: SessionUser
  title: string
  description: string
  children: ReactNode
  onLogout: () => void
  overlayMode?: boolean
  onCloseOverlay?: () => void
  newTodayOrdersCount?: number
  onAcknowledgeNewOrders?: () => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobileViewport = useAdminMobileViewport()
  const { mobileAppMode, forceDesktopView } = useAdminDisplayPreferences()
  const useMobileAppShell = isMobileViewport && mobileAppMode && !forceDesktopView
  const useClassicMobileShell = isMobileViewport && !forceDesktopView && !mobileAppMode

  const closeShop = () => {
    if (onCloseOverlay) {
      onCloseOverlay()
      return
    }

    window.location.assign('/shop')
  }

  const handleOrdersNavClick = () => {
    if (newTodayOrdersCount > 0) {
      onAcknowledgeNewOrders?.()
    }
  }

  const handleNewOrdersAlertClick = () => {
    onAcknowledgeNewOrders?.()
    if (!location.pathname.startsWith('/admin/orders')) {
      navigate('/admin/orders')
    }
  }

  const shellClassName = [
    'admin-shell-page',
    overlayMode ? 'is-overlay-panel' : '',
    useMobileAppShell ? 'is-mobile-app' : '',
    forceDesktopView && isMobileViewport ? 'is-force-desktop' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const mainContent = (options?: { hideTopbar?: boolean }) => (
    <>
      {!options?.hideTopbar ? (
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">FERDIEK Admin</p>
            <h1>{title}</h1>
            <p className="admin-page-copy">{description}</p>
          </div>
        </header>
      ) : null}
      {newTodayOrdersCount > 0 ? (
        <button type="button" className="admin-new-orders-alert" onClick={handleNewOrdersAlertClick}>
          <span className="admin-new-orders-alert-count">{newTodayOrdersCount}</span>
          <span className="admin-new-orders-alert-copy">
            <strong>
              {newTodayOrdersCount === 1 ? 'Nieuwe bestelling vandaag' : `${newTodayOrdersCount} nieuwe bestellingen vandaag`}
            </strong>
            <span>Klik om inkomende bestellingen te openen. De melding verdwijnt daarna.</span>
          </span>
        </button>
      ) : null}
      <main className="admin-main">{children}</main>
    </>
  )

  return (
    <div className={shellClassName}>
      {useClassicMobileShell ? (
      <header className="admin-mobile-app-header">
        <div className="admin-mobile-appbar">
          <Link className="admin-mobile-brand" to="/admin" aria-label="Ga naar admin dashboard">
            <img src={logo} alt="FERDIEK logo" className="brand-logo" />
            <span>{user.role === 'OWNER' ? 'Eigenaar' : 'Medewerker'}</span>
          </Link>
          <div className="admin-mobile-app-actions">
            <Link className="admin-mobile-icon-button" to="/shop" aria-label="Terug naar shop" onClick={(event) => { if (overlayMode && onCloseOverlay) { event.preventDefault(); onCloseOverlay() } }}>
              <FiArrowLeft aria-hidden="true" />
            </Link>
            <button type="button" className="admin-mobile-icon-button" onClick={onLogout} aria-label="Uitloggen">
              <FiLogOut aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="admin-mobile-title-card">
          <p className="eyebrow">FERDIEK Admin</p>
          <h1>{title}</h1>
          <span>{description}</span>
        </div>
        <nav className="admin-mobile-nav" aria-label="Mobiele admin navigatie">
          <NavLink end to="/admin" className={({ isActive }) => `admin-mobile-nav-link ${isActive ? 'is-active' : ''}`}>
            <FiBarChart2 aria-hidden="true" />
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) => `admin-mobile-nav-link ${isActive ? 'is-active' : ''}`}
            onClick={handleOrdersNavClick}
          >
            <FiLayers aria-hidden="true" />
            Orders
            {newTodayOrdersCount > 0 ? (
              <span className="admin-nav-badge" aria-hidden="true">
                {newTodayOrdersCount}
              </span>
            ) : null}
          </NavLink>
          <NavLink to="/admin/customers" className={({ isActive }) => `admin-mobile-nav-link ${isActive ? 'is-active' : ''}`}>
            <FiUsers aria-hidden="true" />
            Klanten
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => `admin-mobile-nav-link ${isActive ? 'is-active' : ''}`}>
            <FiBox aria-hidden="true" />
            Producten
          </NavLink>
          <NavLink to="/admin/media" className={({ isActive }) => `admin-mobile-nav-link ${isActive ? 'is-active' : ''}`}>
            <FiImage aria-hidden="true" />
            Media
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => `admin-mobile-nav-link ${isActive ? 'is-active' : ''}`}>
            <FiSettings aria-hidden="true" />
            Instellingen
          </NavLink>
          {user.role === 'OWNER' ? (
            <NavLink to="/admin/emails" className={({ isActive }) => `admin-mobile-nav-link ${isActive ? 'is-active' : ''}`}>
              <FiMail aria-hidden="true" />
              E-mails
            </NavLink>
          ) : null}
          {user.role === 'OWNER' ? (
            <NavLink to="/admin/integrations" className={({ isActive }) => `admin-mobile-nav-link ${isActive ? 'is-active' : ''}`}>
              <FiGlobe aria-hidden="true" />
              Integraties
            </NavLink>
          ) : null}
        </nav>
      </header>
      ) : null}
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin" aria-label="Ga naar admin dashboard">
          <img src={logo} alt="FERDIEK logo" className="brand-logo" />
          <div>
            <strong>Admin</strong>
            <span>Back office</span>
          </div>
        </Link>

        <nav className="admin-nav">
          <NavLink end to="/admin" className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}>
            <FiBarChart2 aria-hidden="true" />
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}
            onClick={handleOrdersNavClick}
          >
            <FiLayers aria-hidden="true" />
            Inkomende bestellingen
            {newTodayOrdersCount > 0 ? (
              <span className="admin-nav-badge" aria-hidden="true">
                {newTodayOrdersCount}
              </span>
            ) : null}
          </NavLink>
          <NavLink to="/admin/customers" className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}>
            <FiUsers aria-hidden="true" />
            Klanten
          </NavLink>
            <NavLink to="/admin/analytics" className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}>
              <FiBarChart2 size={18} />
              Analytics
            </NavLink>
            <NavLink to="/admin/newsletter" className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}>
              <FiUsers size={18} />
              Nieuwsbrief
            </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}>
            <FiBox aria-hidden="true" />
            Producten
          </NavLink>
          <NavLink to="/admin/media" className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}>
            <FiImage aria-hidden="true" />
            Media
          </NavLink>
          <NavLink to="/admin/seo" className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}>
            <FiGlobe aria-hidden="true" />
            Pagina&apos;s
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}>
            <FiSettings aria-hidden="true" />
            Instellingen
          </NavLink>
          {user.role === 'OWNER' ? (
            <NavLink to="/admin/emails" className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}>
              <FiMail aria-hidden="true" />
              E-mails
            </NavLink>
          ) : null}
          {user.role === 'OWNER' ? (
            <NavLink to="/admin/integrations" className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}>
              <FiSettings aria-hidden="true" />
              Integraties
            </NavLink>
          ) : null}
          {user.role === 'OWNER' ? (
            <NavLink to="/admin/team" className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}>
              <FiUsers aria-hidden="true" />
              Team
            </NavLink>
          ) : null}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-chip">
            <strong>{user.name}</strong>
            <span>{user.role === 'OWNER' ? 'Eigenaar' : 'Medewerker'}</span>
          </div>
          <button type="button" className="btn btn-secondary" onClick={closeShop}>
            <FiArrowLeft aria-hidden="true" />
            Terug naar shop
          </button>
          <button type="button" className="btn btn-primary" onClick={onLogout}>
            <FiLogOut aria-hidden="true" />
            Uitloggen
          </button>
        </div>
      </aside>

      {useMobileAppShell ? (
        <AdminMobileAppShell
          title={title}
          userRole={user.role === 'OWNER' ? 'OWNER' : 'EMPLOYEE'}
          newTodayOrdersCount={newTodayOrdersCount}
          onCloseShop={closeShop}
          onOrdersNavClick={handleOrdersNavClick}
        >
          {mainContent({ hideTopbar: true })}
        </AdminMobileAppShell>
      ) : (
        <div className="admin-content">{mainContent()}</div>
      )}
    </div>
  )
}

function AdminDashboardPage({
  token,
  stats,
  incomingOrders,
  activeCarts,
  recentPageVisits,
  products,
  settings,
}: {
  token: string
  stats: DashboardStats
  incomingOrders: ApiAdminOrder[]
  activeCarts: ApiAdminActiveCart[]
  recentPageVisits: ApiAdminPageVisit[]
  products: Product[]
  settings: ApiBusinessSettings | null
}) {
  const visibleProducts = products.filter((product) => product.isVisible).length
  const [search, setSearch] = useState('')
  const [analyticsRange, setAnalyticsRange] = useState(() => getDashboardRangePreset('30d'))
  const [dashboardAnalytics, setDashboardAnalytics] = useState<ApiAdminAnalyticsPayload | null>(null)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false
    const loadingTimer = window.setTimeout(() => {
      if (!cancelled) {
        setIsAnalyticsLoading(true)
      }
    }, 0)
    void apiAdminAnalytics(token, analyticsRange)
      .then((result) => {
        if (!cancelled) {
          setDashboardAnalytics(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDashboardAnalytics(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsAnalyticsLoading(false)
        }
      })

    return () => {
      cancelled = true
      window.clearTimeout(loadingTimer)
    }
  }, [analyticsRange, token])

  const quickActions = useMemo(
    () =>
      [
        { label: 'Open orders', description: 'Werk nieuwe bestellingen direct af.', to: '/admin/orders', icon: FiLayers },
        { label: 'Open klanten', description: 'Zoek kopers, adressen en trackingcodes.', to: '/admin/customers', icon: FiUsers },
        { label: 'Open producten', description: 'Bewerk catalogus en zichtbaarheid.', to: '/admin/products', icon: FiBox },
        { label: 'Open pagina\'s', description: 'Beheer SEO en pagina-inhoud per pagina.', to: '/admin/seo', icon: FiGlobe },
        { label: 'Open instellingen', description: 'Werk bedrijfsgegevens en supportgegevens bij.', to: '/admin/settings', icon: FiSettings },
      ].filter((action) => {
        const query = search.trim().toLowerCase()
        if (!query) {
          return true
        }

        return `${action.label} ${action.description}`.toLowerCase().includes(query)
      }),
    [search],
  )
  const dashboardOrderSegments = (dashboardAnalytics?.orderStatusSegments ?? [])
    .filter((segment) => segment.value > 0)
    .map((segment, index) => ({
      label: formatAdminStatusLabel(segment.label),
      value: segment.value,
      color: ['#5A463A', '#c6a77a', '#2b1f1a', '#8f6f52', 'rgba(43,31,26,0.25)', '#b43228'][index % 6],
    }))
  const dashboardVisitSegments = (dashboardAnalytics?.topPages.slice(0, 5) ?? []).map((page, index) => ({
    label: page.path,
    value: page.views,
    color: ['#5A463A', '#c6a77a', '#2b1f1a', '#8f6f52', 'rgba(43,31,26,0.25)'][index % 5],
  }))
  const dashboardOrdersPerDay = dashboardAnalytics?.series.map((point) => ({ label: point.label, value: point.orders })) ?? []

  return (
    <div className="admin-page-grid">
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <p className="product-label">Dashboard analytics</p>
            <h2>Filter omzet, orders en pagina-activiteit per periode.</h2>
          </div>
          <Link className="btn btn-secondary" to="/admin/analytics">
            Naar analytics
          </Link>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { key: 'today', label: 'Vandaag' },
                { key: '7d', label: '7 dagen' },
                { key: '30d', label: '30 dagen' },
                { key: 'thisMonth', label: 'Deze maand' },
                { key: 'lastMonth', label: 'Vorige maand' },
              ].map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  className="btn btn-secondary"
                  style={{ minHeight: 36, paddingInline: 14 }}
                  onClick={() => setAnalyticsRange(getDashboardRangePreset(preset.key as AdminDashboardRangePreset))}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="date"
                value={analyticsRange.from}
                onChange={(event) => setAnalyticsRange((current) => ({ ...current, from: event.target.value }))}
                style={{ minHeight: 36, border: '1px solid rgba(90,70,58,0.18)', borderRadius: 3, paddingInline: 12, background: '#fff' }}
              />
              <span className="admin-muted">tot</span>
              <input
                type="date"
                value={analyticsRange.to}
                onChange={(event) => setAnalyticsRange((current) => ({ ...current, to: event.target.value }))}
                style={{ minHeight: 36, border: '1px solid rgba(90,70,58,0.18)', borderRadius: 3, paddingInline: 12, background: '#fff' }}
              />
            </div>
          </div>

          {isAnalyticsLoading ? <p className="admin-muted">Analytics worden geladen...</p> : null}
          {dashboardAnalytics ? (
            <>
              <section className="admin-kpi-grid">
                <article className="admin-card admin-kpi-card">
                  <span>Gebruikers</span>
                  <strong>{stats.users}</strong>
                  <p>Alle accounts in shop en back office.</p>
                </article>
                <article className="admin-card admin-kpi-card">
                  <span>Bestellingen</span>
                  <strong>{stats.orders}</strong>
                  <p>Totaal aantal orders in het systeem.</p>
                </article>
                <article className="admin-card admin-kpi-card">
                  <span>Betaald</span>
                  <strong>{stats.paidOrders}</strong>
                  <p>Orders met bevestigde betaling.</p>
                </article>
                <article className="admin-card admin-kpi-card">
                  <span>Producten</span>
                  <strong>{stats.products}</strong>
                  <p>{visibleProducts} zichtbaar in de shop.</p>
                </article>
                <article className="admin-card admin-kpi-card">
                  <span>Actieve mandjes</span>
                  <strong>{stats.activeCarts}</strong>
                  <p>Ingelogde accounts met mandinhoud.</p>
                </article>
                <article className="admin-card admin-kpi-card">
                  <span>Omzet</span>
                  <strong>{formatPrice(dashboardAnalytics.summary.revenueCents / 100)}</strong>
                  <p>{dashboardAnalytics.summary.paidOrders} betaalde orders in selectie.</p>
                </article>
                <article className="admin-card admin-kpi-card">
                  <span>Paginabezoeken</span>
                  <strong>{dashboardAnalytics.summary.pageVisits}</strong>
                  <p>{dashboardAnalytics.summary.uniqueVisitors} unieke klanten.</p>
                </article>
                <article className="admin-card admin-kpi-card">
                  <span>Gem. duur</span>
                  <strong>{formatDurationLabel(dashboardAnalytics.summary.avgDurationSeconds)}</strong>
                  <p>Gemiddelde activiteitenduur per bezoek.</p>
                </article>
              </section>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, alignItems: 'start' }}>
                <div>
                  <p className="product-label">Orderstatus</p>
                  <DonutChart
                    size={150}
                    segments={dashboardOrderSegments.length ? dashboardOrderSegments : [{ label: 'Geen orders', value: 1, color: 'rgba(90,70,58,0.12)' }]}
                  />
                </div>
                <div>
                  <p className="product-label">Top pagina's</p>
                  <DonutChart
                    size={150}
                    segments={dashboardVisitSegments.length ? dashboardVisitSegments : [{ label: 'Geen bezoeken', value: 1, color: 'rgba(90,70,58,0.12)' }]}
                  />
                </div>
                <div>
                  <p className="product-label">Orders per dag</p>
                  <BarChart data={dashboardOrdersPerDay} color="#c6a77a" height={110} />
                </div>
              </div>
            </>
          ) : !isAnalyticsLoading ? (
            <p className="admin-muted">Geen analytics beschikbaar voor deze periode.</p>
          ) : null}
        </div>
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="product-label">Snelle acties</p>
              <h2>Zoek sneller naar de juiste admin-actie.</h2>
            </div>
          </div>

          <label className="admin-search-field">
            <FiSearch aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Zoek acties op dashboard" />
          </label>

          <div className="admin-stack-list">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.to} className="admin-list-row admin-list-row-link" to={action.to}>
                  <div>
                    <strong>{action.label}</strong>
                    <span>{action.description}</span>
                  </div>
                  <div className="admin-list-row-meta">
                    <Icon aria-hidden="true" />
                  </div>
                </Link>
              )
            })}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="product-label">Inkomende bestellingen</p>
              <h2>Direct overzicht van nieuwe en lopende orders.</h2>
            </div>
            <Link className="btn btn-secondary" to="/admin/orders">
              Alles bekijken
            </Link>
          </div>

          <div className="admin-stack-list">
            {incomingOrders.slice(0, 4).map((order) => (
              <div key={order.id} className="admin-list-row">
                <div>
                  <strong>{order.orderNumber}</strong>
                  <span>
                    {order.user.name} · {new Date(order.createdAt).toLocaleDateString('nl-NL')}
                  </span>
                </div>
                <div className="admin-list-row-meta">
                  <span className="success-badge">{order.status}</span>
                  <strong>{formatPrice(order.totalCents / 100)}</strong>
                </div>
              </div>
            ))}
            {incomingOrders.length === 0 ? <p className="admin-muted">Er zijn op dit moment geen inkomende bestellingen.</p> : null}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="product-label">Productstatus</p>
              <h2>Werk vanuit de catalogus snel door op zichtbaarheid en prijzen.</h2>
            </div>
            <Link className="btn btn-secondary" to="/admin/products">
              Producten beheren
            </Link>
          </div>

          <div className="admin-stack-list">
            {products.slice(0, 4).map((product) => {
              const variant = getDefaultVariant(product)
              return (
                <div key={product.id} className="admin-list-row">
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.isVisible ? 'Zichtbaar in shop' : 'Verborgen in shop'}</span>
                  </div>
                  <div className="admin-list-row-meta">
                    <span>{product.variants.length} varianten</span>
                    <strong>{variant ? formatPrice(variant.priceCents / 100) : '-'}</strong>
                  </div>
                </div>
              )
            })}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="product-label">Actieve mandjes</p>
              <h2>Zie direct welke ingelogde klanten nog producten klaar hebben staan.</h2>
            </div>
          </div>

          <div className="admin-stack-list">
            {activeCarts.map((cart) => (
              <div key={cart.user.id} className="admin-list-row admin-list-row-top">
                <div>
                  <strong>{cart.user.name}</strong>
                  <span>
                    {cart.user.email} · {cart.quantityTotal} stuks · bijgewerkt op{' '}
                    {new Date(cart.updatedAt).toLocaleString('nl-NL')}
                  </span>
                  <div className="admin-item-preview-list">
                    {cart.items.slice(0, 3).map((item, index) => (
                      <span key={`${cart.user.id}-${item.slug}-${item.variantId ?? 'default'}-${index}`}>
                        {item.productName ?? item.slug}
                        {item.variantName ? ` · ${item.variantName}` : ''}
                        {' · '}
                        {item.quantity}x
                      </span>
                    ))}
                    {cart.items.length > 3 ? <span>+{cart.items.length - 3} extra producten</span> : null}
                  </div>
                </div>
                <div className="admin-list-row-meta">
                  <span className="success-badge">{cart.itemCount} regels</span>
                </div>
              </div>
            ))}
            {activeCarts.length === 0 ? <p className="admin-muted">Er zijn op dit moment geen actieve mandjes van ingelogde accounts.</p> : null}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="product-label">Pagina-activiteit</p>
              <h2>Volg welke pagina’s klanten bezoeken en hoe lang ze daar blijven.</h2>
            </div>
          </div>

          <div className="admin-stack-list">
            {recentPageVisits.map((visit) => (
              <div key={visit.id} className="admin-list-row admin-list-row-top">
                <div>
                  <strong>{visit.user.name}</strong>
                  <span>
                    {visit.path}
                    {visit.pageTitle ? ` · ${visit.pageTitle}` : ''}
                  </span>
                  <span>Tot {new Date(visit.endedAt).toLocaleString('nl-NL')}</span>
                </div>
                <div className="admin-list-row-meta">
                  <strong>{formatDurationLabel(visit.durationSeconds)}</strong>
                  <span>{visit.user.email}</span>
                </div>
              </div>
            ))}
            {recentPageVisits.length === 0 ? <p className="admin-muted">Er zijn nog geen paginabezoeken gelogd.</p> : null}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="product-label">Bedrijfsinstellingen</p>
              <h2>BTW, factuurgegevens en contactdetails op een plek.</h2>
            </div>
            <Link className="btn btn-secondary" to="/admin/settings">
              Instellingen openen
            </Link>
          </div>

          <div className="summary-rows admin-summary-rows">
            <div className="summary-row">
              <span>Bedrijfsnaam</span>
              <strong>{settings?.companyName || 'Nog niet ingevuld'}</strong>
            </div>
            <div className="summary-row">
              <span>BTW-nummer</span>
              <strong>{settings?.vatNumber || 'Nog niet ingevuld'}</strong>
            </div>
            <div className="summary-row">
              <span>Support e-mail</span>
              <strong>{settings?.supportEmail || 'Nog niet ingevuld'}</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}

function AdminOrdersPage({
  orders,
  drafts,
  filter,
  onFilterChange,
  onDraftChange,
  onSaveOrder,
  onDownloadInvoice,
}: {
  orders: ApiAdminOrder[]
  drafts: Record<string, OrderDraft>
  filter: 'incoming' | 'all'
  onFilterChange: (value: 'incoming' | 'all') => void
  onDraftChange: (orderId: string, field: keyof OrderDraft, value: string) => void
  onSaveOrder: (orderId: string) => Promise<void>
  onDownloadInvoice: (orderId: string, invoiceNumber?: string) => Promise<void>
}) {
  const [search, setSearch] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const visibleOrders = filter === 'incoming' ? orders.filter((order) => ['PENDING_PAYMENT', 'PAID', 'PROCESSING'].includes(order.status)) : orders
  const filteredOrders = visibleOrders.filter((order) => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return true
    }

    const haystack = [
      order.orderNumber,
      order.user.name,
      order.user.email,
      order.status,
      formatOrderStatusLabel(order.status),
      order.paymentStatus,
      formatPaymentStatusLabel(order.paymentStatus),
      order.invoice?.invoiceNumber,
      order.invoice?.status,
      order.shipment?.trackingCode,
      order.notes,
      ...order.items.map((item) => `${item.nameSnapshot} ${item.subtitleSnapshot}`),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })

  return (
    <div className="admin-page-grid">
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <p className="product-label">Bestel inbox</p>
            <h2>Bekijk nieuwe orders, producten en status in een echte beheerweergave.</h2>
          </div>
          <div className="portal-tabs">
            <button
              type="button"
              className={`filter-chip ${filter === 'incoming' ? 'is-active' : ''}`}
              onClick={() => onFilterChange('incoming')}
            >
              Inkomend
            </button>
            <button type="button" className={`filter-chip ${filter === 'all' ? 'is-active' : ''}`} onClick={() => onFilterChange('all')}>
              Alles
            </button>
          </div>
        </div>
        <label className="admin-search-field">
          <FiSearch aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Zoek op ordernummer, klant, product, tracking of notitie" />
        </label>
        <p className="admin-muted">
          {filteredOrders.length} van {visibleOrders.length} bestellingen zichtbaar
        </p>
      </section>

      {filteredOrders.length === 0 ? (
        <section className="admin-card">
          <p className="admin-muted">Er zijn geen bestellingen voor dit filter of deze zoekopdracht.</p>
        </section>
      ) : (
        <section className="admin-card admin-orders-table-card">
          <div className="admin-orders-table-scroller">
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th aria-label="Open details" />
                  <th>Bestelling</th>
                  <th>Klant</th>
                  <th>Items</th>
                  <th>Totaal</th>
                  <th>Orderstatus</th>
                  <th>Betaalstatus</th>
                  <th>Factuur</th>
                  <th>Track &amp; trace</th>
                  <th>Acties</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.flatMap((order) => {
                  const draft = drafts[order.id]
                  const isExpanded = expandedOrderId === order.id
                  const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0)
                  const invoiceStatus = draft?.invoiceStatus ?? order.invoice?.status ?? 'ISSUED'
                  const trackingCode = draft?.trackingCode ?? order.shipment?.trackingCode ?? ''
                  const trackingUrl = order.shipment?.trackingUrl ?? getGeneratedTrackingUrl(trackingCode)
                  const hasChanges =
                    (draft?.status ?? order.status) !== order.status ||
                    (draft?.paymentStatus ?? order.paymentStatus) !== order.paymentStatus ||
                    invoiceStatus !== (order.invoice?.status ?? 'ISSUED') ||
                    trackingCode.trim() !== (order.shipment?.trackingCode ?? '').trim() ||
                    (draft?.notes ?? order.notes ?? '').trim() !== (order.notes ?? '').trim()

                  return [
                    <tr key={`${order.id}-summary`} className={`admin-order-row ${isExpanded ? 'is-expanded' : ''}`}>
                      <td className="admin-order-expand-cell">
                        <button
                          type="button"
                          className="admin-order-expand-button"
                          onClick={() => setExpandedOrderId((current) => (current === order.id ? null : order.id))}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? `Sluit details van ${order.orderNumber}` : `Open details van ${order.orderNumber}`}
                        >
                          {isExpanded ? <FiChevronDown aria-hidden="true" /> : <FiChevronRight aria-hidden="true" />}
                        </button>
                      </td>
                      <td>
                        <div className="admin-order-primary-cell">
                          <strong>{order.orderNumber}</strong>
                          <span>{new Date(order.createdAt).toLocaleString('nl-NL')}</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-order-primary-cell">
                          <strong>{order.user.name}</strong>
                          <span>{order.user.email}</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-order-primary-cell">
                          <strong>{totalUnits} stuks</strong>
                          <span>{order.items.slice(0, 2).map((item) => item.nameSnapshot).join(', ')}</span>
                        </div>
                      </td>
                      <td>
                        <strong>{formatPrice(order.totalCents / 100)}</strong>
                      </td>
                      <td>
                        <span className="admin-status-pill">{formatOrderStatusLabel(draft?.status ?? order.status)}</span>
                      </td>
                      <td>
                        <span className="admin-status-pill is-neutral">{formatPaymentStatusLabel(draft?.paymentStatus ?? order.paymentStatus)}</span>
                      </td>
                      <td>
                        <div className="admin-order-primary-cell">
                          <strong>{order.invoice?.invoiceNumber ?? 'Geen factuur'}</strong>
                          <span>{formatInvoiceStatusLabel(order.invoice?.status)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-order-primary-cell">
                          <strong>{trackingCode.trim() || 'Nog leeg'}</strong>
                          <span>{formatShipmentCarrierLabel(order.shipment?.carrier)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          {order.invoice ? (
                            <button type="button" className="btn btn-secondary" onClick={() => void onDownloadInvoice(order.id, order.invoice?.invoiceNumber)}>
                              <FiDownload aria-hidden="true" />
                              PDF
                            </button>
                          ) : null}
                          <button type="button" className="btn btn-secondary" onClick={() => setExpandedOrderId((current) => (current === order.id ? null : order.id))}>
                            {isExpanded ? 'Sluiten' : 'Openen'}
                          </button>
                          <button type="button" className="btn btn-primary" onClick={() => void onSaveOrder(order.id)} disabled={!hasChanges}>
                            Opslaan
                          </button>
                        </div>
                      </td>
                    </tr>,
                    isExpanded ? (
                      <tr key={`${order.id}-detail`} className="admin-order-detail-row">
                        <td colSpan={10}>
                          <div className="admin-order-detail-panel">
                            <div className="admin-order-detail-grid">
                              <section className="admin-order-detail-card">
                                <p className="product-label">Korte informatie</p>
                                <div className="summary-rows admin-summary-rows">
                                  <div className="summary-row">
                                    <span>Klant</span>
                                    <strong>{order.user.name}</strong>
                                  </div>
                                  <div className="summary-row">
                                    <span>E-mail</span>
                                    <strong>{order.user.email}</strong>
                                  </div>
                                  <div className="summary-row">
                                    <span>Totaal</span>
                                    <strong>{formatPrice(order.totalCents / 100)}</strong>
                                  </div>
                                  <div className="summary-row">
                                    <span>Factuur</span>
                                    <strong>{order.invoice?.invoiceNumber ?? 'Niet aangemaakt'}</strong>
                                  </div>
                                </div>
                              </section>

                              <section className="admin-order-detail-card">
                                <p className="product-label">Bestelling</p>
                                <div className="admin-order-items">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="order-item-line">
                                      <span>
                                        {item.nameSnapshot} x {item.quantity}
                                      </span>
                                      <strong>{formatPrice((item.priceCents / 100) * item.quantity)}</strong>
                                    </div>
                                  ))}
                                </div>
                              </section>
                            </div>

                            <div className="admin-form-grid">
                              <label>
                                Orderstatus
                                <select value={draft?.status ?? order.status} onChange={(event) => onDraftChange(order.id, 'status', event.target.value)}>
                                  {orderStatusOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label>
                                Betaalstatus
                                <select
                                  value={draft?.paymentStatus ?? order.paymentStatus}
                                  onChange={(event) => onDraftChange(order.id, 'paymentStatus', event.target.value)}
                                >
                                  {paymentStatusOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label>
                                Factuurstatus
                                <select
                                  value={invoiceStatus}
                                  onChange={(event) => onDraftChange(order.id, 'invoiceStatus', event.target.value)}
                                  disabled={!order.invoice}
                                >
                                  {invoiceStatusOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label>
                                Trackingcode
                                <input
                                  value={trackingCode}
                                  onChange={(event) => onDraftChange(order.id, 'trackingCode', event.target.value)}
                                  placeholder="PostNL track & trace code"
                                />
                              </label>

                              <label className="form-field-wide">
                                Interne notities
                                <textarea
                                  rows={4}
                                  value={draft?.notes ?? order.notes ?? ''}
                                  onChange={(event) => onDraftChange(order.id, 'notes', event.target.value)}
                                  placeholder="Voeg een interne notitie toe voor deze bestelling"
                                />
                              </label>
                            </div>

                            <div className="admin-actions-row">
                              <div className="admin-order-detail-actions">
                                {trackingUrl ? (
                                  <a className="btn btn-secondary" href={trackingUrl} target="_blank" rel="noreferrer">
                                    <FiTruck aria-hidden="true" />
                                    Tracking openen
                                  </a>
                                ) : (
                                  <button type="button" className="btn btn-secondary" disabled>
                                    <FiTruck aria-hidden="true" />
                                    Geen trackinglink
                                  </button>
                                )}
                                {order.invoice ? (
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => void onDownloadInvoice(order.id, order.invoice?.invoiceNumber)}
                                  >
                                    <FiFileText aria-hidden="true" />
                                    Factuur downloaden
                                  </button>
                                ) : (
                                  <span className="admin-static-detail-pill">
                                    <FiFileText aria-hidden="true" />
                                    Geen factuur
                                  </span>
                                )}
                              </div>
                              <button type="button" className="btn btn-primary" onClick={() => void onSaveOrder(order.id)}>
                                <FiSave aria-hidden="true" />
                                Wijzigingen opslaan
                              </button>
                            </div>

                            <div className="admin-order-inline-notes">
                              <span className="admin-section-caption">
                                {hasChanges ? 'Conceptwijzigingen klaar om op te slaan' : 'Geen openstaande wijzigingen'}
                              </span>
                              {trackingUrl ? (
                                <a href={trackingUrl} target="_blank" rel="noreferrer" className="admin-inline-link">
                                  Trackinglink openen
                                  <FiExternalLink aria-hidden="true" />
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null,
                  ]
                })}
              </tbody>
            </table>
          </div>
          <div className="admin-mobile-order-feed">
            {filteredOrders.map((order) => {
              const draft = drafts[order.id]
              const isExpanded = expandedOrderId === order.id
              const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0)
              const invoiceStatus = draft?.invoiceStatus ?? order.invoice?.status ?? 'ISSUED'
              const trackingCode = draft?.trackingCode ?? order.shipment?.trackingCode ?? ''
              const trackingUrl = order.shipment?.trackingUrl ?? getGeneratedTrackingUrl(trackingCode)
              const hasChanges =
                (draft?.status ?? order.status) !== order.status ||
                (draft?.paymentStatus ?? order.paymentStatus) !== order.paymentStatus ||
                invoiceStatus !== (order.invoice?.status ?? 'ISSUED') ||
                trackingCode.trim() !== (order.shipment?.trackingCode ?? '').trim() ||
                (draft?.notes ?? order.notes ?? '').trim() !== (order.notes ?? '').trim()

              return (
                <article key={`${order.id}-mobile`} className={`admin-mobile-order-card ${isExpanded ? 'is-expanded' : ''}`}>
                  <button
                    type="button"
                    className="admin-mobile-order-summary"
                    onClick={() => setExpandedOrderId((current) => (current === order.id ? null : order.id))}
                    aria-expanded={isExpanded}
                  >
                    <span className="admin-mobile-order-topline">
                      <span>{order.orderNumber}</span>
                      <strong>{formatPrice(order.totalCents / 100)}</strong>
                    </span>
                    <span className="admin-mobile-order-customer">{order.user.name}</span>
                    <span className="admin-mobile-order-meta">
                      <span>{new Date(order.createdAt).toLocaleString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>{totalUnits} stuks</span>
                    </span>
                    <span className="admin-mobile-order-pills">
                      <span className="admin-status-pill">{formatOrderStatusLabel(draft?.status ?? order.status)}</span>
                      <span className="admin-status-pill is-neutral">{formatPaymentStatusLabel(draft?.paymentStatus ?? order.paymentStatus)}</span>
                    </span>
                  </button>

                  <div className="admin-mobile-order-body">
                    <div className="admin-mobile-order-block">
                      <p className="product-label">Producten</p>
                      <div className="admin-order-items">
                        {order.items.map((item) => (
                          <div key={item.id} className="order-item-line">
                            <span>
                              {item.nameSnapshot} x {item.quantity}
                            </span>
                            <strong>{formatPrice((item.priceCents / 100) * item.quantity)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="admin-mobile-order-block">
                      <p className="product-label">Klant & factuur</p>
                      <div className="summary-rows admin-summary-rows">
                        <div className="summary-row">
                          <span>E-mail</span>
                          <strong>{order.user.email}</strong>
                        </div>
                        <div className="summary-row">
                          <span>Factuur</span>
                          <strong>{order.invoice?.invoiceNumber ?? 'Geen factuur'}</strong>
                        </div>
                        <div className="summary-row">
                          <span>Tracking</span>
                          <strong>{trackingCode.trim() || 'Nog leeg'}</strong>
                        </div>
                      </div>
                    </div>

                    {isExpanded ? (
                      <>
                        <div className="admin-form-grid admin-mobile-order-form">
                          <label>
                            Orderstatus
                            <select value={draft?.status ?? order.status} onChange={(event) => onDraftChange(order.id, 'status', event.target.value)}>
                              {orderStatusOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Betaalstatus
                            <select value={draft?.paymentStatus ?? order.paymentStatus} onChange={(event) => onDraftChange(order.id, 'paymentStatus', event.target.value)}>
                              {paymentStatusOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Factuurstatus
                            <select value={invoiceStatus} onChange={(event) => onDraftChange(order.id, 'invoiceStatus', event.target.value)} disabled={!order.invoice}>
                              {invoiceStatusOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Trackingcode
                            <input value={trackingCode} onChange={(event) => onDraftChange(order.id, 'trackingCode', event.target.value)} placeholder="PostNL track & trace" />
                          </label>
                          <label className="form-field-wide">
                            Interne notities
                            <textarea
                              rows={3}
                              value={draft?.notes ?? order.notes ?? ''}
                              onChange={(event) => onDraftChange(order.id, 'notes', event.target.value)}
                              placeholder="Notitie voor deze bestelling"
                            />
                          </label>
                        </div>
                        <div className="admin-mobile-order-actions">
                          {trackingUrl ? (
                            <a className="btn btn-secondary" href={trackingUrl} target="_blank" rel="noreferrer">
                              <FiTruck aria-hidden="true" />
                              Tracking
                            </a>
                          ) : null}
                          {order.invoice ? (
                            <button type="button" className="btn btn-secondary" onClick={() => void onDownloadInvoice(order.id, order.invoice?.invoiceNumber)}>
                              <FiFileText aria-hidden="true" />
                              Factuur
                            </button>
                          ) : null}
                          <button type="button" className="btn btn-primary" onClick={() => void onSaveOrder(order.id)} disabled={!hasChanges}>
                            <FiSave aria-hidden="true" />
                            Opslaan
                          </button>
                        </div>
                        <span className="admin-section-caption">{hasChanges ? 'Wijzigingen klaar om op te slaan' : 'Alles is bijgewerkt'}</span>
                      </>
                    ) : (
                      <button type="button" className="btn btn-secondary" onClick={() => setExpandedOrderId(order.id)}>
                        Details en acties openen
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function AdminProductsPage({ user, products, onProductsChange }: { user: SessionUser; products: Product[]; onProductsChange: (products: Product[]) => void }) {
  const visibleProducts = products.filter((product) => product.isVisible).length
  const [search, setSearch] = useState('')
  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return true
    }

    return `${product.name} ${product.slug} ${product.subtitle}`.toLowerCase().includes(query)
  })

  return (
    <div className="admin-page-grid">
      <section className="admin-kpi-grid">
        <article className="admin-card admin-kpi-card">
          <span>Totaal producten</span>
          <strong>{products.length}</strong>
          <p>Alle producten in de catalogus.</p>
        </article>
        <article className="admin-card admin-kpi-card">
          <span>Zichtbaar</span>
          <strong>{visibleProducts}</strong>
          <p>Producten die live in de shop staan.</p>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <p className="product-label">Zoek in catalogus</p>
            <h2>Vind sneller producten en open direct pagina&apos;s of productbeheer.</h2>
          </div>
        </div>
        <label className="admin-search-field">
          <FiSearch aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Zoek op naam, slug of subtitel" />
        </label>
      </section>

      {user.token && user.role === 'OWNER' ? (
        <ProductCatalogManager token={user.token} products={products} onProductsChange={onProductsChange} />
      ) : (
        <section className="admin-order-grid">
          {filteredProducts.map((product) => {
            const variant = getDefaultVariant(product)

            return (
              <article key={product.id} className="admin-card">
                <div className="admin-order-header">
                  <div>
                    <p className="product-label">{product.isVisible ? 'Zichtbaar in shop' : 'Verborgen in shop'}</p>
                    <h3>{product.name}</h3>
                  </div>
                  <span className="success-badge">{product.isVisible ? 'Zichtbaar' : 'Verborgen'}</span>
                </div>
                <div className="summary-rows admin-summary-rows">
                  <div className="summary-row">
                    <span>Varianten</span>
                    <strong>{product.variants.length}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Media</span>
                    <strong>{product.media.length}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Prijs vanaf</span>
                    <strong>{variant ? formatPrice(variant.priceCents / 100) : '-'}</strong>
                  </div>
                </div>
                <div className="admin-actions-row">
                  <Link className="btn btn-secondary" to={`/admin/seo/products/${product.id}`}>
                    <FiGlobe aria-hidden="true" />
                    Pagina
                  </Link>
                </div>
              </article>
            )
          })}
          {filteredProducts.length === 0 ? <article className="admin-card"><p className="admin-muted">Geen producten gevonden voor deze zoekopdracht.</p></article> : null}
        </section>
      )}
    </div>
  )
}

function AdminDisplaySettingsPanel() {
  const isMobileViewport = useAdminMobileViewport()
  const { mobileAppMode, forceDesktopView, setMobileAppMode, setForceDesktopView } = useAdminDisplayPreferences()

  return (
    <section className="admin-card admin-display-settings">
      <div className="admin-card-head">
        <div>
          <p className="product-label">Backoffice weergave</p>
          <h2>Mobiele app-modus en desktopweergave.</h2>
        </div>
      </div>
      <div className="admin-display-settings-list">
        <label className="admin-display-toggle">
          <span className="admin-display-toggle-copy">
            <strong>Mobiele app-modus</strong>
            <span>Grote tegels op home en uitklapbaar menu rechtsonder. Standaard aan op mobiel.</span>
          </span>
          <input
            type="checkbox"
            checked={mobileAppMode}
            onChange={(event) => setMobileAppMode(event.target.checked)}
          />
        </label>
        <label className="admin-display-toggle">
          <span className="admin-display-toggle-copy">
            <strong>Desktopweergave op mobiel</strong>
            <span>Toon de volledige desktop-backoffice op een smal scherm. Handig voor snelle controle.</span>
          </span>
          <input
            type="checkbox"
            checked={forceDesktopView}
            onChange={(event) => setForceDesktopView(event.target.checked)}
            disabled={!isMobileViewport}
          />
        </label>
      </div>
      {!isMobileViewport ? (
        <p className="admin-muted">Desktopweergave op mobiel is alleen beschikbaar op een telefoon of smalle viewport.</p>
      ) : null}
    </section>
  )
}

function AdminSettingsPage({
  form,
  settings,
  isSavingBusiness,
  isSavingPaymentMethods,
  isUploadingLogo,
  onChange,
  onLogoUpload,
  onLogoRemove,
  onSaveBusiness,
  onSavePaymentMethods,
}: {
  form: SettingsFormState
  settings: ApiBusinessSettings | null
  isSavingBusiness: boolean
  isSavingPaymentMethods: boolean
  isUploadingLogo: boolean
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onLogoUpload: (file: File) => Promise<void>
  onLogoRemove: () => void
  onSaveBusiness: (event: FormEvent<HTMLFormElement>) => Promise<void>
  onSavePaymentMethods: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const logoPreviewUrl = resolveApiAssetUrl(form.invoiceLogoUrl || settings?.invoiceLogoUrl || '')

  return (
    <div className="admin-settings-layout">
      <AdminDisplaySettingsPanel />
      <aside className="admin-card">
        <p className="product-label">Huidige samenvatting</p>
        <div className="summary-rows admin-summary-rows">
          <div className="summary-row">
            <span>Bedrijf</span>
            <strong>{settings?.companyName || 'Nog niet ingevuld'}</strong>
          </div>
          <div className="summary-row">
            <span>BTW-nummer</span>
            <strong>{settings?.vatNumber || 'Nog niet ingevuld'}</strong>
          </div>
          <div className="summary-row">
            <span>KVK</span>
            <strong>{settings?.chamberOfCommerceNumber || 'Nog niet ingevuld'}</strong>
          </div>
          <div className="summary-row">
            <span>Adres</span>
            <strong>
              {[settings?.street, settings?.houseNumber, settings?.postalCode, settings?.city].filter(Boolean).join(' ') || 'Nog niet ingevuld'}
            </strong>
          </div>
          <div className="summary-row">
            <span>IBAN</span>
            <strong>{settings?.iban || 'Nog niet ingevuld'}</strong>
          </div>
          <div className="summary-row">
            <span>BTW-tarief</span>
            <strong>{((settings?.invoiceVatRateBasisPoints ?? 2100) / 100).toFixed(2).replace('.', ',')}%</strong>
          </div>
          <div className="summary-row">
            <span>Betaalmethodes</span>
            <strong>
              {[
                settings?.idealEnabled ? 'iDEAL' : null,
                settings?.creditCardEnabled ? 'Creditcard' : null,
                settings?.applePayEnabled ? 'Apple Pay' : null,
                settings?.bancontactEnabled ? 'Bancontact' : null,
                settings?.invoicePaymentEnabled ? 'Factuur' : null,
              ]
                .filter(Boolean)
                .join(', ') || 'Geen methodes actief'}
            </strong>
          </div>
        </div>
      </aside>

      <div className="admin-detail-stack">
        <section className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="product-label">Bedrijfsgegevens</p>
              <h2>Contact, factuurgegevens en adres.</h2>
            </div>
          </div>

          <form className="order-form admin-settings-form" onSubmit={(event) => void onSaveBusiness(event)}>
            <section className="admin-settings-payment-panel">
              <div className="admin-settings-payment-head">
                <div>
                  <strong>Factuurlogo</strong>
                  <span>Upload een logo dat bovenaan de PDF-facturen van klanten en in de admin gebruikt wordt.</span>
                </div>
                <div className="admin-order-detail-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        void onLogoUpload(file)
                      }
                      event.currentTarget.value = ''
                    }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={isUploadingLogo}>
                    <FiUpload aria-hidden="true" />
                    {isUploadingLogo ? 'Uploaden...' : 'Logo uploaden'}
                  </button>
                  {form.invoiceLogoUrl ? (
                    <button type="button" className="btn btn-secondary" onClick={onLogoRemove}>
                      Logo verwijderen
                    </button>
                  ) : null}
                </div>
              </div>
              {logoPreviewUrl ? (
                <div className="admin-invoice-logo-preview">
                  <img src={logoPreviewUrl} alt="Factuurlogo preview" />
                </div>
              ) : (
                <p className="admin-muted">Nog geen factuurlogo geupload.</p>
              )}
            </section>

            <div className="admin-form-grid">
              <label>
                Bedrijfsnaam
                <input name="companyName" value={form.companyName} onChange={onChange} required />
              </label>
              <label>
                Juridische naam
                <input name="legalName" value={form.legalName} onChange={onChange} />
              </label>
              <label>
                BTW-nummer
                <input name="vatNumber" value={form.vatNumber} onChange={onChange} />
              </label>
              <label>
                KVK-nummer
                <input name="chamberOfCommerceNumber" value={form.chamberOfCommerceNumber} onChange={onChange} />
              </label>
              <label>
                Support e-mail
                <input type="email" name="supportEmail" value={form.supportEmail} onChange={onChange} />
              </label>
              <label>
                Support telefoon
                <input name="supportPhone" value={form.supportPhone} onChange={onChange} />
              </label>
              <label>
                Straat
                <input name="street" value={form.street} onChange={onChange} />
              </label>
              <label>
                Huisnummer
                <input name="houseNumber" value={form.houseNumber} onChange={onChange} />
              </label>
              <label>
                Postcode
                <input name="postalCode" value={form.postalCode} onChange={onChange} />
              </label>
              <label>
                Plaats
                <input name="city" value={form.city} onChange={onChange} />
              </label>
              <label>
                Land
                <input name="country" value={form.country} onChange={onChange} />
              </label>
              <label>
                IBAN
                <input name="iban" value={form.iban} onChange={onChange} placeholder="NL00BANK0123456789" />
              </label>
              <label>
                BIC
                <input name="bic" value={form.bic} onChange={onChange} placeholder="BANKNL2A" />
              </label>
              <label>
                BTW-tarief (%)
                <input name="invoiceVatRateBasisPoints" type="number" min="0.01" step="0.01" value={form.invoiceVatRateBasisPoints} onChange={onChange} />
              </label>
              <label>
                Factuurvervaltermijn in dagen
                <input name="invoiceDueDays" type="number" min="1" step="1" value={form.invoiceDueDays} onChange={onChange} />
              </label>
              <label className="form-field-wide">
                Factuurvoet / juridische tekst
                <textarea name="invoiceFootnote" rows={5} value={form.invoiceFootnote} onChange={onChange} />
              </label>
            </div>

            <div className="admin-actions-row form-field-wide">
              <span className="admin-muted">Sla hier alleen de bedrijfs- en factuurgegevens op.</span>
              <button type="submit" className="btn btn-primary" disabled={isSavingBusiness}>
                {isSavingBusiness ? 'Opslaan...' : 'Bedrijfsgegevens opslaan'}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="product-label">Juridisch</p>
              <h2>Algemene voorwaarden</h2>
            </div>
          </div>
          <p className="admin-muted">
            Eén vrije tekst voor de pagina <code>/algemene-voorwaarden</code>, net als bij WooCommerce. Regels en witregels worden behouden.
          </p>
          <form className="order-form admin-settings-form" onSubmit={(event) => void onSaveBusiness(event)}>
            <label className="form-field-wide">
              Tekst algemene voorwaarden
              <textarea name="termsText" rows={18} value={form.termsText} onChange={onChange} placeholder="Schrijf hier de volledige algemene voorwaarden..." />
            </label>
            <div className="admin-actions-row form-field-wide">
              <button type="submit" className="btn btn-primary" disabled={isSavingBusiness}>
                {isSavingBusiness ? 'Opslaan...' : 'Voorwaarden opslaan'}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="product-label">Betaalmethodes</p>
              <h2>Kies los welke methodes zichtbaar zijn in de checkout.</h2>
            </div>
          </div>

          <form className="order-form admin-settings-form" onSubmit={(event) => void onSavePaymentMethods(event)}>
            <section className="admin-settings-payment-panel">
              <div className="admin-section-caption admin-settings-payment-head">
                <strong>Checkout methodes</strong>
                <span>Deze instellingen staan los van bedrijfsgegevens en hebben een eigen opslaan-knop.</span>
              </div>

              <div className="admin-payment-method-grid">
                {paymentMethodOptions.map((option) => (
                  <label
                    key={option.name}
                    className={`admin-payment-method-card ${form[option.name] ? 'is-enabled' : ''} ${
                      option.name === 'invoicePaymentEnabled' ? 'is-wide' : ''
                    }`}
                  >
                    <div className="admin-payment-method-copy">
                      <strong>{option.title}</strong>
                      <span>{option.description}</span>
                    </div>
                    <input type="checkbox" name={option.name} checked={form[option.name]} onChange={onChange} disabled={isSavingPaymentMethods} />
                  </label>
                ))}
              </div>
            </section>

            <div className="admin-actions-row form-field-wide">
              <span className="admin-muted">Sla hier alleen de actieve betaalmethodes op.</span>
              <button type="submit" className="btn btn-primary" disabled={isSavingPaymentMethods}>
                {isSavingPaymentMethods ? 'Opslaan...' : 'Betaalmethodes opslaan'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

function AdminTeamPage({
  users,
  form,
  onChange,
  onSubmit,
}: {
  users: ApiAdminUser[]
  form: EmployeeFormState
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  return (
    <div className="admin-settings-layout">
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <p className="product-label">Team</p>
            <h2>Overzicht van medewerkers met toegang tot het admin-portaal.</h2>
          </div>
        </div>

        <div className="admin-stack-list">
          {users
            .filter((entry) => entry.role === 'EMPLOYEE')
            .map((entry) => (
              <div key={entry.id} className="admin-list-row">
                <div>
                  <strong>{entry.name}</strong>
                  <span>{entry.email}</span>
                </div>
                <span>{entry.phone || 'Geen telefoon'}</span>
              </div>
            ))}
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <p className="product-label">Nieuwe medewerker</p>
            <h2>Maak snel een nieuw teamaccount aan.</h2>
          </div>
        </div>

        <form className="order-form admin-form-grid" onSubmit={(event) => void onSubmit(event)}>
          <label>
            Naam
            <input name="name" value={form.name} onChange={onChange} required />
          </label>
          <label>
            E-mailadres
            <input type="email" name="email" value={form.email} onChange={onChange} required />
          </label>
          <label>
            Wachtwoord
            <input type="password" name="password" value={form.password} onChange={onChange} required />
          </label>
          <label>
            Telefoon
            <input name="phone" value={form.phone} onChange={onChange} />
          </label>
          <div className="admin-actions-row form-field-wide">
            <span className="admin-muted">Nieuwe accounts krijgen medewerkerstoegang tot `/admin`.</span>
            <button type="submit" className="btn btn-primary">
              Werknemer aanmaken
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function AdminCustomersPage({
  customers,
  query,
  onQueryChange,
  token,
}: {
  customers: AdminCustomer[]
  query: string
  onQueryChange: (value: string) => void
  token?: string
}) {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const normalizedQuery = query.trim().toLowerCase()
  const [activity, setActivity] = useState<ApiAdminCustomerActivity | null>(null)
  const [isActivityLoading, setIsActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState('')

  const visibleCustomers = useMemo(() => {
    if (!normalizedQuery) {
      return customers
    }

    return customers.filter((customer) => {
      const haystack = [
        customer.name,
        customer.email,
        customer.phone ?? '',
        ...customer.addresses.map((address) => `${address.fullName} ${formatAddressLine(address)}`),
        ...customer.orders.map((order) => `${order.orderNumber} ${order.shipment?.trackingCode ?? ''}`),
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [customers, normalizedQuery])

  const selectedCustomer = customerId ? customers.find((customer) => customer.id === customerId) ?? null : null
  const activeCustomerId = selectedCustomer?.id ?? null
  const isActivityView = location.pathname.endsWith('/activity')

  useEffect(() => {
    if (!token || !selectedCustomer || !isActivityView) {
      setActivity(null)
      setActivityError('')
      setIsActivityLoading(false)
      return
    }

    let cancelled = false
    setIsActivityLoading(true)
    setActivityError('')

    void apiAdminCustomerActivity(token, selectedCustomer.id)
      .then((result) => {
        if (!cancelled) {
          setActivity(result.activity)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setActivity(null)
          setActivityError(error instanceof Error ? error.message : 'Klantactiviteit kon niet worden geladen.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsActivityLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isActivityView, selectedCustomer, token])

  return (
    <div className="admin-page-grid">
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <p className="product-label">Klantbeheer</p>
            <h2>Zoek klanten en open direct hun bestellingen, adressen en tracking.</h2>
          </div>
        </div>

        <div className="admin-customer-toolbar">
          <label className="admin-search-field">
            <span>Zoek klant</span>
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Naam, e-mail, telefoon, ordernummer of track & trace"
            />
          </label>

          <div className="admin-inline-metrics">
            <div className="admin-inline-metric">
              <span>Klanten</span>
              <strong>{customers.length}</strong>
            </div>
            <div className="admin-inline-metric">
              <span>Resultaten</span>
              <strong>{visibleCustomers.length}</strong>
            </div>
            <div className="admin-inline-metric">
              <span>Met bestelling</span>
              <strong>{customers.filter((customer) => customer.orderCount > 0).length}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="admin-customer-layout">
        <section className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="product-label">Klantenlijst</p>
              <h2>Alle kopers in de shop.</h2>
            </div>
          </div>

          <div className="admin-stack-list">
            {visibleCustomers.map((customer) => {
              const isActive = customer.id === activeCustomerId

              return (
                <button
                  key={customer.id}
                  type="button"
                  className={`admin-list-row admin-customer-row ${isActive ? 'is-active' : ''}`}
                  onClick={() => navigate(isActivityView ? `/admin/customers/${customer.id}/activity` : `/admin/customers/${customer.id}`)}
                >
                  <div>
                    <strong>{customer.name}</strong>
                    <span>{customer.email}</span>
                    <span>{customer.phone || 'Geen telefoonnummer'}</span>
                  </div>
                  <div className="admin-list-row-meta">
                    <span>{customer.orderCount} bestellingen</span>
                    <strong>{formatPrice(customer.totalSpentCents / 100)}</strong>
                  </div>
                </button>
              )
            })}

            {visibleCustomers.length === 0 ? <p className="admin-muted">Geen klanten gevonden voor deze zoekopdracht.</p> : null}
          </div>
        </section>

        <section className="admin-card">
          {selectedCustomer ? (
            <div className="admin-detail-stack">
              <div className="admin-card-head">
                <div>
                  <p className="product-label">{isActivityView ? 'Klantactiviteit' : 'Klantdetail'}</p>
                  <h2>{selectedCustomer.name}</h2>
                  <p className="admin-muted">
                    {selectedCustomer.email}
                    {selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ''}
                  </p>
                </div>
                <div className="admin-actions-row">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      navigate(isActivityView ? `/admin/customers/${selectedCustomer.id}` : `/admin/customers/${selectedCustomer.id}/activity`)
                    }
                  >
                    {isActivityView ? 'Terug naar klant' : 'Zie activiteit'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/customers')}>
                    Sluit detail
                  </button>
                </div>
              </div>

              {isActivityView ? (
                <>
                  <div className="summary-rows admin-summary-rows">
                    <div className="summary-row">
                      <span>Paginabezoeken</span>
                      <strong>{activity?.summary.pageVisitCount ?? 0}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Totale kijktijd</span>
                      <strong>{activity ? `${activity.summary.totalDurationSeconds} sec` : '0 sec'}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Laatst actief</span>
                      <strong>{activity?.summary.latestVisitAt ? new Date(activity.summary.latestVisitAt).toLocaleString('nl-NL') : 'Nog geen activiteit'}</strong>
                    </div>
                  </div>

                  {activityError ? <div className="payment-feedback payment-feedback-error">{activityError}</div> : null}
                  {isActivityLoading ? <p className="admin-muted">Klantactiviteit wordt geladen...</p> : null}

                  {!isActivityLoading && activity ? (
                    <div className="admin-detail-grid">
                      <div className="admin-detail-section">
                        <p className="product-label">Actieve mand</p>
                        {activity.cartSnapshot && activity.cartSnapshot.itemCount > 0 ? (
                          <div className="admin-address-list">
                            <article className="admin-address-card">
                              <strong>{activity.cartSnapshot.itemCount} regels · {activity.cartSnapshot.quantityTotal} stuks</strong>
                              <span>Laatste update: {new Date(activity.cartSnapshot.updatedAt).toLocaleString('nl-NL')}</span>
                              <div className="admin-item-preview-list">
                                {activity.cartSnapshot.items.map((item, index) => (
                                  <span key={`${item.slug}-${item.variantId ?? 'default'}-${index}`}>
                                    {item.productName ?? item.slug}
                                    {item.variantName ? ` · ${item.variantName}` : ''}
                                    {' · '}
                                    {item.quantity}x
                                    {item.priceCents ? ` · ${formatPrice(item.priceCents / 100)}` : ''}
                                  </span>
                                ))}
                              </div>
                            </article>
                          </div>
                        ) : (
                          <p className="admin-muted">Deze klant heeft nu geen actieve mand.</p>
                        )}
                      </div>

                      <div className="admin-detail-section">
                        <p className="product-label">Activiteitenlog</p>
                        <div className="admin-customer-order-list">
                          {activity.pageVisits.length > 0 ? (
                            activity.pageVisits.map((visit) => (
                              <article key={visit.id} className="admin-customer-order-card">
                                <div className="admin-order-header">
                                  <div>
                                    <strong>{visit.pageTitle || visit.path}</strong>
                                    <span>{visit.path}</span>
                                  </div>
                                  <strong>{visit.durationSeconds} sec</strong>
                                </div>
                                <div className="summary-rows admin-summary-rows">
                                  <div className="summary-row">
                                    <span>Start</span>
                                    <strong>{new Date(visit.startedAt).toLocaleString('nl-NL')}</strong>
                                  </div>
                                  <div className="summary-row">
                                    <span>Einde</span>
                                    <strong>{new Date(visit.endedAt).toLocaleString('nl-NL')}</strong>
                                  </div>
                                  <div className="summary-row">
                                    <span>Duur</span>
                                    <strong>{formatDurationLabel(visit.durationSeconds)} ({visit.durationSeconds} sec)</strong>
                                  </div>
                                </div>
                              </article>
                            ))
                          ) : (
                            <p className="admin-muted">Er zijn nog geen gelogde pagina-activiteiten voor deze klant.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="summary-rows admin-summary-rows">
                    <div className="summary-row">
                      <span>Aantal bestellingen</span>
                      <strong>{selectedCustomer.orderCount}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Totaal besteed</span>
                      <strong>{formatPrice(selectedCustomer.totalSpentCents / 100)}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Laatste bestelling</span>
                      <strong>
                        {selectedCustomer.latestOrderAt ? new Date(selectedCustomer.latestOrderAt).toLocaleDateString('nl-NL') : 'Nog geen bestelling'}
                      </strong>
                    </div>
                  </div>

                  <div className="admin-detail-grid">
                    <div className="admin-detail-section">
                      <p className="product-label">Opgeslagen gegevens</p>
                      <div className="admin-address-list">
                        {selectedCustomer.addresses.length > 0 ? (
                          selectedCustomer.addresses.map((address) => (
                            <article key={address.id} className="admin-address-card">
                              <strong>{address.type === 'BILLING' ? 'Factuuradres' : 'Verzendadres'}</strong>
                              <span>{address.fullName}</span>
                              <span>{formatAddressLine(address)}</span>
                              {address.label ? <span>{address.label}</span> : null}
                              {address.isDefault ? <span className="success-badge">Standaard</span> : null}
                            </article>
                          ))
                        ) : (
                          <p className="admin-muted">Deze klant heeft nog geen opgeslagen adressen.</p>
                        )}
                      </div>
                    </div>

                    <div className="admin-detail-section">
                      <p className="product-label">Bestellingen</p>
                      <div className="admin-customer-order-list">
                        {selectedCustomer.orders.length > 0 ? (
                          selectedCustomer.orders.map((order) => (
                            <article key={order.id} className="admin-customer-order-card">
                              <div className="admin-order-header">
                                <div>
                                  <strong>{order.orderNumber}</strong>
                                  <span>{new Date(order.createdAt).toLocaleString('nl-NL')}</span>
                                </div>
                                <strong>{formatPrice(order.totalCents / 100)}</strong>
                              </div>

                              <div className="summary-rows admin-summary-rows">
                                <div className="summary-row">
                                  <span>Status</span>
                                  <strong>{formatOrderStatusLabel(order.status)}</strong>
                                </div>
                                <div className="summary-row">
                                  <span>Betaling</span>
                                  <strong>{formatPaymentStatusLabel(order.paymentStatus)}</strong>
                                </div>
                                <div className="summary-row">
                                  <span>Track & trace</span>
                                  <strong>{order.shipment?.trackingCode ?? 'Nog niet ingesteld'}</strong>
                                </div>
                              </div>

                              <div className="admin-order-items">
                                {order.items.map((item) => (
                                  <div key={item.id} className="order-item-line">
                                    <span>
                                      {item.nameSnapshot} · {item.subtitleSnapshot} x {item.quantity}
                                    </span>
                                    <strong>{formatPrice((item.priceCents / 100) * item.quantity)}</strong>
                                  </div>
                                ))}
                              </div>

                              <div className="portal-note">
                                <strong>Verzending</strong>
                                <span>{formatShipmentCarrierLabel(order.shipment?.carrier)}</span>
                                <span>
                                  {order.shipment?.trackingCode
                                    ? `Track & trace: ${order.shipment.trackingCode}`
                                    : 'Nog geen track & trace ingesteld voor deze bestelling.'}
                                </span>
                                {order.shipment?.trackingUrl ? (
                                  <a href={order.shipment.trackingUrl} target="_blank" rel="noreferrer">
                                    Open tracking
                                  </a>
                                ) : null}
                              </div>
                            </article>
                          ))
                        ) : (
                          <p className="admin-muted">Deze klant heeft nog geen bestellingen geplaatst.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="admin-detail-empty">
              <p className="product-label">{isActivityView ? 'Klantactiviteit' : 'Klantdetail'}</p>
              <h2>Kies links een klant om gegevens of activiteit te bekijken.</h2>
              <p className="admin-muted">
                Je ziet hier per klant hun contactgegevens, opgeslagen adressen, bestellingen en via `Zie activiteit` ook hun bezochte pagina's en kijktijd.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default function AdminPortal({ user, onLogout, overlayMode = false, onCloseOverlay }: AdminPortalProps) {
  const location = useLocation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activeCarts, setActiveCarts] = useState<ApiAdminActiveCart[]>([])
  const [recentPageVisits, setRecentPageVisits] = useState<ApiAdminPageVisit[]>([])
  const [users, setUsers] = useState<ApiAdminUser[]>([])
  const [orders, setOrders] = useState<ApiAdminOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<ApiBusinessSettings | null>(null)
  const [settingsForm, setSettingsForm] = useState<SettingsFormState>(emptySettings)
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(initialEmployeeForm)
  const [orderDrafts, setOrderDrafts] = useState<Record<string, OrderDraft>>({})
  const [ordersFilter, setOrdersFilter] = useState<'incoming' | 'all'>('incoming')
  const [customerQuery, setCustomerQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingBusinessSettings, setIsSavingBusinessSettings] = useState(false)
  const [isSavingPaymentSettings, setIsSavingPaymentSettings] = useState(false)
  const [isUploadingInvoiceLogo, setIsUploadingInvoiceLogo] = useState(false)
  const [adminActionMessage, setAdminActionMessage] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [dismissedOrderIds, setDismissedOrderIds] = useState(() => readDismissedOrderIdsForToday())

  const incomingOrders = useMemo(
    () => orders.filter((order) => ['PENDING_PAYMENT', 'PAID', 'PROCESSING'].includes(order.status)),
    [orders],
  )
  const newTodayOrders = useMemo(
    () => getNewTodayIncomingOrders(orders, dismissedOrderIds),
    [orders, dismissedOrderIds],
  )

  const acknowledgeNewOrders = useCallback(() => {
    const ids = newTodayOrders.map((order) => order.id)
    if (!ids.length) {
      return
    }

    dismissOrderIds(ids)
    setDismissedOrderIds(readDismissedOrderIdsForToday())
  }, [newTodayOrders])
  const customers = useMemo(() => buildAdminCustomers(users, orders), [users, orders])
  const busyMessage = isLoading ? 'Admin-portaal laden...' : adminActionMessage

  const pageMeta = useMemo(() => {
    if (location.pathname.startsWith('/admin/orders')) {
      return {
        title: 'Inkomende bestellingen',
        description: 'Werk nieuwe orders, betaalstatussen en verzendingen af vanuit een overzichtelijke inbox.',
      }
    }

    if (location.pathname.startsWith('/admin/customers')) {
      return {
        title: 'Klanten',
        description: 'Bekijk per klant hun gegevens, bestelgeschiedenis en de ingestelde track & trace van elke bestelling.',
      }
    }

    if (location.pathname.startsWith('/admin/products')) {
      return {
        title: 'Producten',
        description: 'Bewerk de catalogus, varianten, prijzen en zichtbaarheid van producten vanuit een aparte beheersectie.',
      }
    }

    if (location.pathname.startsWith('/admin/media')) {
      return {
        title: 'Media',
        description: 'Bekijk sitebeelden en beheer geuploade productbeelden vanuit een vaste mediabibliotheek.',
      }
    }

    if (location.pathname.startsWith('/admin/seo')) {
      return {
        title: 'Pagina\'s',
        description: 'Beheer SEO, hero-inhoud en paginateksten per pagina en product.',
      }
    }

    if (location.pathname.startsWith('/admin/settings')) {
      return {
        title: 'Instellingen',
        description: 'Beheer btw, bedrijfsgegevens en factuurinformatie op een vaste plek in de admin.',
      }
    }

    if (location.pathname.startsWith('/admin/emails')) {
      return {
        title: 'E-mails',
        description: 'Beheer automatische order-, betaal- en accountmails per status — net als WooCommerce templates.',
      }
    }

    if (location.pathname.startsWith('/admin/integrations')) {
      return {
        title: 'Integraties',
        description: 'Bekijk en beheer Google login, Mollie en andere API-koppelingen vanuit een apart tabje.',
      }
    }

    if (location.pathname.startsWith('/admin/team')) {
      return {
        title: 'Team',
        description: 'Beheer medewerkers die toegang hebben tot het admin-portaal.',
      }
    }

    return {
      title: 'Dashboard',
      description: 'Een echt admin-dashboard met KPI’s, inkomende bestellingen, productstatus en bedrijfsinstellingen.',
    }
  }, [location.pathname])

  const loadAdmin = async () => {
    if (!user?.token) {
      return
    }

    const [dashboardResult, usersResult, ordersResult, productsResult, settingsResult] = await Promise.allSettled([
      apiDashboard(user.token),
      apiAdminUsers(user.token),
      apiAdminOrders(user.token),
      apiAdminProducts(user.token),
      apiAdminSettings(user.token),
    ])

    const normalizedProducts =
      productsResult.status === 'fulfilled'
        ? productsResult.value.products.map(normalizeProduct)
        : fallbackProducts

    const localFallbackOrders = mapLocalOrdersToAdminOrders(readLocalOrders())
    const resolvedOrders = ordersResult.status === 'fulfilled' && ordersResult.value.orders.length > 0 ? ordersResult.value.orders : localFallbackOrders
    const resolvedStats =
      dashboardResult.status === 'fulfilled'
        ? dashboardResult.value.stats
        : buildLocalStats(resolvedOrders, normalizedProducts)

    setStats(resolvedStats)
    setActiveCarts(dashboardResult.status === 'fulfilled' ? dashboardResult.value.activeCarts : [])
    setRecentPageVisits(dashboardResult.status === 'fulfilled' ? dashboardResult.value.recentPageVisits : [])
    setUsers(usersResult.status === 'fulfilled' ? usersResult.value.users : [])
    setOrders(resolvedOrders)
    setProducts(normalizedProducts)
    setSettings(settingsResult.status === 'fulfilled' ? settingsResult.value.settings : null)
    setSettingsForm(toSettingsForm(settingsResult.status === 'fulfilled' ? settingsResult.value.settings : null))
    setOrderDrafts(toOrderDraftMap(resolvedOrders))
  }

  useEffect(() => {
    if (!isAdmin(user) || !user?.token) {
      return
    }

    let cancelled = false

    const initialize = async () => {
      setIsLoading(true)

      try {
        await loadAdmin()
        if (!cancelled) {
          setError('')
          if (readLocalOrders().length > 0) {
            setMessage('Tijdelijke testorders uit de webshop worden getoond totdat de backend-orders live zijn.')
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Admin-portaal kon niet worden geladen.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void initialize()

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!isAdmin(user) || !user?.token) {
      return
    }

    const token = user.token

    const interval = window.setInterval(() => {
      void apiAdminOrders(token)
        .then((result) => {
          setOrders(result.orders)
          setOrderDrafts((current) => {
            const next = toOrderDraftMap(result.orders)
            return Object.keys(next).length ? { ...current, ...next } : current
          })
        })
        .catch(() => {
          // Stille refresh; handmatig herladen blijft mogelijk via navigatie.
        })
    }, 60_000)

    return () => {
      window.clearInterval(interval)
    }
  }, [user])

  if (!user) {
    return <Navigate to="/login" state={{ from: '/admin' }} replace />
  }

  if (!isAdmin(user)) {
    return <Navigate to="/account/orders" replace />
  }

  const handleOrderDraftChange = (orderId: string, field: keyof OrderDraft, value: string) => {
    setOrderDrafts((current) => ({
      ...current,
      [orderId]: {
        ...(current[orderId] ?? { status: 'PROCESSING', paymentStatus: 'PENDING', invoiceStatus: 'ISSUED', trackingCode: '', notes: '' }),
        [field]: value,
      },
    }))
  }

  const handleSaveOrder = async (orderId: string) => {
    if (!user.token) {
      return
    }

    const draft = orderDrafts[orderId]
    const order = orders.find((entry) => entry.id === orderId)
    if (!draft) {
      return
    }

    try {
      setAdminActionMessage('Bestelling bijwerken...')
      await apiUpdateShipment(user.token, orderId, {
        carrier: 'POSTNL',
        trackingCode: draft.trackingCode.trim() || undefined,
        trackingUrl: getGeneratedTrackingUrl(draft.trackingCode) || undefined,
      })

      await apiUpdateOrder(user.token, orderId, {
        status: draft.status,
        paymentStatus: draft.paymentStatus,
        invoiceStatus: order?.invoice ? draft.invoiceStatus : undefined,
        notes: draft.notes.trim() ? draft.notes.trim() : null,
      })

      await loadAdmin()
      setMessage('Bestelling bijgewerkt.')
      setError('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Bestelling kon niet worden bijgewerkt.')
    } finally {
      setAdminActionMessage('')
    }
  }

  const handleEmployeeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setEmployeeForm((current) => ({ ...current, [name]: value }))
  }

  const handleCreateEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user.token) {
      return
    }

    try {
      setAdminActionMessage('Medewerker aanmaken...')
      await apiCreateEmployee(user.token, {
        name: employeeForm.name,
        email: employeeForm.email,
        password: employeeForm.password,
        phone: employeeForm.phone || undefined,
      })
      setEmployeeForm(initialEmployeeForm)
      await loadAdmin()
      setMessage('Nieuwe medewerker aangemaakt.')
      setError('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Medewerker kon niet worden aangemaakt.')
    } finally {
      setAdminActionMessage('')
    }
  }

  const handleSettingsChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = event.currentTarget
    const value = event.currentTarget instanceof HTMLInputElement && event.currentTarget.type === 'checkbox'
      ? event.currentTarget.checked
      : event.currentTarget.value
    setSettingsForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSaveBusinessSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user.token) {
      return
    }

    setIsSavingBusinessSettings(true)
    setAdminActionMessage('Bedrijfsgegevens opslaan...')

    try {
      const result = await apiUpdateAdminSettings(user.token, {
        companyName: settingsForm.companyName,
        legalName: settingsForm.legalName || undefined,
        vatNumber: settingsForm.vatNumber || undefined,
        chamberOfCommerceNumber: settingsForm.chamberOfCommerceNumber || undefined,
        supportEmail: settingsForm.supportEmail || undefined,
        supportPhone: settingsForm.supportPhone || undefined,
        street: settingsForm.street || undefined,
        houseNumber: settingsForm.houseNumber || undefined,
        postalCode: settingsForm.postalCode || undefined,
        city: settingsForm.city || undefined,
        country: settingsForm.country || undefined,
        invoiceLogoUrl: settingsForm.invoiceLogoUrl || undefined,
        iban: settingsForm.iban || undefined,
        bic: settingsForm.bic || undefined,
        invoiceVatRateBasisPoints: Math.round((Number.parseFloat(settingsForm.invoiceVatRateBasisPoints) || 21) * 100),
        invoiceDueDays: Number.parseInt(settingsForm.invoiceDueDays, 10) || 14,
        invoiceFootnote: settingsForm.invoiceFootnote || undefined,
        termsText: settingsForm.termsText || undefined,
      })
      setSettings(result.settings)
      setSettingsForm(toSettingsForm(result.settings))
      window.dispatchEvent(new Event('ferdiek-site-config-updated'))
      setMessage('Bedrijfsgegevens opgeslagen.')
      setError('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Bedrijfsgegevens konden niet worden opgeslagen.')
    } finally {
      setIsSavingBusinessSettings(false)
      setAdminActionMessage('')
    }
  }

  const handleInvoiceLogoUpload = async (file: File) => {
    if (!user?.token) {
      return
    }

    setIsUploadingInvoiceLogo(true)
    setAdminActionMessage('Factuurlogo uploaden...')
    try {
      const result = await apiUploadInvoiceLogo(user.token, file)
      setSettingsForm((current) => ({
        ...current,
        invoiceLogoUrl: result.file.url,
      }))
      setMessage('Factuurlogo geupload. Sla de bedrijfsgegevens nog op om het logo actief te maken.')
      setError('')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Factuurlogo kon niet worden geupload.')
    } finally {
      setIsUploadingInvoiceLogo(false)
      setAdminActionMessage('')
    }
  }

  const handleRemoveInvoiceLogo = () => {
    setSettingsForm((current) => ({
      ...current,
      invoiceLogoUrl: '',
    }))
  }

  const handleDownloadAdminInvoice = async (orderId: string, invoiceNumber?: string) => {
    if (!user?.token) {
      return
    }

    try {
      setAdminActionMessage('Factuur downloaden...')
      await apiDownloadAdminInvoicePdf(user.token, orderId, invoiceNumber)
      setError('')
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Factuur kon niet worden gedownload.')
    } finally {
      setAdminActionMessage('')
    }
  }

  const handleSavePaymentSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user.token) {
      return
    }

    setIsSavingPaymentSettings(true)
    setAdminActionMessage('Betaalmethodes opslaan...')

    try {
      const result = await apiUpdateAdminSettings(user.token, {
        idealEnabled: settingsForm.idealEnabled,
        creditCardEnabled: settingsForm.creditCardEnabled,
        applePayEnabled: settingsForm.applePayEnabled,
        bancontactEnabled: settingsForm.bancontactEnabled,
        invoicePaymentEnabled: settingsForm.invoicePaymentEnabled,
      })
      setSettings(result.settings)
      setSettingsForm(toSettingsForm(result.settings))
      window.dispatchEvent(new Event('ferdiek-site-config-updated'))
      setMessage('Betaalmethodes opgeslagen.')
      setError('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Betaalmethodes konden niet worden opgeslagen.')
    } finally {
      setIsSavingPaymentSettings(false)
      setAdminActionMessage('')
    }
  }

  return (
    <AdminShell
      user={user}
      title={pageMeta.title}
      description={pageMeta.description}
      onLogout={onLogout}
      overlayMode={overlayMode}
      onCloseOverlay={onCloseOverlay}
      newTodayOrdersCount={newTodayOrders.length}
      onAcknowledgeNewOrders={acknowledgeNewOrders}
    >
      {error ? <div className="payment-feedback payment-feedback-error">{error}</div> : null}
      {message ? <div className="payment-feedback payment-feedback-success">{message}</div> : null}
      {busyMessage ? (
        <div className="admin-loading-popup" role="status" aria-live="polite">
          <span className="admin-loading-spinner" aria-hidden="true" />
          <div>
            <strong>{busyMessage}</strong>
            <span>Even geduld, de actie wordt verwerkt.</span>
          </div>
        </div>
      ) : null}

      {isLoading || !stats ? (
        <section className="admin-card">
          <p className="admin-muted">Admin-portaal wordt geladen...</p>
        </section>
      ) : (
        <Routes>
          <Route
            index
            element={
              <AdminDashboardPage
                token={user.token ?? ''}
                stats={stats}
                incomingOrders={incomingOrders}
                activeCarts={activeCarts}
                recentPageVisits={recentPageVisits}
                products={products}
                settings={settings}
              />
            }
          />
          <Route
            path="orders"
            element={
              <AdminOrdersPage
                orders={orders}
                drafts={orderDrafts}
                filter={ordersFilter}
                onFilterChange={setOrdersFilter}
                onDraftChange={handleOrderDraftChange}
                onSaveOrder={handleSaveOrder}
                onDownloadInvoice={handleDownloadAdminInvoice}
              />
            }
          />
          <Route
            path="customers"
            element={<AdminCustomersPage customers={customers} query={customerQuery} onQueryChange={setCustomerQuery} token={user.token} />}
          />
          <Route
            path="analytics"
            element={
              <div className="admin-card">
                <div className="admin-card-head">
                  <div>
                    <p className="eyebrow">Analytics</p>
                    <h2>Product &amp; bezoekers analytics</h2>
                  </div>
                </div>
                <div style={{ marginTop: 28 }}>
                  <AdminAnalytics token={user?.token ?? ''} />
                </div>
              </div>
            }
          />
          <Route
            path="newsletter"
            element={
              <div className="admin-card">
                <div className="admin-card-head">
                  <div>
                    <p className="eyebrow">Nieuwsbrief</p>
                    <h2>Abonnees beheren</h2>
                  </div>
                </div>
                <div style={{ marginTop: 28 }}>
                  <AdminNewsletter token={user?.token ?? ''} />
                </div>
              </div>
            }
          />
          <Route
            path="customers/:customerId"
            element={<AdminCustomersPage customers={customers} query={customerQuery} onQueryChange={setCustomerQuery} token={user.token} />}
          />
          <Route
            path="customers/:customerId/activity"
            element={<AdminCustomersPage customers={customers} query={customerQuery} onQueryChange={setCustomerQuery} token={user.token} />}
          />
          <Route
            path="products"
            element={
              <AdminProductsPage
                user={user}
                products={products}
                onProductsChange={(nextProducts) => {
                  setProducts(nextProducts)
                  setStats((current) => (current ? { ...current, products: nextProducts.length } : current))
                  setMessage('Productcatalogus bijgewerkt.')
                }}
              />
            }
          />
          <Route
            path="products/new"
            element={
              <AdminProductsPage
                user={user}
                products={products}
                onProductsChange={(nextProducts) => {
                  setProducts(nextProducts)
                  setStats((current) => (current ? { ...current, products: nextProducts.length } : current))
                  setMessage('Productcatalogus bijgewerkt.')
                }}
              />
            }
          />
          <Route
            path="products/:productId/edit"
            element={
              <AdminProductsPage
                user={user}
                products={products}
                onProductsChange={(nextProducts) => {
                  setProducts(nextProducts)
                  setStats((current) => (current ? { ...current, products: nextProducts.length } : current))
                  setMessage('Productcatalogus bijgewerkt.')
                }}
              />
            }
          />
          <Route
            path="media"
            element={user.token ? <AdminMediaLibrary token={user.token} canManage={user.role === 'OWNER'} /> : <Navigate to="/admin" replace />}
          />
          <Route path="seo" element={user.token ? <AdminSeoOverviewScreen token={user.token} /> : <Navigate to="/admin" replace />} />
          <Route
            path="seo/products/:productId"
            element={user.token ? <AdminProductSeoScreen token={user.token} canEdit={user.role === 'OWNER'} /> : <Navigate to="/admin" replace />}
          />
          <Route
            path="seo/pages/:pageKey"
            element={user.token ? <AdminSitePageSeoScreen token={user.token} canEdit={user.role === 'OWNER'} /> : <Navigate to="/admin" replace />}
          />
          <Route
            path="settings"
            element={
              <AdminSettingsPage
                form={settingsForm}
                settings={settings}
                isSavingBusiness={isSavingBusinessSettings}
                isSavingPaymentMethods={isSavingPaymentSettings}
                isUploadingLogo={isUploadingInvoiceLogo}
                onChange={handleSettingsChange}
                onLogoUpload={handleInvoiceLogoUpload}
                onLogoRemove={handleRemoveInvoiceLogo}
                onSaveBusiness={handleSaveBusinessSettings}
                onSavePaymentMethods={handleSavePaymentSettings}
              />
            }
          />
          <Route
            path="emails"
            element={user.token && user.role === 'OWNER' ? <AdminMailTemplatesScreen token={user.token} /> : <Navigate to="/admin" replace />}
          />
          <Route
            path="integrations"
            element={user.token && user.role === 'OWNER' ? <AdminIntegrationsScreen token={user.token} /> : <Navigate to="/admin" replace />}
          />
          <Route
            path="team"
            element={
              user.role === 'OWNER' ? (
                <AdminTeamPage users={users} form={employeeForm} onChange={handleEmployeeChange} onSubmit={handleCreateEmployee} />
              ) : (
                <Navigate to="/admin" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      )}
    </AdminShell>
  )
}
