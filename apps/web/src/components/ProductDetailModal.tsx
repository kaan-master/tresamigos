import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageProvider";
import { productImageUrl } from "../lib/productImage";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image?: string;
}

interface Props {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

export function ProductDetailModal({ open, product, onClose }: Props) {
  const { t } = useLanguage();
  const backdropRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !product) return null;

  return createPortal(
    <div className="product-modal" role="dialog" aria-modal="true" aria-label={product.name}>
      <button ref={backdropRef} type="button" className="product-modal-backdrop" aria-label={t("common.close")} onClick={onClose} />
      <div className="product-modal-panel">
        <button type="button" className="product-modal-close" onClick={onClose} aria-label={t("common.close")}>
          ×
        </button>
        <img src={productImageUrl(product.image, product.id)} alt={product.name} />
        <div className="product-modal-copy">
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <strong>{product.price}</strong>
          <div className="product-modal-actions">
            <Link className="btn primary" to="/catering" onClick={onClose}>
              {t("menu.cateringCta")}
            </Link>
            <button type="button" className="btn alt" onClick={onClose}>
              {t("common.close")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
