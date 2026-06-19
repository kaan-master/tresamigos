import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiCheck, FiMaximize2, FiPlus, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi'
import { resolveApiAssetUrl, type ApiManagedMediaAsset } from '../api'
import { siteMediaLibrary, type SiteMediaAsset } from '../brandMedia'
import { getCachedAdminMediaLibrary, loadAdminMediaLibraryCached, preloadAdminMediaImages } from '../adminMediaCache'
import AdminImagePreviewModal, { type AdminImagePreview } from './AdminImagePreviewModal'
import AdminOptimizedImage from './AdminOptimizedImage'

export type SelectableLibraryImage = {
  id: string
  source: 'uploads' | 'site'
  url: string
  previewUrl: string
  filename: string
  alt: string
  sourceLabel: string
}

type AdminMediaPickerModalProps = {
  token: string
  open: boolean
  title: string
  description: string
  selectionMode?: 'single' | 'multiple'
  onClose: () => void
  onConfirm: (assets: SelectableLibraryImage[]) => void
}

const PAGE_SIZE = 30

function fileNameToAlt(originalName: string) {
  return originalName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
}

function buildLibraryImages(managedAssets: ApiManagedMediaAsset[]): SelectableLibraryImage[] {
  const uploadedImages = managedAssets.map((asset) => ({
    id: `upload-${asset.filename}`,
    source: 'uploads' as const,
    url: asset.url,
    previewUrl: resolveApiAssetUrl(asset.url),
    filename: asset.filename,
    alt: fileNameToAlt(asset.filename) || 'FERDIEK productafbeelding',
    sourceLabel: asset.section === 'branding' ? 'Branding' : 'Upload',
  }))

  const siteImages = siteMediaLibrary.map((asset: SiteMediaAsset) => ({
    id: `site-${asset.id}`,
    source: 'site' as const,
    url: asset.src,
    previewUrl: asset.src,
    filename: asset.filename,
    alt: asset.alt,
    sourceLabel: 'Sitebeeld',
  }))

  return [...uploadedImages, ...siteImages]
}

export default function AdminMediaPickerModal({
  token,
  open,
  title,
  description,
  selectionMode = 'multiple',
  onClose,
  onConfirm,
}: AdminMediaPickerModalProps) {
  const isSingleSelect = selectionMode === 'single'
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [managedAssets, setManagedAssets] = useState<ApiManagedMediaAsset[]>(() => getCachedAdminMediaLibrary(token) ?? [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<AdminImagePreview | null>(null)

  const loadAssets = useCallback(async (options?: { force?: boolean }) => {
    setIsLoading(true)
    setError('')

    try {
      const assets = await loadAdminMediaLibraryCached(token, options)
      setManagedAssets(assets)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Mediabibliotheek kon niet worden geladen.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!open) {
      return
    }

    setQuery('')
    setPage(1)
    setSelectedIds([])
    setError('')
    setPreview(null)

    const cached = getCachedAdminMediaLibrary(token)
    if (cached) {
      setManagedAssets(cached)
    }

    void loadAssets()
  }, [loadAssets, open, token])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (preview) {
          setPreview(null)
          return
        }
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open, preview])

  const libraryImages = useMemo(() => buildLibraryImages(managedAssets), [managedAssets])

  const filteredImages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return libraryImages
    }

    return libraryImages.filter((asset) => {
      const haystack = `${asset.filename} ${asset.alt} ${asset.sourceLabel}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [libraryImages, query])

  const visibleImages = useMemo(
    () => filteredImages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredImages, page],
  )

  const pageCount = Math.max(1, Math.ceil(filteredImages.length / PAGE_SIZE))

  const selectedImages = useMemo(
    () => libraryImages.filter((asset) => selectedIds.includes(asset.id)),
    [libraryImages, selectedIds],
  )

  useEffect(() => {
    setPage(1)
  }, [query])

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount)
    }
  }, [page, pageCount])

  useEffect(() => {
    preloadAdminMediaImages(visibleImages.map((asset) => asset.previewUrl), PAGE_SIZE)
  }, [visibleImages])

  const toggleSelection = (assetId: string) => {
    if (isSingleSelect) {
      const asset = libraryImages.find((entry) => entry.id === assetId)
      if (asset) {
        onConfirm([asset])
        onClose()
      }
      return
    }

    setSelectedIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId],
    )
  }

  if (!open || typeof document === 'undefined') {
    return null
  }

  const isInitialLoading = isLoading && managedAssets.length === 0

  return createPortal(
    <>
      <div className="admin-media-picker-backdrop" role="presentation" onClick={onClose}>
        <div
          className="admin-media-picker-modal"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="admin-media-picker-head">
            <div>
              <p className="product-label">Mediabibliotheek</p>
              <h3>{title}</h3>
              <p className="product-admin-muted">{description}</p>
            </div>
            <div className="admin-media-picker-actions">
              {!isSingleSelect ? (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      setSelectedIds((current) =>
                        Array.from(new Set([...current, ...visibleImages.map((asset) => asset.id)])),
                      )
                    }
                    disabled={visibleImages.length === 0}
                  >
                    <FiCheck aria-hidden="true" />
                    Selecteer pagina
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onConfirm(selectedImages)}
                    disabled={selectedImages.length === 0}
                  >
                    <FiPlus aria-hidden="true" />
                    {selectedImages.length > 0 ? `${selectedImages.length} toevoegen` : 'Toevoegen'}
                  </button>
                </>
              ) : null}
              <button type="button" className="btn btn-secondary" onClick={() => void loadAssets({ force: true })} disabled={isLoading}>
                <FiRefreshCw aria-hidden="true" />
                Vernieuw
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                <FiX aria-hidden="true" />
                Sluit
              </button>
            </div>
          </div>

          <label className="product-admin-field product-admin-library-search-field">
            <span>Zoeken in beelden</span>
            <span className="product-admin-library-search">
              <FiSearch aria-hidden="true" />
              <input value={query} placeholder="Bestandsnaam, sfeer of bron" onChange={(event) => setQuery(event.target.value)} />
            </span>
          </label>

          <div className="admin-media-picker-meta">
            <span>{filteredImages.length} beelden · pagina {page} van {pageCount}</span>
            {!isSingleSelect ? <span>{selectedIds.length} geselecteerd</span> : <span>Klik om te kiezen</span>}
          </div>

          {error ? <div className="payment-feedback payment-feedback-error">{error}</div> : null}

          {isInitialLoading ? (
            <div className="admin-media-loading-state" role="status" aria-live="polite">
              <span className="admin-loader-spinner" aria-hidden="true" />
              <strong>Mediabibliotheek laden</strong>
              <p>Beelden worden opgehaald en thumbnails worden klaargezet.</p>
            </div>
          ) : (
            <div className="admin-media-picker-grid">
              {filteredImages.length === 0 ? (
                <div className="product-admin-card product-admin-empty-card admin-media-picker-empty">
                  <p>Geen afbeeldingen gevonden voor deze zoekopdracht.</p>
                </div>
              ) : (
                visibleImages.map((asset) => {
                  const isSelected = selectedIds.includes(asset.id)

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      className={`admin-media-picker-tile${isSelected ? ' is-selected' : ''}`}
                      onClick={() => toggleSelection(asset.id)}
                      aria-label={`${isSelected ? 'Deselecteer' : 'Selecteer'} ${asset.filename}`}
                      aria-pressed={isSelected}
                    >
                      <span className="admin-media-picker-tile-image">
                        <AdminOptimizedImage src={asset.url} alt={asset.alt} thumbnailWidth={200} fill />
                      </span>
                      <span className={`admin-media-picker-tile-check${isSelected ? ' is-selected' : ''}`} aria-hidden="true">
                        <FiCheck />
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        className="admin-media-picker-tile-preview"
                        aria-label={`Preview ${asset.filename}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          setPreview({ src: asset.previewUrl, alt: asset.alt, label: asset.filename })
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            event.stopPropagation()
                            setPreview({ src: asset.previewUrl, alt: asset.alt, label: asset.filename })
                          }
                        }}
                      >
                        <FiMaximize2 aria-hidden="true" />
                      </span>
                      <span className="admin-media-picker-tile-label" title={asset.filename}>
                        {asset.filename}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          )}

          {filteredImages.length > PAGE_SIZE ? (
            <div className="admin-media-pagination" aria-label="Paginering mediabibliotheek">
              <button type="button" className="btn btn-secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
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
        </div>
      </div>

      <AdminImagePreviewModal preview={preview} onClose={() => setPreview(null)} />
    </>,
    document.body,
  )
}
