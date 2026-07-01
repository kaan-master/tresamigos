import { useMemo, useState } from "react";
import type { CateringCartLine } from "@tresamigos/types";
import type { CateringProduct } from "../../lib/catering/catalog";
import {
  CREAM_OPTIONS,
  PACKAGE_RULES,
  PROTEINS,
  SAUCES,
  TORTILLAS,
  TRIPLE_CREAM_OPTIONS,
  toppingsForCategory
} from "../../lib/catering/catalog";
import { createLineId, formatEuro, priceConfiguredProduct } from "../../lib/catering/cart";
import { useLanguage } from "../../i18n/LanguageProvider";

interface Props {
  product: CateringProduct;
  open: boolean;
  onClose: () => void;
  onAdd: (line: CateringCartLine) => void;
}

function pickCount(rules: (typeof PACKAGE_RULES)[keyof typeof PACKAGE_RULES], key: keyof typeof PACKAGE_RULES.budget) {
  return rules[key] as number;
}

export function CateringProductModal({ product, open, onClose, onAdd }: Props) {
  const { t } = useLanguage();
  const rules = product.tier ? PACKAGE_RULES[product.tier] : null;
  const toppings = toppingsForCategory(product.categoryId);

  const [servings, setServings] = useState(product.servingOptions?.[0]?.servings || 10);
  const [quantity, setQuantity] = useState(1);
  const [proteins, setProteins] = useState<string[]>([]);
  const [toppingChoices, setToppingChoices] = useState<string[]>([]);
  const [sauceChoices, setSauceChoices] = useState<string[]>([]);
  const [tortillas, setTortillas] = useState<string[]>([]);
  const [cream, setCream] = useState("");
  const [message, setMessage] = useState("");

  const creamOptions = rules?.cream === "and" ? TRIPLE_CREAM_OPTIONS : CREAM_OPTIONS;
  const price = useMemo(() => {
    if (!product.configurable) return { unitPriceCents: product.basePriceCents, lineTotalCents: product.basePriceCents * quantity };
    const configuration = {
      servings,
      proteins,
      toppings: toppingChoices,
      sauces: sauceChoices,
      tortillas,
      cream
    };
    return priceConfiguredProduct(product, servings, quantity, configuration);
  }, [product, servings, quantity, proteins, toppingChoices, sauceChoices, tortillas, cream]);

  if (!open) return null;

  function setLimited(list: string[], value: string, max: number) {
    if (list.includes(value)) return list.filter((item) => item !== value);
    if (list.length >= max) return [...list.slice(1), value];
    return [...list, value];
  }

  function validate() {
    if (!rules) return true;
    if (!servings) {
      setMessage(t("catering.error.servings"));
      return false;
    }
    if (proteins.filter(Boolean).length < rules.proteins) {
      setMessage(t("catering.error.proteins"));
      return false;
    }
    if (toppingChoices.length < rules.toppings) {
      setMessage(t("catering.error.toppings"));
      return false;
    }
    if (sauceChoices.length < rules.sauces) {
      setMessage(t("catering.error.sauces"));
      return false;
    }
    if (product.categoryId === "buffet" && tortillas.length < rules.tortillas) {
      setMessage(t("catering.error.tortilla"));
      return false;
    }
    if (rules.cream !== "none" && !cream) {
      setMessage(t("catering.error.cream"));
      return false;
    }
    setMessage("");
    return true;
  }

  function handleAdd() {
    if (!validate()) return;
    const configuration: Record<string, string | number | string[]> = {
      servings,
      proteins,
      toppings: toppingChoices,
      sauces: sauceChoices
    };
    if (product.categoryId === "buffet") configuration.tortillas = tortillas;
    if (rules && rules.cream !== "none") configuration.cream = cream;

    onAdd({
      id: createLineId(),
      productId: product.id,
      categoryId: product.categoryId,
      name: t(product.nameKey),
      tier: product.tier,
      servings,
      quantity,
      unitPriceCents: price.unitPriceCents,
      lineTotalCents: price.lineTotalCents,
      configuration
    });
    onClose();
  }

  return (
    <div className="catering-modal" role="dialog" aria-modal="true">
      <button type="button" className="catering-modal-backdrop" aria-label={t("common.close")} onClick={onClose} />
      <div className="catering-modal-panel">
        <button type="button" className="catering-modal-close" onClick={onClose} aria-label={t("common.close")}>
          ×
        </button>
        <div className="catering-modal-grid">
          <img src={product.image} alt={t(product.nameKey)} />
          <div className="catering-modal-copy">
            <h2>{t(product.nameKey)}</h2>
            <p>{t(product.descKey)}</p>

            {product.servingOptions ? (
              <label className="form-field">
                <span>{t("catering.field.servings")}</span>
                <select value={servings} onChange={(event) => setServings(Number(event.target.value))}>
                  {product.servingOptions.map((option) => (
                    <option key={option.servings} value={option.servings}>
                      {t(option.labelKey)}
                      {option.extraCents ? ` (+${(option.extraCents / 100).toFixed(2)})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {rules ? (
              <>
                {Array.from({ length: pickCount(rules, "proteins") }).map((_, index) => (
                  <label key={`protein-${index}`} className="form-field">
                    <span>
                      {t("catering.field.protein")} {pickCount(rules, "proteins") > 1 ? index + 1 : ""}
                    </span>
                    <select
                      value={proteins[index] || ""}
                      onChange={(event) => {
                        setProteins((current) => {
                          const next = [...current];
                          next[index] = event.target.value;
                          return next.slice(0, rules.proteins);
                        });
                      }}
                    >
                      <option value="">{t("catering.field.choose")}</option>
                      {PROTEINS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}

                <h3 className="catering-group-label">{t("catering.group.toppings")}</h3>
                <div className="catering-chip-grid">
                  {toppings.map((item) => (
                    <label key={item} className="catering-chip">
                      <input
                        type="checkbox"
                        checked={toppingChoices.includes(item)}
                        onChange={() => setToppingChoices((current) => setLimited(current, item, rules.toppings))}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>

                <h3 className="catering-group-label">{t("catering.group.salsas")}</h3>
                <div className="catering-chip-grid">
                  {SAUCES.map((item) => (
                    <label key={item} className="catering-chip">
                      <input
                        type="checkbox"
                        checked={sauceChoices.includes(item)}
                        onChange={() => setSauceChoices((current) => setLimited(current, item, rules.sauces))}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>

                {product.categoryId === "buffet" ? (
                  <>
                    <h3 className="catering-group-label">{t("catering.field.tortilla")}</h3>
                    <div className="catering-chip-grid">
                      {TORTILLAS.map((item) => (
                        <label key={item} className="catering-chip">
                          <input
                            type="checkbox"
                            checked={tortillas.includes(item)}
                            onChange={() => setTortillas((current) => setLimited(current, item, rules.tortillas))}
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : null}

                {rules.cream !== "none" ? (
                  <label className="form-field">
                    <span>{rules.cream === "and" ? t("catering.field.creamAnd") : t("catering.field.creamOr")}</span>
                    <select value={cream} onChange={(event) => setCream(event.target.value)}>
                      <option value="">{t("catering.field.choose")}</option>
                      {creamOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </>
            ) : (
              <label className="form-field">
                <span>{t("catering.field.quantity")}</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                />
              </label>
            )}

            {rules ? (
              <label className="form-field">
                <span>{t("catering.field.quantity")}</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                />
              </label>
            ) : null}

            {message ? <p className="contact-form-message error">{message}</p> : null}

            <div className="catering-modal-actions">
              <strong>{formatEuro(price.lineTotalCents)}</strong>
              <button type="button" className="btn primary" onClick={handleAdd}>
                {t("catering.addToCart")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
