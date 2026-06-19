import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { FiCheck, FiCopy, FiEdit2, FiExternalLink, FiMaximize2, FiRefreshCw, FiSearch, FiTrash2, FiUpload, FiX } from 'react-icons/fi'
import {
  apiDeleteAdminMediaAsset,
  apiRenameAdminMediaAsset,
  apiUploadProductImage,
  resolveApiAssetUrl,
  type ApiManagedMediaAsset,
} from '../api'
import { siteMediaLibrary, type SiteMediaAsset } from '../brandMedia'
import { clearAdminMediaLibraryCache, getCachedAdminMediaLibrary, loadAdminMediaLibraryCached, preloadAdminMediaImages } from '../adminMediaCache'
import AdminImagePreviewModal, { type AdminImagePreview } from './AdminImagePreviewModal'
import AdminOptimizedImage from './AdminOptimizedImage'

type AdminMediaLibraryProps = {
  token: string
  canManage: boolean
}

type MediaGalleryItem = {
  id: string
  kind: 'site' | 'managed'
  filename: string
  alt: string
  src: string
  copyValue: string
  sourceLabel: string
  detailLabel: string
  referenceLabel?: string
  managedAsset?: ApiManagedMediaAsset
}

const ADMIN_MEDIA_PAGE_SIZE = 24

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatManagedReferenceLabel(asset: ApiManagedMediaAsset) {
  const parts = [
    asset.references.products ? `${asset.references.products} product` : null,
    asset.references.seo ? `${asset.references.seo} SEO` : null,
    asset.references.settings ? `${asset.references.settings} instelling` : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' · ') : 'Ongebruikt'
}

function matchesQuery(asset: { filename: string; alt?: string }, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  return `${asset.filename} ${asset.alt ?? ''}`.toLowerCase().includes(normalized)
}

export default function AdminMediaLibrary({ token, canManage }: AdminMediaLibraryProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [managedAssets, setManagedAssets] = useState<ApiManagedMediaAsset[]>(() => getCachedAdminMediaLibrary(token) ?? [])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingUrl, setDeletingUrl] = useState('')
  const [renamingUrl, setRenamingUrl] = useState('')
  const [renameDraft, setRenameDraft] = useState('')
  const [savingRenameUrl, setSavingRenameUrl] = useState('')
  const [preview, setPreview] = useState<AdminImagePreview | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadMediaLibrary = useCallback(async (options?: { force?: boolean }) => {
    setIsLoading(true)
    try {
      const assets = await loadAdminMediaLibraryCached(token, options)
      setManagedAssets(assets)
      setError('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Mediabibliotheek kon niet worden geladen.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadMediaLibrary()
  }, [loadMediaLibrary])

  const mediaItems = useMemo<MediaGalleryItem[]>(() => {
    const siteItems = siteMediaLibrary.map((asset: SiteMediaAsset) => ({
      id: `site-${asset.id}`,
      kind: 'site' as const,
      filename: asset.filename,
      alt: asset.alt,
      src: asset.src,
      copyValue: asset.src,
      sourceLabel: 'Sitebeeld',
      detailLabel: 'Gebundeld in de website',
    }))

    const uploadItems = managedAssets.map((asset) => ({
      id: `managed-${asset.section}-${asset.filename}`,
      kind: 'managed' as const,
      filename: asset.filename,
      alt: asset.filename,
      src: resolveApiAssetUrl(asset.url),
      copyValue: asset.url,
      sourceLabel: asset.section === 'branding' ? 'Branding upload' : 'Product upload',
      detailLabel: formatBytes(asset.size),
      referenceLabel: formatManagedReferenceLabel(asset),
      managedAsset: asset,
    }))

    return [...uploadItems, ...siteItems]
  }, [managedAssets])

  const filteredMediaItems = useMemo(
    () => mediaItems.filter((asset) => matchesQuery(asset, query)),
    [mediaItems, query],
  )
  const visibleMediaItems = useMemo(
    () => filteredMediaItems.slice((page - 1) * ADMIN_MEDIA_PAGE_SIZE, page * ADMIN_MEDIA_PAGE_SIZE),
    [filteredMediaItems, page],
  )
  const pageCount = Math.max(1, Math.ceil(filteredMediaItems.length / ADMIN_MEDIA_PAGE_SIZE))
  const isInitialLoading = isLoading && managedAssets.length === 0

  useEffect(() => {
    setPage(1)
  }, [query])

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount)
    }
  }, [page, pageCount])

  useEffect(() => {
    preloadAdminMediaImages(visibleMediaItems.map((asset) => asset.src), ADMIN_MEDIA_PAGE_SIZE)
  }, [visibleMediaItems])

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length || !canManage) {
      return
    }

    setIsUploading(true)
    setMessage('')
    setError('')

    try {
      await Promise.all(files.map((file) => apiUploadProductImage(token, file)))
      await loadMediaLibrary({ force: true })
      setMessage(files.length === 1 ? 'Afbeelding toegevoegd.' : `${files.length} afbeeldingen toegevoegd.`)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Afbeeldingen konden niet worden geupload.')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setMessage('Link gekopieerd.')
      setError('')
    } catch {
      setError('Kopieren is niet gelukt.')
    }
  }

  const handleDelete = async (asset: ApiManagedMediaAsset) => {
    if (!canManage || !asset.removable) {
      return
    }

    const confirmed = window.confirm(`Verwijder ${asset.filename}?`)
    if (!confirmed) {
      return
    }

    setDeletingUrl(asset.url)
    setMessage('')
    setError('')

    try {
      await apiDeleteAdminMediaAsset(token, asset.url)
      clearAdminMediaLibraryCache()
      await loadMediaLibrary({ force: true })
      setMessage('Afbeelding verwijderd.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Afbeelding kon niet worden verwijderd.')
    } finally {
      setDeletingUrl('')
    }
  }

  const startRename = (asset: ApiManagedMediaAsset) => {
    setRenamingUrl(asset.url)
    setRenameDraft(asset.filename)
    setMessage('')
    setError('')
  }

  const cancelRename = () => {
    setRenamingUrl('')
    setRenameDraft('')
    setSavingRenameUrl('')
  }

  const handleRename = async (asset: ApiManagedMediaAsset) => {
    const nextFilename = renameDraft.trim()
    if (!canManage || !nextFilename || nextFilename === asset.filename) {
      cancelRename()
      return
    }

    setSavingRenameUrl(asset.url)
    setMessage('')
    setError('')

    try {
      await apiRenameAdminMediaAsset(token, asset.url, nextFilename)
      clearAdminMediaLibraryCache()
      await loadMediaLibrary({ force: true })
      setMessage('Bestandsnaam bijgewerkt.')
      cancelRename()
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : 'Bestandsnaam kon niet worden gewijzigd.')
    } finally {
      setSavingRenameUrl('')
    }
  }

  const activeCount = filteredMediaItems.length

  return (
    <div className="admin-page-grid admin-media-page">
      {message ? <div className="payment-feedback payment-feedback-success">{message}</div> : null}
      {error ? <div className="payment-feedback payment-feedback-error">{error}</div> : null}

      <section className="admin-kpi-grid admin-media-kpis">
        <article className="admin-card admin-kpi-card">
          <span>Sitebeelden</span>
          <strong>{siteMediaLibrary.length}</strong>
          <p>Gebundelde beelden uit de website.</p>
        </article>
        <article className="admin-card admin-kpi-card">
          <span>Uploads</span>
          <strong>{managedAssets.length}</strong>
          <p>Beelden die via de backend zijn toegevoegd.</p>
        </article>
        <article className="admin-card admin-kpi-card">
          <span>Ongebruikt</span>
          <strong>{managedAssets.filter((asset) => asset.removable).length}</strong>
          <p>Uploads die veilig verwijderd kunnen worden.</p>
        </article>
      </section>

      <section className="admin-media-toolbar">
        <div className="admin-media-toolbar-copy">
          <p className="product-label">Mediabibliotheek</p>
          <strong>Sitebeelden en uploads in een overzicht.</strong>
        </div>

        <label className="admin-search-field admin-media-search">
          <span>Zoeken in mediabibliotheek</span>
          <FiSearch aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bestandsnaam of label" />
        </label>

        <div className="admin-media-actions">
          <button type="button" className="btn btn-secondary" onClick={() => void loadMediaLibrary({ force: true })} disabled={isLoading}>
            <FiRefreshCw aria-hidden="true" />
            Verversen
          </button>
          <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={!canManage || isUploading}>
            <FiUpload aria-hidden="true" />
            {isUploading ? 'Uploaden...' : 'Toevoegen'}
          </button>
          <input ref={fileInputRef} className="admin-media-file-input" type="file" accept="image/*" multiple onChange={handleUpload} />
        </div>
      </section>

      <div className="admin-media-results-meta">
        <span>{activeCount} beelden · pagina {page} van {pageCount}</span>
        {!isInitialLoading ? <span>Thumbnails worden lokaal gecached voor snellere weergave.</span> : null}
      </div>

      {isInitialLoading ? (
        <section className="admin-media-loading-state" role="status" aria-live="polite">
          <span className="admin-loader-spinner" aria-hidden="true" />
          <strong>Mediabibliotheek laden</strong>
          <p>De eerste beelden worden opgehaald en daarna lokaal hergebruikt.</p>
        </section>
      ) : (
        <section className="admin-media-combined-view">
          <div className="admin-card-head">
            <div>
              <p className="product-label">Beeldbank</p>
              <h2>Alle beelden in een responsive galerij</h2>
            </div>
          </div>
          <MediaGalleryGrid
            assets={visibleMediaItems}
            canManage={canManage}
            deletingUrl={deletingUrl}
            renamingUrl={renamingUrl}
            renameDraft={renameDraft}
            savingRenameUrl={savingRenameUrl}
            onCopy={handleCopy}
            onDelete={handleDelete}
            onPreview={setPreview}
            onStartRename={startRename}
            onRenameDraftChange={setRenameDraft}
            onCancelRename={cancelRename}
            onRename={(asset) => void handleRename(asset)}
          />
          {filteredMediaItems.length > ADMIN_MEDIA_PAGE_SIZE ? (
            <div className="admin-media-pagination" aria-label="Paginering mediabibliotheek">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
              >
                Vorige
              </button>
              <span>Pagina {page} van {pageCount}</span>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={page >= pageCount}
              >
                Volgende
              </button>
            </div>
          ) : null}
        </section>
      )}

      <AdminImagePreviewModal preview={preview} onClose={() => setPreview(null)} />
    </div>
  )
}

function MediaGalleryGrid({
  assets,
  canManage,
  deletingUrl,
  renamingUrl,
  renameDraft,
  savingRenameUrl,
  onCopy,
  onDelete,
  onPreview,
  onStartRename,
  onRenameDraftChange,
  onCancelRename,
  onRename,
}: {
  assets: MediaGalleryItem[]
  canManage: boolean
  deletingUrl: string
  renamingUrl: string
  renameDraft: string
  savingRenameUrl: string
  onCopy: (value: string) => Promise<void>
  onDelete: (asset: ApiManagedMediaAsset) => Promise<void>
  onPreview: (preview: AdminImagePreview) => void
  onStartRename: (asset: ApiManagedMediaAsset) => void
  onRenameDraftChange: (value: string) => void
  onCancelRename: () => void
  onRename: (asset: ApiManagedMediaAsset) => void
}) {
  const handleRenameKeyDown = (event: KeyboardEvent<HTMLInputElement>, asset: ApiManagedMediaAsset) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onRename(asset)
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      onCancelRename()
    }
  }

  if (!assets.length) {
    return <section className="admin-card"><p className="admin-muted">Geen beelden gevonden.</p></section>
  }

  return (
    <section className="admin-media-grid">
      {assets.map((asset) => {
        const managedAsset = asset.managedAsset
        const isRenaming = Boolean(managedAsset && renamingUrl === managedAsset.url)

        return (
          <article key={asset.id} className="admin-media-item">
            <div className="admin-media-preview">
              <AdminOptimizedImage src={asset.src} alt={asset.alt} thumbnailWidth={260} fill />
              <button
                type="button"
                className="product-admin-preview-button"
                onClick={() => onPreview({ src: asset.src, alt: asset.alt, label: asset.filename })}
                aria-label={`Bekijk ${asset.filename} groter`}
              >
                <FiMaximize2 aria-hidden="true" />
              </button>
            </div>
            <div className="admin-media-item-body">
              {isRenaming && managedAsset ? (
                <div className="admin-media-rename-field">
                  <input
                    value={renameDraft}
                    onChange={(event) => onRenameDraftChange(event.target.value)}
                    onKeyDown={(event) => handleRenameKeyDown(event, managedAsset)}
                    autoFocus
                    disabled={savingRenameUrl === managedAsset.url}
                    aria-label="Nieuwe bestandsnaam"
                  />
                  <div className="admin-media-rename-actions">
                    <button
                      type="button"
                      className="admin-media-icon-button"
                      onClick={() => onRename(managedAsset)}
                      disabled={savingRenameUrl === managedAsset.url}
                      aria-label="Bestandsnaam opslaan"
                    >
                      <FiCheck aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="admin-media-icon-button"
                      onClick={onCancelRename}
                      disabled={savingRenameUrl === managedAsset.url}
                      aria-label="Hernoemen annuleren"
                    >
                      <FiX aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : (
                <strong title={asset.filename}>{asset.filename}</strong>
              )}
              <span className="admin-media-item-kind">{asset.sourceLabel} · {asset.detailLabel}</span>
              {asset.referenceLabel ? <small>{asset.referenceLabel}</small> : null}
            </div>
            <div className="admin-media-item-actions">
              <button type="button" className="admin-media-icon-button" onClick={() => void onCopy(asset.copyValue)} aria-label="Kopieer afbeeldingslink">
                <FiCopy aria-hidden="true" />
              </button>
              <a className="admin-media-icon-button" href={asset.src} target="_blank" rel="noreferrer" aria-label="Open afbeelding">
                <FiExternalLink aria-hidden="true" />
              </a>
              {canManage && managedAsset ? (
                <>
                  <button
                    type="button"
                    className="admin-media-icon-button"
                    onClick={() => onStartRename(managedAsset)}
                    disabled={isRenaming || savingRenameUrl === managedAsset.url}
                    aria-label="Hernoem afbeelding"
                    title="Hernoem afbeelding"
                  >
                    <FiEdit2 aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="admin-media-icon-button admin-media-delete-button"
                    onClick={() => void onDelete(managedAsset)}
                    disabled={!managedAsset.removable || deletingUrl === managedAsset.url || isRenaming}
                    aria-label="Verwijder afbeelding"
                    title={managedAsset.removable ? 'Verwijder afbeelding' : 'Nog in gebruik'}
                  >
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </>
              ) : null}
            </div>
          </article>
        )
      })}
    </section>
  )
}
