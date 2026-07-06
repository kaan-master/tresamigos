import { useState } from "react";
import type { CateringProduct } from "../../lib/catering/catalog";
import { buildSimpleLine, formatEuro, productDescription, productLabel } from "../../lib/catering";
import { cateringImageUrl } from "../../lib/catering/images";
import { useCateringCart } from "../../context/CateringCartContext";
import { useLanguage } from "../../i18n/LanguageProvider";
import { IconMinus, IconPlus } from "./CateringIcons";

interface Props {
  product: CateringProduct;
}

export function CateringSimpleProductCard({ product }: Props) {
  const { t } = useLanguage();
  const { addLine, lastAddedId, cart } = useCateringCart();
  const [quantity, setQuantity] = useState(1);
  const isAdded = cart.some((line) => line.productId === product.id && line.id === lastAddedId);

  function changeQuantity(delta: number) {
    setQuantity((current) => Math.min(99, Math.max(1, current + delta)));
  }

  function handleAdd() {
    const line = buildSimpleLine(product, quantity);
    line.name = productLabel(product, t);
    addLine(line);
    setQuantity(1);
  }

  return (
    <article className={`catering-product-card catering-product-card-simple${isAdded ? " is-added" : ""}`}>
      <div className="catering-product-card-media">
        <img src={cateringImageUrl(product.image)} alt={productLabel(product, t)} loading="lazy" />
      </div>
      <div className="catering-product-card-body">
        <strong>{productLabel(product, t)}</strong>
        <p>{productDescription(product, t)}</p>
        <span className="catering-product-card-price">{formatEuro(product.basePriceCents)}</span>
      </div>
      <div className="catering-product-card-actions">
        <div className="catering-qty-stepper catering-qty-stepper-card">
          <button type="button" aria-label={t("catering.qty.decrease")} onClick={() => changeQuantity(-1)} disabled={quantity <= 1}>
            <IconMinus width={14} height={14} />
          </button>
          <input
            type="number"
            min={1}
            max={99}
            value={quantity}
            aria-label={t("catering.field.quantity")}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) setQuantity(Math.min(99, Math.max(1, next)));
            }}
          />
          <button type="button" aria-label={t("catering.qty.increase")} onClick={() => changeQuantity(1)} disabled={quantity >= 99}>
            <IconPlus width={14} height={14} />
          </button>
        </div>
        <button type="button" className="btn primary catering-product-card-add-btn" onClick={handleAdd}>
          {t("catering.addToCart")}
        </button>
      </div>
    </article>
  );
}
