import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { FiAlertCircle, FiArrowLeft, FiBarChart2, FiCheckCircle, FiChevronRight, FiCrosshair, FiExternalLink, FiGlobe, FiKey, FiLink2, FiMail, FiPackage, FiSearch, FiSave } from 'react-icons/fi'
import {
  apiAdminIntegrations,
  apiAdminProductSeo,
  apiAdminSeoOverview,
  apiAdminSitePageSeo,
  apiTestAdminMailRelay,
  apiUpdateAdminIntegrations,
  apiUpdateAdminProductSeo,
  apiUpdateAdminSitePageSeo,
  resolveApiAssetUrl,
  type AdminIntegrationSettingsPayload,
  type AdminSeoPayload,
  type ApiIntegrationSettings,
  type ApiProductSeoRecord,
  type ApiSeoCheck,
  type ApiSitePageSeoRecord,
} from '../api'
import { mediaFocusStyle } from '../mediaFocus'
import { resolveHomeContent, serializeHomeContent, type HomeContent } from '../homeContent'
import {
  isLegalContentPageKey,
  resolveLegalContent,
  serializeLegalContent,
  type LegalPageContent,
} from '../legalContent'
import FocalPointPickerModal from './FocalPointPickerModal'
import HomePageContentEditor from './HomePageContentEditor'
import { openShopPath } from './adminNavigation'
import LegalPageContentEditor from './LegalPageContentEditor'
import AdminSeoImageField from './AdminSeoImageField'

type SeoFormState = {
  metaTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  heroMobileImage: string
  heroFocalX: number
  heroFocalY: number
  canonicalPath: string
  keywords: string
  noIndex: boolean
}

type IntegrationFormState = {
  googleEnabled: boolean
  googleClientId: string
  mollieEnabled: boolean
  mollieApiKey: string
  mollieTestApiKey: string
  mollieMode: 'live' | 'test'
  mollieCreatePaymentEndpoint: string
  molliePaymentStatusEndpoint: string
  mollieReturnUrl: string
  mollieWebhookUrl: string
  mailRelayEnabled: boolean
  mailRelayProvider: 'smtp' | 'outlook'
  mailRelayHost: string
  mailRelayPort: string
  mailRelaySecure: boolean
  mailRelayUsername: string
  mailRelayPassword: string
  mailRelayFromEmail: string
  mailRelayFromName: string
  orderNotificationEmailEnabled: boolean
  orderNotificationPushEnabled: boolean
  orderNotificationRecipients: string
  mollieKeyVisible: boolean
}

function toSeoForm(record: ApiProductSeoRecord['seo'] | ApiSitePageSeoRecord['seo']): SeoFormState {
  return {
    metaTitle: record.metaTitle ?? '',
    metaDescription: record.metaDescription ?? '',
    ogTitle: record.ogTitle ?? '',
    ogDescription: record.ogDescription ?? '',
    ogImage: record.ogImage ?? '',
    heroMobileImage: record.heroMobileImage ?? '',
    heroFocalX: record.heroFocalX ?? 50,
    heroFocalY: record.heroFocalY ?? 50,
    canonicalPath: record.canonicalPath ?? '',
    keywords: record.keywords ?? '',
    noIndex: record.noIndex ?? false,
  }
}

function toSeoPayload(form: SeoFormState): AdminSeoPayload {
  return {
    metaTitle: form.metaTitle.trim() || undefined,
    metaDescription: form.metaDescription.trim() || undefined,
    ogTitle: form.ogTitle.trim() || undefined,
    ogDescription: form.ogDescription.trim() || undefined,
    ogImage: form.ogImage.trim() || undefined,
    heroMobileImage: form.heroMobileImage.trim() || undefined,
    heroFocalX: form.heroFocalX,
    heroFocalY: form.heroFocalY,
    canonicalPath: form.canonicalPath.trim() || undefined,
    keywords: form.keywords.trim() || undefined,
    noIndex: form.noIndex,
  }
}

function toSitePageSeoPayload(
  form: SeoFormState,
  options?: { homeContent?: HomeContent; legalContent?: LegalPageContent },
): AdminSeoPayload {
  return {
    ...toSeoPayload(form),
    ...(options?.homeContent ? { contentJson: serializeHomeContent(options.homeContent) } : {}),
    ...(options?.legalContent ? { contentJson: serializeLegalContent(options.legalContent) } : {}),
  }
}

function toIntegrationForm(settings: ApiIntegrationSettings): IntegrationFormState {
  return {
    googleEnabled: settings.googleEnabled,
    googleClientId: settings.googleClientId,
    mollieEnabled: settings.mollieEnabled,
    mollieApiKey: settings.mollieApiKey ?? '',
    mollieTestApiKey: settings.mollieTestApiKey ?? '',
    mollieMode: (settings.mollieMode ?? 'test') as 'live' | 'test',
    mollieCreatePaymentEndpoint: settings.mollieCreatePaymentEndpoint,
    molliePaymentStatusEndpoint: settings.molliePaymentStatusEndpoint,
    mollieReturnUrl: settings.mollieReturnUrl,
    mollieWebhookUrl: settings.mollieWebhookUrl,
    mailRelayEnabled: settings.mailRelayEnabled,
    mailRelayProvider: settings.mailRelayProvider === 'outlook' ? 'outlook' : 'smtp',
    mailRelayHost: settings.mailRelayHost,
    mailRelayPort: String(settings.mailRelayPort || 587),
    mailRelaySecure: settings.mailRelaySecure,
    mailRelayUsername: settings.mailRelayUsername,
    mailRelayPassword: settings.mailRelayPassword ?? '',
    mailRelayFromEmail: settings.mailRelayFromEmail,
    mailRelayFromName: settings.mailRelayFromName,
    orderNotificationEmailEnabled: settings.orderNotificationEmailEnabled,
    orderNotificationPushEnabled: settings.orderNotificationPushEnabled,
    orderNotificationRecipients: settings.orderNotificationRecipients,
    mollieKeyVisible: false,
  }
}

type IntegrationAccordionProps = {
  title: string
  icon: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
}

function IntegrationAccordion({ title, icon, open, onToggle, children }: IntegrationAccordionProps) {
  return (
    <div
      style={{
        border: '1px solid rgba(90,70,58,0.14)',
        borderRadius: 4,
        background: '#fff',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          border: 'none',
          background: open ? 'rgba(254,246,235,0.65)' : '#fff',
          cursor: 'pointer',
          textAlign: 'left',
          font: 'inherit',
          color: '#2b1f1a',
        }}
      >
        <FiChevronRight
          aria-hidden
          style={{
            flexShrink: 0,
            transition: 'transform 0.18s ease',
            transform: open ? 'rotate(90deg)' : 'none',
            color: 'rgba(43,31,26,0.45)',
          }}
        />
        <span style={{ color: '#c6a77a', display: 'flex' }}>{icon}</span>
        <strong style={{ fontSize: 15, fontWeight: 600 }}>{title}</strong>
      </button>
      {open ? (
        <div
          style={{
            padding: '18px 20px 22px',
            borderTop: '1px solid rgba(90,70,58,0.1)',
            display: 'grid',
            gap: 16,
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

function SeoScoreCard({ title, score, checks }: { title: string; score: number; checks: ApiSeoCheck[] }) {
  return (
    <aside className="admin-card">
      <div className="admin-card-head">
        <div>
          <p className="product-label">SEO score</p>
          <h2>{title}</h2>
        </div>
        <div className="seo-score-pill">
          <FiBarChart2 aria-hidden="true" />
          <strong>{score}/100</strong>
        </div>
      </div>
      <div className="admin-stack-list">
        {checks.map((check) => (
          <div key={check.key} className="admin-list-row">
            <div>
              <strong>{check.label}</strong>
              <span>{check.message}</span>
            </div>
            <span className={`seo-check-badge seo-check-${check.status}`}>
              {check.status === 'good' ? <FiCheckCircle aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}
            </span>
          </div>
        ))}
      </div>
    </aside>
  )
}

function SeoPreviewCard({
  title,
  description,
  canonicalPath,
}: {
  title: string
  description: string
  canonicalPath: string
}) {
  return (
    <aside className="admin-card">
      <p className="product-label">Preview</p>
      <div className="seo-preview-card">
        <strong>{title}</strong>
        <span>{canonicalPath}</span>
        <p>{description}</p>
      </div>
    </aside>
  )
}

function SeoFormFields({
  token,
  form,
  onTextChange,
  onToggleChange,
  onImageChange,
  showHeroFields = false,
  onOpenHeroFocal,
  canEdit,
  isSaving,
}: {
  token: string
  form: SeoFormState
  onTextChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onToggleChange: (event: ChangeEvent<HTMLInputElement>) => void
  onImageChange: (field: 'ogImage' | 'heroMobileImage', value: string) => void
  showHeroFields?: boolean
  onOpenHeroFocal?: () => void
  canEdit: boolean
  isSaving: boolean
}) {
  const heroDesktopPreview = resolveApiAssetUrl(form.ogImage)
  const heroMobilePreview = resolveApiAssetUrl(form.heroMobileImage) || heroDesktopPreview
  const heroFocusStyle = mediaFocusStyle(form.heroFocalX, form.heroFocalY)

  return (
    <div className="order-form admin-form-grid">
      {showHeroFields ? (
        <section className="admin-hero-seo-panel form-field-wide">
          <div className="admin-hero-seo-head">
            <div>
              <p className="product-label">Homepage hero</p>
              <h3>Hero-afbeelding & focus</h3>
              <p className="admin-muted">Pas hier de achtergrond van de homepage aan. Focus bepaalt welk deel zichtbaar blijft op desktop en mobiel.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canEdit || isSaving || !heroDesktopPreview}
              onClick={() => onOpenHeroFocal?.()}
            >
              <FiCrosshair aria-hidden="true" />
              Focus instellen
            </button>
          </div>
          <div className="admin-hero-seo-previews">
            <figure className="admin-hero-seo-preview">
              <div className="admin-hero-seo-preview-frame is-desktop">
                <img src={heroDesktopPreview || undefined} alt="" style={heroFocusStyle} />
              </div>
              <figcaption>Desktop hero</figcaption>
            </figure>
            <figure className="admin-hero-seo-preview">
              <div className="admin-hero-seo-preview-frame is-mobile">
                <img src={heroMobilePreview || undefined} alt="" style={heroFocusStyle} />
              </div>
              <figcaption>Mobiel hero</figcaption>
            </figure>
          </div>
          <AdminSeoImageField
            token={token}
            label="Hero afbeelding desktop"
            value={form.ogImage}
            disabled={!canEdit || isSaving}
            placeholder="Leeg = standaard hero"
            onChange={(value) => onImageChange('ogImage', value)}
          />
          <AdminSeoImageField
            token={token}
            label="Hero afbeelding mobiel (optioneel)"
            value={form.heroMobileImage}
            disabled={!canEdit || isSaving}
            placeholder="Leeg = desktop hero"
            onChange={(value) => onImageChange('heroMobileImage', value)}
          />
          <p className="admin-muted">Focus: {form.heroFocalX}% / {form.heroFocalY}%</p>
        </section>
      ) : null}
      <label className="form-field-wide">
        Meta title
        <input name="metaTitle" value={form.metaTitle} onChange={onTextChange} disabled={!canEdit || isSaving} />
      </label>
      <label className="form-field-wide">
        Meta description
        <textarea name="metaDescription" rows={4} value={form.metaDescription} onChange={onTextChange} disabled={!canEdit || isSaving} />
      </label>
      <label>
        OG title
        <input name="ogTitle" value={form.ogTitle} onChange={onTextChange} disabled={!canEdit || isSaving} />
      </label>
      <label>
        OG description
        <textarea name="ogDescription" rows={4} value={form.ogDescription} onChange={onTextChange} disabled={!canEdit || isSaving} />
      </label>
      {!showHeroFields ? (
        <AdminSeoImageField
          token={token}
          label="OG afbeelding"
          value={form.ogImage}
          disabled={!canEdit || isSaving}
          placeholder="Kies een afbeelding uit de mediabibliotheek"
          onChange={(value) => onImageChange('ogImage', value)}
        />
      ) : null}
      <label>
        Canonical pad
        <input name="canonicalPath" value={form.canonicalPath} onChange={onTextChange} disabled={!canEdit || isSaving} placeholder="/shop/voorbeeld" />
      </label>
      <label className="form-field-wide">
        Keywords
        <textarea name="keywords" rows={3} value={form.keywords} onChange={onTextChange} disabled={!canEdit || isSaving} />
      </label>
      <label className="product-admin-checkbox">
        <span>Noindex</span>
        <input type="checkbox" checked={form.noIndex} onChange={onToggleChange} disabled={!canEdit || isSaving} />
      </label>
    </div>
  )
}

export function AdminSeoOverviewScreen({ token }: { token: string }) {
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<ApiProductSeoRecord[]>([])
  const [pages, setPages] = useState<ApiSitePageSeoRecord[]>([])

  useEffect(() => {
    let cancelled = false

    void apiAdminSeoOverview(token)
      .then((result) => {
        if (cancelled) {
          return
        }

        setProducts(result.products)
        setPages(result.pages)
        setError('')
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'SEO-overzicht kon niet worden geladen.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const query = search.trim().toLowerCase()
  const visibleProducts = useMemo(
    () =>
      products.filter((entry) => {
        if (!query) {
          return true
        }

        return `${entry.name} ${entry.slug}`.toLowerCase().includes(query)
      }),
    [products, query],
  )
  const visiblePages = useMemo(
    () =>
      pages.filter((entry) => {
        if (!query) {
          return true
        }

        return `${entry.label} ${entry.path}`.toLowerCase().includes(query)
      }),
    [pages, query],
  )

  return (
    <div className="admin-page-grid">
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <p className="product-label">Pagina&apos;s</p>
            <h2>Beheer SEO en inhoud per pagina en product.</h2>
          </div>
        </div>
        <label className="admin-search-field">
          <FiSearch aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Zoek op productnaam, slug of pagina" />
        </label>
      </section>

      {error ? <section className="admin-card"><p className="admin-muted">{error}</p></section> : null}
      {isLoading ? <section className="admin-card"><p className="admin-muted">SEO-overzicht wordt geladen...</p></section> : null}

      {!isLoading ? (
        <>
          <section className="admin-card">
            <div className="admin-card-head">
              <div>
                <p className="product-label">Productpagina&apos;s</p>
                <h2>{visibleProducts.length} producten zichtbaar</h2>
              </div>
            </div>
            <div className="admin-stack-list">
              {visibleProducts.map((entry) => (
                <Link key={entry.productId} to={`/admin/seo/products/${entry.productId}`} className="admin-list-row admin-list-row-link">
                  <div>
                    <strong>{entry.name}</strong>
                    <span>{entry.slug}</span>
                  </div>
                  <div className="admin-list-row-meta">
                    <span className="success-badge">SEO {entry.score.score}/100</span>
                    <FiPackage aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-head">
              <div>
                <p className="product-label">Sitepagina&apos;s</p>
                <h2>{visiblePages.length} pagina&apos;s zichtbaar</h2>
              </div>
            </div>
            <div className="admin-stack-list">
              {visiblePages.map((entry) => (
                <Link key={entry.key} to={`/admin/seo/pages/${entry.key}`} className="admin-list-row admin-list-row-link">
                  <div>
                    <strong>{entry.label}</strong>
                    <span>{entry.path}</span>
                  </div>
                  <div className="admin-list-row-meta">
                    <span className="success-badge">SEO {entry.score.score}/100</span>
                    <FiGlobe aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

export function AdminProductSeoScreen({ token, canEdit }: { token: string; canEdit: boolean }) {
  const { productId } = useParams()
  const [record, setRecord] = useState<ApiProductSeoRecord | null>(null)
  const [form, setForm] = useState<SeoFormState | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!productId) {
      return
    }

    let cancelled = false

    void apiAdminProductSeo(token, productId)
      .then((result) => {
        if (cancelled) {
          return
        }

        setRecord(result.product)
        setForm(toSeoForm(result.product.seo))
        setError('')
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Product SEO kon niet worden geladen.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [productId, token])

  if (!productId) {
    return <Navigate to="/admin/seo" replace />
  }

  const handleTextChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((current) => (current ? { ...current, [name]: value } : current))
  }

  const handleToggleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => (current ? { ...current, noIndex: event.target.checked } : current))
  }

  const handleImageChange = (field: 'ogImage' | 'heroMobileImage', value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current))
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form || !canEdit) {
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const result = await apiUpdateAdminProductSeo(token, productId, toSeoPayload(form))
      setRecord(result.product)
      setForm(toSeoForm(result.product.seo))
      setMessage('Product SEO opgeslagen.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Product SEO kon niet worden opgeslagen.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-page-grid">
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <p className="product-label">Productpagina</p>
            <h2>{record?.name ?? 'Product laden'}</h2>
          </div>
          <div className="admin-actions-row">
            <Link className="btn btn-secondary" to="/admin/seo">
              <FiArrowLeft aria-hidden="true" />
              Terug naar pagina&apos;s
            </Link>
            {record?.slug ? (
              <button type="button" className="btn btn-secondary" onClick={() => openShopPath(`/shop/${record.slug}`)}>
                <FiExternalLink aria-hidden="true" />
                Bekijk in shop
              </button>
            ) : null}
          </div>
        </div>
        {error ? <div className="payment-feedback payment-feedback-error">{error}</div> : null}
        {message ? <div className="payment-feedback payment-feedback-success">{message}</div> : null}
        {isLoading || !record || !form ? <p className="admin-muted">Product SEO wordt geladen...</p> : null}
        {!isLoading && record && form ? (
          <form onSubmit={(event) => void handleSave(event)}>
            <SeoFormFields
              token={token}
              form={form}
              onTextChange={handleTextChange}
              onToggleChange={handleToggleChange}
              onImageChange={handleImageChange}
              canEdit={canEdit}
              isSaving={isSaving}
            />
            <div className="admin-actions-row form-field-wide">
              <span className="admin-muted">Route: `/shop/{record.slug}`</span>
              <button type="submit" className="btn btn-primary" disabled={!canEdit || isSaving}>
                <FiSave aria-hidden="true" />
                {isSaving ? 'Opslaan...' : 'SEO opslaan'}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      {record ? (
        <>
          <SeoScoreCard title={`SEO score voor ${record.name}`} score={record.score.score} checks={record.score.checks} />
          <SeoPreviewCard
            title={record.effective.metaTitle}
            description={record.effective.metaDescription}
            canonicalPath={record.effective.canonicalPath}
          />
        </>
      ) : null}
    </div>
  )
}

export function AdminSitePageSeoScreen({ token, canEdit }: { token: string; canEdit: boolean }) {
  const { pageKey } = useParams()
  const [record, setRecord] = useState<ApiSitePageSeoRecord | null>(null)
  const [form, setForm] = useState<SeoFormState | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [heroFocalOpen, setHeroFocalOpen] = useState(false)
  const [homeContent, setHomeContent] = useState<HomeContent>(() => resolveHomeContent(null))
  const [legalContent, setLegalContent] = useState<LegalPageContent | null>(null)

  useEffect(() => {
    if (!pageKey) {
      return
    }

    let cancelled = false

    void apiAdminSitePageSeo(token, pageKey)
      .then((result) => {
        if (cancelled) {
          return
        }

        setRecord(result.page)
        setForm(toSeoForm(result.page.seo))
        setHomeContent(resolveHomeContent(result.page))
        setLegalContent(isLegalContentPageKey(result.page.key) ? resolveLegalContent(result.page.key, result.page) : null)
        setError('')
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Pagina SEO kon niet worden geladen.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [pageKey, token])

  if (!pageKey) {
    return <Navigate to="/admin/seo" replace />
  }

  const handleTextChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((current) => (current ? { ...current, [name]: value } : current))
  }

  const handleToggleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => (current ? { ...current, noIndex: event.target.checked } : current))
  }

  const handleImageChange = (field: 'ogImage' | 'heroMobileImage', value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current))
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form || !canEdit) {
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const result = await apiUpdateAdminSitePageSeo(
        token,
        pageKey,
        pageKey === 'home'
          ? toSitePageSeoPayload(form, { homeContent })
          : isLegalContentPageKey(pageKey) && legalContent
            ? toSitePageSeoPayload(form, { legalContent })
            : toSeoPayload(form),
      )
      setRecord(result.page)
      setForm(toSeoForm(result.page.seo))
      if (pageKey === 'home') {
        setHomeContent(resolveHomeContent(result.page))
      }
      if (isLegalContentPageKey(pageKey)) {
        setLegalContent(resolveLegalContent(pageKey, result.page))
      }
      setMessage('Pagina SEO opgeslagen.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Pagina SEO kon niet worden opgeslagen.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-page-grid">
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <p className="product-label">Sitepagina</p>
            <h2>{record?.label ?? 'Pagina laden'}</h2>
          </div>
          <div className="admin-actions-row">
            <Link className="btn btn-secondary" to="/admin/seo">
              <FiArrowLeft aria-hidden="true" />
              Terug naar pagina&apos;s
            </Link>
            {record?.path ? (
              <button type="button" className="btn btn-secondary" onClick={() => openShopPath(record.path)}>
                <FiExternalLink aria-hidden="true" />
                Bekijk pagina
              </button>
            ) : null}
          </div>
        </div>
        {error ? <div className="payment-feedback payment-feedback-error">{error}</div> : null}
        {message ? <div className="payment-feedback payment-feedback-success">{message}</div> : null}
        {record?.key === 'shop' ? (
          <div className="portal-note">
            <strong>Shop hero</strong>
            <span>De SEO titel, omschrijving en OG-afbeelding worden ook gebruikt voor de hero bovenaan de shoppagina.</span>
          </div>
        ) : null}
        {record?.key === 'home' ? (
          <div className="portal-note">
            <strong>Home hero</strong>
            <span>Hero-afbeelding, mobiele variant en focus stel je hieronder in onder &quot;Homepage hero&quot;.</span>
          </div>
        ) : null}
        {isLoading || !record || !form ? <p className="admin-muted">Pagina SEO wordt geladen...</p> : null}
        {!isLoading && record && form ? (
          <form onSubmit={(event) => void handleSave(event)}>
            <SeoFormFields
              token={token}
              form={form}
              onTextChange={handleTextChange}
              onToggleChange={handleToggleChange}
              onImageChange={handleImageChange}
              showHeroFields={record.key === 'home'}
              onOpenHeroFocal={() => setHeroFocalOpen(true)}
              canEdit={canEdit}
              isSaving={isSaving}
            />
            {record.key === 'home' ? (
              <HomePageContentEditor token={token} content={homeContent} onChange={setHomeContent} disabled={!canEdit || isSaving} />
            ) : null}
            {legalContent && record.key && isLegalContentPageKey(record.key) ? (
              <LegalPageContentEditor content={legalContent} onChange={setLegalContent} disabled={!canEdit || isSaving} />
            ) : null}
            <div className="admin-actions-row form-field-wide">
              <span className="admin-muted">Route: `{record.path}`</span>
              <button type="submit" className="btn btn-primary" disabled={!canEdit || isSaving}>
                <FiSave aria-hidden="true" />
                {isSaving ? 'Opslaan...' : 'SEO opslaan'}
              </button>
            </div>
          </form>
        ) : null}
        {form && record?.key === 'home' ? (
          <FocalPointPickerModal
            open={heroFocalOpen}
            imageSrc={resolveApiAssetUrl(form.ogImage)}
            alt="Homepage hero"
            title="Homepage hero focus"
            focalX={form.heroFocalX}
            focalY={form.heroFocalY}
            previews={[
              { label: 'Home hero desktop', aspectRatio: 16 / 9 },
              { label: 'Home hero mobiel', aspectRatio: 9 / 16 },
              { label: 'Shop kaart', aspectRatio: 4 / 4.65 },
            ]}
            onClose={() => setHeroFocalOpen(false)}
            onSave={(heroFocalX, heroFocalY) => {
              setForm((current) => (current ? { ...current, heroFocalX, heroFocalY } : current))
            }}
          />
        ) : null}
      </section>

      {record ? (
        <>
          <SeoScoreCard title={`SEO score voor ${record.label}`} score={record.score.score} checks={record.score.checks} />
          <SeoPreviewCard
            title={record.effective.metaTitle}
            description={record.effective.metaDescription}
            canonicalPath={record.effective.canonicalPath}
          />
        </>
      ) : null}
    </div>
  )
}

export function AdminIntegrationsScreen({ token }: { token: string }) {
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<IntegrationFormState | null>(null)
  const [settings, setSettings] = useState<ApiIntegrationSettings | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<'google' | 'mollie-status' | 'mollie-keys' | 'mollie-urls' | 'mailrelay' | 'mailrelay-test' | null>(null)
  const [mailRelayTestRecipient, setMailRelayTestRecipient] = useState('')

  const [openGoogle, setOpenGoogle] = useState(false)
  const [openMollie, setOpenMollie] = useState(false)
  const [openMailRelay, setOpenMailRelay] = useState(false)
  const [openMollieStatus, setOpenMollieStatus] = useState(false)
  const [openMollieKeys, setOpenMollieKeys] = useState(false)
  const [openMollieUrls, setOpenMollieUrls] = useState(false)

  useEffect(() => {
    let cancelled = false

    void apiAdminIntegrations(token)
      .then((result) => {
        if (cancelled) {
          return
        }

        setSettings(result.integrations)
        setForm(toIntegrationForm(result.integrations))
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Integraties konden niet worden geladen.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((current) => (current ? { ...current, [name]: value } : current))
  }

  const handleToggleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target
    setForm((current) => (current ? { ...current, [name]: checked } : current))
  }

  const savePartial = async (
    key: 'google' | 'mollie-status' | 'mollie-keys' | 'mollie-urls' | 'mailrelay',
    payload: AdminIntegrationSettingsPayload,
    successMessage: string,
  ) => {
    if (!form) {
      return
    }

    setSavingKey(key)
    setError('')
    setMessage('')

    try {
      const result = await apiUpdateAdminIntegrations(token, payload)
      setSettings(result.integrations)
      setForm(toIntegrationForm(result.integrations))
      setMessage(successMessage)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Opslaan mislukt.')
    } finally {
      setSavingKey(null)
    }
  }

  const query = search.trim().toLowerCase()
  const showGoogle =
    !query ||
    'google google login client id oauth'.includes(query) ||
    query.split(' ').every((part) => 'google client id oauth login'.includes(part))
  const showMollie =
    !query ||
    'mollie betaling endpoint webhook return url status api sleutel'.includes(query) ||
    query.split(' ').every((part) => 'mollie betaling endpoint webhook return url status api sleutel'.includes(part))
  const showMailRelay =
    !query ||
    'mail mailrelay smtp outlook email e-mail monitor test factuur'.includes(query) ||
    query.split(' ').every((part) => 'mail mailrelay smtp outlook email e-mail monitor test factuur'.includes(part))

  const handleMailRelayTest = async () => {
    setSavingKey('mailrelay-test')
    setError('')
    setMessage('')

    try {
      const result = await apiTestAdminMailRelay(token, mailRelayTestRecipient.trim() || undefined)
      setSettings(result.integrations)
      setForm(toIntegrationForm(result.integrations))
      setMessage(result.integrations.mailRelayLastMessage || 'Mailrelay test succesvol.')
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : 'Mailrelay test mislukt.')
      void apiAdminIntegrations(token).then((result) => {
        setSettings(result.integrations)
        setForm(toIntegrationForm(result.integrations))
      }).catch(() => {})
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="admin-page-grid">
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <p className="product-label">Integraties</p>
            <h2>Google login en Mollie — open een blok, pas aan, sla per onderdeel op.</h2>
          </div>
        </div>
        <label className="admin-search-field">
          <FiSearch aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Zoek in integraties of velden" />
        </label>
        <p className="admin-muted" style={{ marginTop: 8 }}>
          Laatste update:{' '}
          {settings ? new Date(settings.updatedAt).toLocaleString('nl-NL') : 'nog niet beschikbaar'}
        </p>
        {error ? <div className="payment-feedback payment-feedback-error">{error}</div> : null}
        {message ? <div className="payment-feedback payment-feedback-success">{message}</div> : null}
        {isLoading || !form ? <p className="admin-muted">Integraties worden geladen...</p> : null}

        {!isLoading && form ? (
          <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
            {showGoogle ? (
              <IntegrationAccordion
                title="Google login"
                icon={<FiKey aria-hidden="true" />}
                open={openGoogle}
                onToggle={() => setOpenGoogle((v) => !v)}
              >
                <label className="product-admin-checkbox">
                  <span>Google login actief</span>
                  <input type="checkbox" name="googleEnabled" checked={form.googleEnabled} onChange={handleToggleChange} />
                </label>
                <label className="form-field-wide">
                  Google Client ID
                  <input name="googleClientId" value={form.googleClientId} onChange={handleTextChange} placeholder="apps.googleusercontent.com" />
                </label>
                <div className="admin-actions-row" style={{ marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={savingKey !== null}
                    onClick={() =>
                      void savePartial(
                        'google',
                        {
                          googleEnabled: form.googleEnabled,
                          googleClientId: form.googleClientId.trim() || undefined,
                        },
                        'Google login opgeslagen.',
                      )
                    }
                  >
                    <FiSave aria-hidden="true" />
                    {savingKey === 'google' ? 'Opslaan...' : 'Google opslaan'}
                  </button>
                </div>
              </IntegrationAccordion>
            ) : null}

            {showMollie ? (
              <IntegrationAccordion
                title="Mollie"
                icon={<FiLink2 aria-hidden="true" />}
                open={openMollie}
                onToggle={() => setOpenMollie((v) => !v)}
              >
                <div style={{ display: 'grid', gap: 12 }}>
                  <IntegrationAccordion
                    title="Betaling aan of uit"
                    icon={<FiLink2 aria-hidden="true" />}
                    open={openMollieStatus}
                    onToggle={() => setOpenMollieStatus((v) => !v)}
                  >
                    <label className="product-admin-checkbox">
                      <span>Mollie actief</span>
                      <input type="checkbox" name="mollieEnabled" checked={form.mollieEnabled} onChange={handleToggleChange} />
                    </label>
                    <div className="admin-actions-row" style={{ marginTop: 4 }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={savingKey !== null}
                        onClick={() =>
                          void savePartial(
                            'mollie-status',
                            { mollieEnabled: form.mollieEnabled, mollieMode: form.mollieMode ?? 'test' },
                            'Mollie-status opgeslagen.',
                          )
                        }
                      >
                        <FiSave aria-hidden="true" />
                        {savingKey === 'mollie-status' ? 'Opslaan...' : 'Status opslaan'}
                      </button>
                    </div>
                  </IntegrationAccordion>

                  <IntegrationAccordion
                    title="API-sleutels"
                    icon={<FiKey aria-hidden="true" />}
                    open={openMollieKeys}
                    onToggle={() => setOpenMollieKeys((v) => !v)}
                  >
                    <div style={{ display: 'grid', gap: 16, padding: '16px', border: '1px solid rgba(90,70,58,0.12)', borderRadius: 4, background: 'rgba(254,246,235,0.45)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <p style={{ margin: 0, fontSize: 13, color: 'rgba(43,31,26,0.65)' }}>
                          Sleutels op{' '}
                          <a href="https://dashboard.mollie.com" target="_blank" rel="noopener" style={{ color: '#c6a77a' }}>
                            dashboard.mollie.com
                          </a>{' '}
                          → Developers → API sleutels
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(43,31,26,0.5)' }}>
                            Modus
                          </span>
                          <button
                            type="button"
                            onClick={() => setForm((c) => (c ? { ...c, mollieMode: c.mollieMode === 'live' ? 'test' : 'live' } : c))}
                            style={{
                              padding: '5px 14px',
                              borderRadius: 3,
                              border: '1px solid',
                              fontSize: 12,
                              fontWeight: 600,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                              background: form.mollieMode === 'live' ? '#5A463A' : '#c6a77a',
                              color: '#FEF6EB',
                              borderColor: form.mollieMode === 'live' ? '#5A463A' : '#c6a77a',
                            }}
                          >
                            {form.mollieMode === 'live' ? 'Live' : 'Test'}
                          </button>
                        </div>
                      </div>
                      <p className="admin-muted" style={{ margin: 0 }}>
                        Zet modus op Live en klik op <strong>API-sleutels opslaan</strong> zodat de live-sleutel (`live_...`) actief wordt.
                      </p>

                      <label style={{ display: 'grid', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(43,31,26,0.65)' }}>
                          Test API sleutel <span style={{ color: '#c6a77a', fontFamily: 'monospace' }}>(test_...)</span>
                        </span>
                        <input
                          type="password"
                          name="mollieTestApiKey"
                          value={form.mollieTestApiKey || ''}
                          onChange={handleTextChange}
                          placeholder="test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          autoComplete="off"
                          style={{ padding: '10px 12px', border: '1px solid rgba(90,70,58,0.18)', borderRadius: 3, fontSize: 13, fontFamily: 'monospace', background: '#fff', width: '100%' }}
                        />
                      </label>

                      <label style={{ display: 'grid', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(43,31,26,0.65)' }}>
                          Live API sleutel <span style={{ color: '#c6a77a', fontFamily: 'monospace' }}>(live_...)</span>
                        </span>
                        <input
                          type="password"
                          name="mollieApiKey"
                          value={form.mollieApiKey || ''}
                          onChange={handleTextChange}
                          placeholder="live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          autoComplete="off"
                          style={{ padding: '10px 12px', border: '1px solid rgba(90,70,58,0.18)', borderRadius: 3, fontSize: 13, fontFamily: 'monospace', background: '#fff', width: '100%' }}
                        />
                      </label>

                      <p style={{ margin: 0, padding: '10px 14px', background: 'rgba(90,70,58,0.06)', borderRadius: 3, fontSize: 13, color: 'rgba(43,31,26,0.65)' }}>
                        Sleutels worden server-side opgeslagen. De gekozen modus bepaalt welke sleutel de shop gebruikt.
                      </p>
                    </div>
                    <div className="admin-actions-row" style={{ marginTop: 4 }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={savingKey !== null}
                        onClick={() =>
                          void savePartial(
                            'mollie-keys',
                            {
                              mollieApiKey: form.mollieApiKey.trim() || undefined,
                              mollieTestApiKey: form.mollieTestApiKey.trim() || undefined,
                              mollieMode: form.mollieMode ?? 'test',
                            },
                            'Mollie API-sleutels opgeslagen.',
                          )
                        }
                      >
                        <FiSave aria-hidden="true" />
                        {savingKey === 'mollie-keys' ? 'Opslaan...' : 'API-sleutels opslaan'}
                      </button>
                    </div>
                  </IntegrationAccordion>

                  <IntegrationAccordion
                    title="Endpoints (automatisch)"
                    icon={<FiGlobe aria-hidden="true" />}
                    open={openMollieUrls}
                    onToggle={() => setOpenMollieUrls((v) => !v)}
                  >
                    <p className="admin-muted" style={{ margin: 0 }}>
                      Deze URLs worden automatisch afgeleid van je server (.env: PUBLIC_API_URL en FRONTEND_URL).
                      Checkout en status volgen altijd het huidige domein in de browser.
                    </p>
                    <div className="admin-stack-list" style={{ marginTop: 12 }}>
                      <div className="admin-list-row">
                        <strong>Create payment</strong>
                        <span>{form.mollieCreatePaymentEndpoint}</span>
                      </div>
                      <div className="admin-list-row">
                        <strong>Payment status</strong>
                        <span>{form.molliePaymentStatusEndpoint}</span>
                      </div>
                      <div className="admin-list-row">
                        <strong>Return URL</strong>
                        <span>{form.mollieReturnUrl}</span>
                      </div>
                      <div className="admin-list-row">
                        <strong>Webhook</strong>
                        <span>{form.mollieWebhookUrl}</span>
                      </div>
                    </div>
                  </IntegrationAccordion>
                </div>
              </IntegrationAccordion>
            ) : null}

            {showMailRelay ? (
              <IntegrationAccordion
                title="Mailrelay"
                icon={<FiMail aria-hidden="true" />}
                open={openMailRelay}
                onToggle={() => setOpenMailRelay((v) => !v)}
              >
                <p className="admin-muted" style={{ margin: 0 }}>
                  Stel SMTP of Outlook cloud mail in voor facturen, wachtwoordherstel en systeemmails. Alleen de eigenaar kan dit beheren.
                </p>
                <label className="product-admin-checkbox">
                  <span>Mailrelay actief</span>
                  <input type="checkbox" name="mailRelayEnabled" checked={form.mailRelayEnabled} onChange={handleToggleChange} />
                </label>
                <label className="form-field-wide">
                  Provider
                  <select
                    name="mailRelayProvider"
                    value={form.mailRelayProvider}
                    onChange={(event) => setForm((current) => (current ? { ...current, mailRelayProvider: event.target.value as 'smtp' | 'outlook' } : current))}
                  >
                    <option value="smtp">SMTP / IMAP provider</option>
                    <option value="outlook">Outlook / Microsoft 365</option>
                  </select>
                </label>
                <div className="form-grid">
                  <label>
                    SMTP host
                    <input name="mailRelayHost" value={form.mailRelayHost} onChange={handleTextChange} placeholder={form.mailRelayProvider === 'outlook' ? 'smtp.office365.com' : 'smtp.provider.nl'} />
                  </label>
                  <label>
                    Poort
                    <input name="mailRelayPort" value={form.mailRelayPort} onChange={handleTextChange} inputMode="numeric" placeholder="587" />
                  </label>
                </div>
                <label className="product-admin-checkbox">
                  <span>SSL direct gebruiken</span>
                  <input type="checkbox" name="mailRelaySecure" checked={form.mailRelaySecure} onChange={handleToggleChange} />
                </label>
                <div className="form-grid">
                  <label>
                    Gebruiker / e-mailadres
                    <input name="mailRelayUsername" value={form.mailRelayUsername} onChange={handleTextChange} autoComplete="off" />
                  </label>
                  <label>
                    Wachtwoord / app password
                    <input type="password" name="mailRelayPassword" value={form.mailRelayPassword} onChange={handleTextChange} autoComplete="new-password" />
                  </label>
                </div>
                <div className="form-grid">
                  <label>
                    Afzender e-mail
                    <input name="mailRelayFromEmail" value={form.mailRelayFromEmail} onChange={handleTextChange} placeholder="factuur@ferdiek.com" />
                  </label>
                  <label>
                    Afzender naam
                    <input name="mailRelayFromName" value={form.mailRelayFromName} onChange={handleTextChange} placeholder="FERDIEK" />
                  </label>
                </div>
                <div className="portal-note">
                  <strong>Nieuwe bestellingen</strong>
                  <span>Kies of de eigenaar direct een melding krijgt zodra er een bestelling binnenkomt.</span>
                </div>
                <label className="product-admin-checkbox">
                  <span>E-mail notificatie bij elke bestelling</span>
                  <input type="checkbox" name="orderNotificationEmailEnabled" checked={form.orderNotificationEmailEnabled} onChange={handleToggleChange} />
                </label>
                <label className="product-admin-checkbox">
                  <span>Push notificatie bij elke bestelling</span>
                  <input type="checkbox" name="orderNotificationPushEnabled" checked={form.orderNotificationPushEnabled} onChange={handleToggleChange} />
                </label>
                <label className="form-field-wide">
                  Ontvangers voor ordermails
                  <input
                    name="orderNotificationRecipients"
                    value={form.orderNotificationRecipients}
                    onChange={handleTextChange}
                    placeholder="owner@ferdiek.com, administratie@ferdiek.com"
                  />
                </label>
                <div className="admin-actions-row" style={{ marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={savingKey !== null}
                    onClick={() =>
                      void savePartial(
                        'mailrelay',
                        {
                          mailRelayEnabled: form.mailRelayEnabled,
                          mailRelayProvider: form.mailRelayProvider,
                          mailRelayHost: form.mailRelayHost.trim() || undefined,
                          mailRelayPort: Number.parseInt(form.mailRelayPort, 10) || undefined,
                          mailRelaySecure: form.mailRelaySecure,
                          mailRelayUsername: form.mailRelayUsername.trim() || undefined,
                          mailRelayPassword: form.mailRelayPassword.trim() || undefined,
                          mailRelayFromEmail: form.mailRelayFromEmail.trim() || undefined,
                          mailRelayFromName: form.mailRelayFromName.trim() || undefined,
                          orderNotificationEmailEnabled: form.orderNotificationEmailEnabled,
                          orderNotificationPushEnabled: form.orderNotificationPushEnabled,
                          orderNotificationRecipients: form.orderNotificationRecipients.trim() || undefined,
                        },
                        'Mailrelay opgeslagen.',
                      )
                    }
                  >
                    <FiSave aria-hidden="true" />
                    {savingKey === 'mailrelay' ? 'Opslaan...' : 'Mailrelay opslaan'}
                  </button>
                </div>
                <div className="portal-note">
                  <strong>Monitor</strong>
                  <span>
                    Laatste test: {settings?.mailRelayLastTestAt ? new Date(settings.mailRelayLastTestAt).toLocaleString('nl-NL') : 'nog niet getest'}
                  </span>
                  <span>Status: {settings?.mailRelayLastStatus === 'success' ? 'Werkend' : settings?.mailRelayLastStatus === 'error' ? 'Fout' : 'Onbekend'}</span>
                  {settings?.mailRelayLastMessage ? <span>{settings.mailRelayLastMessage}</span> : null}
                </div>
                <div className="form-grid">
                  <label>
                    Testontvanger
                    <input value={mailRelayTestRecipient} onChange={(event) => setMailRelayTestRecipient(event.target.value)} placeholder={form.mailRelayFromEmail || form.mailRelayUsername || 'test@email.nl'} />
                  </label>
                  <div className="admin-actions-row" style={{ alignItems: 'end' }}>
                    <button type="button" className="btn btn-secondary" disabled={savingKey !== null} onClick={() => void handleMailRelayTest()}>
                      <FiMail aria-hidden="true" />
                      {savingKey === 'mailrelay-test' ? 'Testen...' : 'Testmail verzenden'}
                    </button>
                  </div>
                </div>
              </IntegrationAccordion>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="admin-card">
        <p className="product-label">Status</p>
        <div className="admin-stack-list">
          <div className="admin-list-row">
            <div>
              <strong>Google login</strong>
              <span>{settings?.googleClientId ? 'Client ID aanwezig' : 'Client ID ontbreekt'}</span>
            </div>
            <span className="success-badge">{settings?.googleEnabled ? 'Actief' : 'Uit'}</span>
          </div>
          <div className="admin-list-row">
            <div>
              <strong>Mollie</strong>
              <span>{settings?.mollieCreatePaymentEndpoint ? 'Endpoints gekoppeld' : 'Nog niet gekoppeld'}</span>
            </div>
            <span className="success-badge">{settings?.mollieEnabled ? 'Actief' : 'Uit'}</span>
          </div>
          <div className="admin-list-row">
            <div>
              <strong>Mailrelay</strong>
              <span>
                {settings?.mailRelayLastTestAt
                  ? `Laatste test ${new Date(settings.mailRelayLastTestAt).toLocaleString('nl-NL')}`
                  : 'Nog niet getest'}
              </span>
              <span>
                Ordermelding: {settings?.orderNotificationEmailEnabled ? 'per e-mail' : 'e-mail uit'}
                {settings?.orderNotificationPushEnabled ? ' · push aan' : ''}
              </span>
            </div>
            <span className={settings?.mailRelayLastStatus === 'error' ? 'success-badge is-warning' : 'success-badge'}>
              {settings?.mailRelayEnabled ? (settings.mailRelayLastStatus === 'success' ? 'Werkend' : 'Actief') : 'Uit'}
            </span>
          </div>
          {settings?.mollieCreatePaymentEndpoint ? (
            <a className="admin-list-row admin-list-row-link" href={settings.mollieCreatePaymentEndpoint} target="_blank" rel="noreferrer">
              <div>
                <strong>Open gekoppelde create endpoint</strong>
                <span>{settings.mollieCreatePaymentEndpoint}</span>
              </div>
              <FiExternalLink aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </section>
    </div>
  )
}
