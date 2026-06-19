import { useEffect, useState, type CSSProperties } from 'react'
import { preloadImageUrl } from '../adminMediaCache'
import { resolveApiAssetThumbnailUrl, resolveApiAssetUrl } from '../api'

type AdminOptimizedImageProps = {
  src: string
  alt: string
  className?: string
  style?: CSSProperties
  thumbnailWidth?: number
  eager?: boolean
  fill?: boolean
  onLoad?: () => void
}

export default function AdminOptimizedImage({
  src,
  alt,
  className = 'admin-loading-image',
  style,
  thumbnailWidth = 240,
  eager = false,
  fill = false,
  onLoad,
}: AdminOptimizedImageProps) {
  const fullSrc = resolveApiAssetUrl(src)
  const thumbSrc = resolveApiAssetThumbnailUrl(src, thumbnailWidth)
  const displaySrc = thumbSrc || fullSrc
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(false)
  }, [displaySrc])

  useEffect(() => {
    if (fullSrc && fullSrc !== displaySrc) {
      preloadImageUrl(fullSrc)
    }
  }, [displaySrc, fullSrc])

  const imageNode = (
    <>
      <span className={`admin-image-skeleton${isLoaded ? ' is-loaded' : ''}`} aria-hidden="true" />
      <img
        className={`${className}${isLoaded ? ' is-loaded' : ''}${fill ? ' admin-loading-image-fill' : ''}`}
        src={displaySrc}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto'}
        style={style}
        onLoad={() => {
          setIsLoaded(true)
          onLoad?.()
        }}
      />
    </>
  )

  if (fill) {
    return <span className="admin-optimized-image-fill">{imageNode}</span>
  }

  return imageNode
}

export function AdminPreviewImage({ src, alt }: { src: string; alt: string }) {
  const fullSrc = resolveApiAssetUrl(src)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(false)
    preloadImageUrl(fullSrc)
  }, [fullSrc])

  return (
    <>
      <span className={`admin-image-skeleton${isLoaded ? ' is-loaded' : ''}`} aria-hidden="true" />
      <img
        className={`admin-loading-image admin-preview-image${isLoaded ? ' is-loaded' : ''}`}
        src={fullSrc}
        alt={alt}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        onLoad={() => setIsLoaded(true)}
      />
    </>
  )
}
