import type { CateringCategoryId } from "@tresamigos/types";
import type { FulfillmentMode } from "../../../lib/catering/catalog";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { useCateringCart } from "../../../context/CateringCartContext";
import { useCateringTablet } from "../../../context/CateringTabletContext";
import { IconClipboard, IconShoppingCart, IconTruck } from "../CateringIcons";
import { cateringImageUrl } from "../../../lib/catering/images";

export interface TabletHubCategory {
  id: CateringCategoryId;
  label: string;
  image?: string;
}

interface Props {
  categories: TabletHubCategory[];
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  fulfillment: FulfillmentMode;
  onFulfillment: (mode: FulfillmentMode) => void;
  onCategory: (id: CateringCategoryId) => void;
  onCheckout: () => void;
  onOpenCart: () => void;
  variant?: "page" | "menu";
}

export function CateringTabletHub({
  categories,
  pickupEnabled,
  deliveryEnabled,
  fulfillment,
  onFulfillment,
  onCategory,
  onCheckout,
  onOpenCart,
  variant = "page"
}: Props) {
  const { t } = useLanguage();
  const { itemCount } = useCateringCart();
  const { setMenuOpen, setScreen } = useCateringTablet();

  function pickCategory(id: CateringCategoryId) {
    setMenuOpen(false);
    setScreen("browse");
    onCategory(id);
  }

  function pickFulfillment(mode: FulfillmentMode) {
    setMenuOpen(false);
    onFulfillment(mode);
    setScreen("browse");
  }

  function openCart() {
    setMenuOpen(false);
    onOpenCart();
  }

  function checkout() {
    setMenuOpen(false);
    setScreen("checkout");
    onCheckout();
  }

  const rootClass = variant === "menu" ? "catering-tile-grid catering-tile-grid-menu" : "catering-tile-hub";

  return (
    <div className={rootClass}>
      {variant === "page" ? (
        <div className="catering-tile-hub-intro">
          <p className="eyebrow">{t("catering.eyebrow")}</p>
          <h2>{t("catering.tablet.hubTitle")}</h2>
          <p>{t("catering.tablet.hubIntro")}</p>
        </div>
      ) : null}

      <div className="catering-tile-grid">
        {pickupEnabled ? (
          <button
            type="button"
            className={`catering-tile catering-tile-wide tone-yellow${fulfillment === "pickup" ? " is-active" : ""}`}
            style={{ animationDelay: "0ms" }}
            onClick={() => pickFulfillment("pickup")}
          >
            <span className="catering-tile-icon"><IconTruck width={28} height={28} /></span>
            <strong>{t("catering.mode.pickup")}</strong>
          </button>
        ) : null}
        {deliveryEnabled ? (
          <button
            type="button"
            className={`catering-tile catering-tile-wide tone-blue${fulfillment === "delivery" ? " is-active" : ""}`}
            style={{ animationDelay: "40ms" }}
            onClick={() => pickFulfillment("delivery")}
          >
            <span className="catering-tile-icon"><IconTruck width={28} height={28} /></span>
            <strong>{t("catering.mode.delivery")}</strong>
          </button>
        ) : null}

        {categories.map((category, index) => (
          <button
            key={category.id}
            type="button"
            className="catering-tile tone-brand"
            style={{ animationDelay: `${80 + index * 50}ms` }}
            onClick={() => pickCategory(category.id)}
          >
            {category.image ? (
              <span className="catering-tile-thumb">
                <img src={cateringImageUrl(category.image)} alt="" loading="lazy" />
              </span>
            ) : (
              <span className="catering-tile-icon"><IconTruck width={24} height={24} /></span>
            )}
            <strong>{category.label}</strong>
          </button>
        ))}

        <button type="button" className="catering-tile tone-green" style={{ animationDelay: "280ms" }} onClick={openCart}>
          <span className="catering-tile-icon"><IconShoppingCart width={26} height={26} /></span>
          <strong>{t("catering.cart")}</strong>
          {itemCount > 0 ? <em className="catering-tile-badge">{itemCount}</em> : null}
        </button>

        <button
          type="button"
          className="catering-tile tone-red"
          style={{ animationDelay: "330ms" }}
          disabled={!itemCount}
          onClick={checkout}
        >
          <span className="catering-tile-icon"><IconClipboard width={26} height={26} /></span>
          <strong>{t("catering.placeOrder")}</strong>
        </button>
      </div>
    </div>
  );
}
