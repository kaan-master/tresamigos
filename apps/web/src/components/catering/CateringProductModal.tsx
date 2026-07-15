import { useEffect, useMemo, useRef, useState } from "react";
import type { CateringCartLine, CateringSettings } from "@tresamigos/types";
import type { CateringProduct } from "../../lib/catering/catalog";
import { packageRulesFor } from "../../lib/catering/catalog";
import { createLineId, formatEuro, priceConfiguredProduct } from "../../lib/catering/cart";
import { productDescription, productLabel } from "../../lib/catering/resolveCatalog";
import { resolveCateringIngredients, type ResolvedIngredientOption } from "../../lib/catering/resolveIngredients";
import { assetUrl } from "../../lib/api";
import { cateringImageUrl } from "../../lib/catering/images";
import { useLanguage } from "../../i18n/LanguageProvider";

interface Props {
  product: CateringProduct;
  settings?: CateringSettings;
  onBack: () => void;
  onAdd: (line: CateringCartLine) => void;
}

type SectionId = "servings" | "proteins" | "toppings" | "sauces" | "tortilla" | "cream" | "quantity";
type SectionTone = "blue" | "red" | "green" | "yellow" | "purple" | "orange";

interface SectionConfig {
  id: SectionId;
  tone: SectionTone;
  titleKey: string;
  required: number;
  selected: number;
}

function setLimited(list: string[], value: string, max: number) {
  if (list.includes(value)) return list.filter((item) => item !== value);
  if (list.length >= max) return [...list.slice(1), value];
  return [...list, value];
}

function SectionIcon({ name }: { name: SectionId | "check" }) {
  const common = { viewBox: "0 0 24 24", width: 20, height: 20, "aria-hidden": true as const };
  if (name === "servings") {
    return (
      <svg {...common}>
        <path d="M4 7h16M4 12h10M4 17h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="18" cy="17" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (name === "proteins") {
    return (
      <svg {...common}>
        <path d="M8 3v4M16 3v4M6 11h12l-1 10H7L6 11Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "toppings") {
    return (
      <svg {...common}>
        <path d="M12 3c3 4 5 7 5 10a5 5 0 1 1-10 0c0-3 2-6 5-10Z" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (name === "sauces") {
    return (
      <svg {...common}>
        <path d="M9 3h6v5a4 4 0 0 1-8 0V3Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 12v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "tortilla") {
    return (
      <svg {...common}>
        <ellipse cx="12" cy="12" rx="9" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (name === "cream") {
    return (
      <svg {...common}>
        <path d="M8 14h8l-1 7H9l-1-7Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10 8c0-2 1-4 2-4s2 2 2 4" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (name === "quantity") {
    return (
      <svg {...common}>
        <path d="M7 10h10M7 14h10M5 6h14v14H5V6Z" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M5 12l4 4L19 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ChoiceChip({
  label,
  image,
  selected,
  onClick,
  disabled
}: {
  label: string;
  image?: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className={`catering-choice${image ? " has-image" : ""}${selected ? " is-selected" : ""}`} disabled={disabled} onClick={onClick}>
      {image ? (
        <span className="catering-choice-thumb">
          <img src={assetUrl(image)} alt="" loading="lazy" />
        </span>
      ) : null}
      {selected ? <span className="catering-choice-check" aria-hidden="true">✓</span> : null}
      <span>{label}</span>
    </button>
  );
}

function IngredientChoices({
  options,
  selected,
  multiple,
  onSelect
}: {
  options: ResolvedIngredientOption[];
  selected: string | string[];
  multiple?: boolean;
  onSelect: (value: string) => void;
}) {
  const selectedList = Array.isArray(selected) ? selected : selected ? [selected] : [];
  return (
    <div className="catering-choice-grid">
      {options.map((option) => (
        <ChoiceChip
          key={option.id}
          label={option.label}
          image={option.image}
          selected={multiple ? selectedList.includes(option.label) : selected === option.label}
          onClick={() => onSelect(option.label)}
        />
      ))}
    </div>
  );
}

function pickHint(count: number, t: (key: string) => string) {
  return count === 1 ? t("catering.modal.pickOne") : t("catering.modal.pickCount").replace("{count}", String(count));
}

export function CateringProductConfigurator({ product, settings, onBack, onAdd }: Props) {
  const { t, lang } = useLanguage();
  const rules = product.tier ? packageRulesFor(product.categoryId, product.tier) : null;
  const ingredients = useMemo(() => resolveCateringIngredients(settings, lang), [settings, lang]);
  const toppings = ingredients.toppingsFor(product.categoryId);
  const creamOptions = ingredients.creamFor(product.tier);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement | null>>>({});

  const [servings, setServings] = useState(product.servingOptions?.[0]?.servings || 10);
  const [quantity, setQuantity] = useState(1);
  const [proteins, setProteins] = useState<string[]>([]);
  const [toppingChoices, setToppingChoices] = useState<string[]>([]);
  const [sauceChoices, setSauceChoices] = useState<string[]>([]);
  const [tortillas, setTortillas] = useState<string[]>([]);
  const [cream, setCream] = useState("");
  const [errors, setErrors] = useState<Partial<Record<SectionId, string>>>({});
  const [activeSection, setActiveSection] = useState<SectionId>("servings");


  useEffect(() => {
    setServings(product.servingOptions?.[0]?.servings || 10);
    setQuantity(1);
    setProteins([]);
    setToppingChoices([]);
    setSauceChoices([]);
    setTortillas([]);
    setCream("");
    setErrors({});
    setActiveSection(product.servingOptions ? "servings" : "quantity");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [product.id, product.servingOptions]);

  function scrollToSection(id: SectionId) {
    setActiveSection(id);
    const container = scrollRef.current;
    const section = sectionRefs.current[id];
    if (!container || !section) return;
    const containerTop = container.getBoundingClientRect().top;
    const sectionTop = section.getBoundingClientRect().top;
    const nextTop = sectionTop - containerTop + container.scrollTop - 12;
    container.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
  }

  const price = useMemo(() => {
    if (!product.configurable) return { unitPriceCents: product.basePriceCents, lineTotalCents: product.basePriceCents * quantity };
    return priceConfiguredProduct(product, servings, quantity, {
      servings,
      proteins,
      toppings: toppingChoices,
      sauces: sauceChoices,
      tortillas,
      cream
    });
  }, [product, servings, quantity, proteins, toppingChoices, sauceChoices, tortillas, cream]);

  const sections = useMemo((): SectionConfig[] => {
    if (!rules) {
      return [{ id: "quantity", tone: "blue", titleKey: "catering.field.quantity", required: 1, selected: quantity > 0 ? 1 : 0 }];
    }

    const list: SectionConfig[] = [
      { id: "servings", tone: "blue", titleKey: "catering.field.servings", required: 1, selected: servings ? 1 : 0 },
      {
        id: "proteins",
        tone: "red",
        titleKey: "catering.group.proteins",
        required: rules.proteins,
        selected: proteins.filter(Boolean).length
      },
      {
        id: "toppings",
        tone: "green",
        titleKey: "catering.group.toppings",
        required: rules.toppings,
        selected: toppingChoices.length
      },
      {
        id: "sauces",
        tone: "yellow",
        titleKey: "catering.group.salsas",
        required: rules.sauces,
        selected: sauceChoices.length
      }
    ];

    if (product.categoryId === "buffet") {
      list.push({
        id: "tortilla",
        tone: "purple",
        titleKey: "catering.field.tortilla",
        required: rules.tortillas,
        selected: tortillas.length
      });
    }

    if (rules.cream !== "none") {
      list.push({
        id: "cream",
        tone: "orange",
        titleKey: rules.cream === "and" ? "catering.field.creamAnd" : "catering.field.creamOr",
        required: 1,
        selected: cream ? 1 : 0
      });
    }

    list.push({ id: "quantity", tone: "blue", titleKey: "catering.field.quantity", required: 1, selected: quantity > 0 ? 1 : 0 });
    return list;
  }, [rules, servings, proteins, toppingChoices, sauceChoices, tortillas, cream, quantity, product.categoryId]);

  const completedSections = sections.filter((section) => section.selected >= section.required).length;
  const progress = Math.round((completedSections / sections.length) * 100);
  const missingSections = sections.filter((section) => section.selected < section.required);

  function validate() {
    const next: Partial<Record<SectionId, string>> = {};
    if (!rules) {
      if (quantity < 1) next.quantity = t("catering.error.quantityMin");
      setErrors(next);
      return Object.keys(next).length === 0;
    }

    if (!servings) next.servings = t("catering.error.servings");
    if (proteins.filter(Boolean).length < rules.proteins) next.proteins = t("catering.error.proteins");
    if (toppingChoices.length < rules.toppings) next.toppings = t("catering.error.toppings");
    if (sauceChoices.length < rules.sauces) next.sauces = t("catering.error.sauces");
    if (product.categoryId === "buffet" && tortillas.length < rules.tortillas) next.tortilla = t("catering.error.tortilla");
    if (rules.cream !== "none" && !cream) next.cream = t("catering.error.cream");
    if (quantity < 1) next.quantity = t("catering.error.quantityMin");

    setErrors(next);
    if (Object.keys(next).length) {
      const firstId = sections.find((section) => next[section.id])?.id;
      if (firstId) window.requestAnimationFrame(() => scrollToSection(firstId));
      return false;
    }
    return true;
  }

  function setProteinAt(index: number, value: string) {
    setProteins((current) => {
      const next = [...current];
      next[index] = value;
      return next.slice(0, rules?.proteins || 1);
    });
    setErrors((current) => ({ ...current, proteins: undefined }));
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
      name: productLabel(product, t),
      imageUrl: product.image,
      tier: product.tier,
      servings,
      quantity,
      unitPriceCents: price.unitPriceCents,
      lineTotalCents: price.lineTotalCents,
      configuration
    });
    onBack();
  }

  function sectionProps(id: SectionId, tone: SectionTone, required: number, selected: number) {
    const complete = selected >= required;
    const error = errors[id];
    return {
      ref: (node: HTMLElement | null) => {
        sectionRefs.current[id] = node;
      },
      className: `catering-config-section tone-${tone}${complete ? " is-complete" : ""}${error ? " is-error" : ""}${activeSection === id ? " is-active" : ""}`,
      "data-section": id
    };
  }

  return (
    <section className="catering-config-page">
      <div className="catering-config-top">
        <button type="button" className="btn alt catering-config-back" onClick={onBack}>
          ← {t("catering.config.back")}
        </button>
        <div className="catering-config-hero">
          <img src={cateringImageUrl(product.image)} alt="" />
          <div>
            <p className="eyebrow">{t("catering.modal.configure")}</p>
            <h2>{productLabel(product, t)}</h2>
            <p>{productDescription(product, t)}</p>
          </div>
        </div>
      </div>

      <div className="catering-config-layout">
        <aside className="catering-config-rail" aria-label={t("catering.modal.progress")}>
          {sections.map((section) => {
            const complete = section.selected >= section.required;
            const missing = section.selected < section.required;
            return (
              <button
                key={section.id}
                type="button"
                className={`catering-rail-step tone-${section.tone}${complete ? " is-complete" : ""}${missing ? " is-missing" : ""}${activeSection === section.id ? " is-active" : ""}`}
                onClick={() => scrollToSection(section.id)}
              >
                <span className="catering-rail-icon">
                  <SectionIcon name={complete ? "check" : section.id} />
                </span>
                <span className="catering-rail-copy">
                  <strong>{t(section.titleKey)}</strong>
                  <em>
                    {section.selected}/{section.required}
                  </em>
                </span>
              </button>
            );
          })}
          <div className="catering-rail-progress">
            <strong>{progress}%</strong>
            <span>
              {completedSections}/{sections.length} {t("catering.modal.sectionsDone")}
            </span>
            <div className="catering-modal-progress-bar" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        </aside>

        <div className="catering-config-main">
          {missingSections.length ? (
            <div className="catering-config-missing" role="status">
              <strong>{t("catering.modal.missingTitle")}</strong>
              <div className="catering-config-missing-grid">
                {missingSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    className={`catering-missing-chip tone-${section.tone}`}
                    onClick={() => scrollToSection(section.id)}
                  >
                    <SectionIcon name={section.id} />
                    <span>{t(section.titleKey)}</span>
                    <em>
                      {section.selected}/{section.required}
                    </em>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="catering-config-scroll" ref={scrollRef}>
            <div className="catering-config-body">
              {product.servingOptions ? (
                <section {...sectionProps("servings", "blue", 1, servings ? 1 : 0)}>
                  <header className="catering-config-head">
                    <span className="catering-config-icon">
                      <SectionIcon name="servings" />
                    </span>
                    <div>
                      <h3>{t("catering.field.servings")}</h3>
                      <p>{t("catering.modal.servingsHint")}</p>
                    </div>
                    <span className="catering-config-badge">{servings ? "✓" : "1"}</span>
                  </header>
                  <div className="catering-choice-grid catering-choice-grid-wide">
                    {product.servingOptions.map((option) => (
                      <ChoiceChip
                        key={option.servings}
                        label={`${t(option.labelKey)}${option.extraCents ? ` +${formatEuro(option.extraCents)}` : ""}`}
                        selected={servings === option.servings}
                        onClick={() => {
                          setServings(option.servings);
                          setErrors((current) => ({ ...current, servings: undefined }));
                        }}
                      />
                    ))}
                  </div>
                  {errors.servings ? <p className="catering-section-error">{errors.servings}</p> : null}
                </section>
              ) : null}

              {rules ? (
                <>
                  <section
                    {...sectionProps("proteins", "red", rules.proteins, proteins.filter(Boolean).length)}
                    data-wide={rules.proteins > 1 ? "true" : undefined}
                  >
                    <header className="catering-config-head">
                      <span className="catering-config-icon">
                        <SectionIcon name="proteins" />
                      </span>
                      <div>
                        <h3>{t("catering.group.proteins")}</h3>
                        <p>{pickHint(rules.proteins, t)}</p>
                      </div>
                      <span className="catering-config-badge">
                        {proteins.filter(Boolean).length}/{rules.proteins}
                      </span>
                    </header>
                    {Array.from({ length: rules.proteins }).map((_, index) => (
                      <div key={`protein-slot-${index}`} className="catering-protein-slot">
                        <p className="catering-slot-label">
                          {t("catering.field.protein")} {rules.proteins > 1 ? index + 1 : ""}
                        </p>
                        <IngredientChoices
                          options={ingredients.proteins}
                          selected={proteins[index] || ""}
                          onSelect={(value) => setProteinAt(index, value)}
                        />
                      </div>
                    ))}
                    {errors.proteins ? <p className="catering-section-error">{errors.proteins}</p> : null}
                  </section>

                  <section {...sectionProps("toppings", "green", rules.toppings, toppingChoices.length)}>
                    <header className="catering-config-head">
                      <span className="catering-config-icon">
                        <SectionIcon name="toppings" />
                      </span>
                      <div>
                        <h3>{t("catering.group.toppings")}</h3>
                        <p>{pickHint(rules.toppings, t)}</p>
                      </div>
                      <span className="catering-config-badge">
                        {toppingChoices.length}/{rules.toppings}
                      </span>
                    </header>
                    <IngredientChoices
                      options={toppings}
                      selected={toppingChoices}
                      multiple
                      onSelect={(value) => {
                        setToppingChoices((current) => setLimited(current, value, rules.toppings));
                        setErrors((current) => ({ ...current, toppings: undefined }));
                      }}
                    />
                    {errors.toppings ? <p className="catering-section-error">{errors.toppings}</p> : null}
                  </section>

                  <section {...sectionProps("sauces", "yellow", rules.sauces, sauceChoices.length)}>
                    <header className="catering-config-head">
                      <span className="catering-config-icon">
                        <SectionIcon name="sauces" />
                      </span>
                      <div>
                        <h3>{t("catering.group.salsas")}</h3>
                        <p>{pickHint(rules.sauces, t)}</p>
                      </div>
                      <span className="catering-config-badge">
                        {sauceChoices.length}/{rules.sauces}
                      </span>
                    </header>
                    <IngredientChoices
                      options={ingredients.sauces}
                      selected={sauceChoices}
                      multiple
                      onSelect={(value) => {
                        setSauceChoices((current) => setLimited(current, value, rules.sauces));
                        setErrors((current) => ({ ...current, sauces: undefined }));
                      }}
                    />
                    {errors.sauces ? <p className="catering-section-error">{errors.sauces}</p> : null}
                  </section>

                  {product.categoryId === "buffet" ? (
                    <section {...sectionProps("tortilla", "purple", rules.tortillas, tortillas.length)}>
                      <header className="catering-config-head">
                        <span className="catering-config-icon">
                          <SectionIcon name="tortilla" />
                        </span>
                        <div>
                          <h3>{t("catering.field.tortilla")}</h3>
                          <p>{pickHint(rules.tortillas, t)}</p>
                        </div>
                        <span className="catering-config-badge">
                          {tortillas.length}/{rules.tortillas}
                        </span>
                      </header>
                      <IngredientChoices
                        options={ingredients.tortillas}
                        selected={tortillas}
                        multiple
                        onSelect={(value) => {
                          setTortillas((current) => setLimited(current, value, rules.tortillas));
                          setErrors((current) => ({ ...current, tortilla: undefined }));
                        }}
                      />
                      {errors.tortilla ? <p className="catering-section-error">{errors.tortilla}</p> : null}
                    </section>
                  ) : null}

                  {rules.cream !== "none" ? (
                    <section {...sectionProps("cream", "orange", 1, cream ? 1 : 0)}>
                      <header className="catering-config-head">
                        <span className="catering-config-icon">
                          <SectionIcon name="cream" />
                        </span>
                        <div>
                          <h3>{rules.cream === "and" ? t("catering.field.creamAnd") : t("catering.field.creamOr")}</h3>
                          <p>{t("catering.modal.pickOne")}</p>
                        </div>
                        <span className="catering-config-badge">{cream ? "✓" : "1"}</span>
                      </header>
                      <IngredientChoices
                        options={creamOptions}
                        selected={cream}
                        onSelect={(value) => {
                          setCream(value);
                          setErrors((current) => ({ ...current, cream: undefined }));
                        }}
                      />
                      {errors.cream ? <p className="catering-section-error">{errors.cream}</p> : null}
                    </section>
                  ) : null}
                </>
              ) : null}

              <section {...sectionProps("quantity", "blue", 1, quantity > 0 ? 1 : 0)}>
                <header className="catering-config-head">
                  <span className="catering-config-icon">
                    <SectionIcon name="quantity" />
                  </span>
                  <div>
                    <h3>{t("catering.field.quantity")}</h3>
                    <p>{t("catering.modal.quantityHint")}</p>
                  </div>
                  <span className="catering-config-badge">{quantity}</span>
                </header>
                <div className="catering-qty-stepper catering-qty-stepper-large">
                  <button type="button" aria-label="-" onClick={() => setQuantity((current) => Math.max(1, current - 1))}>
                    −
                  </button>
                  <strong>{quantity}</strong>
                  <button type="button" aria-label="+" onClick={() => setQuantity((current) => Math.min(10, current + 1))}>
                    +
                  </button>
                </div>
                {errors.quantity ? <p className="catering-section-error">{errors.quantity}</p> : null}
              </section>
            </div>
          </div>

          <footer className="catering-config-footer">
            <div>
              <span className="catering-modal-price-label">{t("catering.subtotal")}</span>
              <strong className="catering-modal-price">{formatEuro(price.lineTotalCents)}</strong>
            </div>
            <button type="button" className="btn primary catering-config-add" onClick={handleAdd}>
              {t("catering.config.add")}
            </button>
          </footer>
        </div>
      </div>
    </section>
  );
}

/** @deprecated Use CateringProductConfigurator */
export const CateringProductModal = CateringProductConfigurator;
