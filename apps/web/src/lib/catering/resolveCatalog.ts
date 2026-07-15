import type { CateringCategoryId, CateringLocalizedText, CateringProductConfig, CateringSettings } from "@tresamigos/types";
import {
  CATERING_CATEGORIES,
  CATERING_PRODUCTS,
  LARGE_GROUP_EMAIL,
  MAX_ONLINE_SERVINGS,
  type CateringProduct,
  type ServingOption
} from "./catalog";

function pickLocalized(value: CateringLocalizedText | string, lang: "nl" | "en") {
  if (typeof value === "string") return value;
  return lang === "en" ? value.en || value.nl : value.nl || value.en;
}

function configToProduct(config: CateringProductConfig, lang: "nl" | "en"): CateringProduct {
  const servingOptions: ServingOption[] = config.servingOptions.map((option) => ({
    servings: option.servings,
    extraCents: option.extraCents,
    labelKey: `catering.servings.${option.servings}`
  }));

  const name = pickLocalized(config.name, lang);
  const description = pickLocalized(config.description, lang);

  return {
    id: config.id,
    categoryId: config.categoryId,
    nameKey: name,
    descKey: description,
    image: config.image,
    basePriceCents: config.basePriceCents,
    tier: config.tier,
    configurable: config.configurable,
    servingOptions: servingOptions.length ? servingOptions : undefined
  };
}

export function productLabel(product: CateringProduct, t: (key: string) => string) {
  return product.nameKey.startsWith("catering.") ? t(product.nameKey) : product.nameKey;
}

export function productDescription(product: CateringProduct, t: (key: string) => string) {
  return product.descKey.startsWith("catering.") ? t(product.descKey) : product.descKey;
}

export function categoryLabel(
  settings: CateringSettings | undefined,
  categoryId: CateringCategoryId,
  lang: "nl" | "en",
  t: (key: string) => string
) {
  const fromSettings = settings?.categories.find((category) => category.id === categoryId);
  if (fromSettings) return pickLocalized(fromSettings.label, lang);
  const fallback = CATERING_CATEGORIES.find((category) => category.id === categoryId);
  return fallback ? t(fallback.labelKey) : categoryId;
}

export function resolveCateringCatalog(settings?: CateringSettings, lang: "nl" | "en" = "nl") {
  const visibleCategories = new Set(
    (settings?.categories || [])
      .filter((category) => category.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => category.id)
  );

  const products =
    settings?.products?.length && settings.products.some((product) => product.active)
      ? settings.products
          .filter((product) => product.active && (!visibleCategories.size || visibleCategories.has(product.categoryId)))
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((product) => configToProduct(product, lang))
      : CATERING_PRODUCTS.map((product) => ({
          ...product,
          nameKey: product.nameKey,
          descKey: product.descKey
        }));

  const maxOnlineServings = settings?.maxOnlineServings ?? MAX_ONLINE_SERVINGS;
  const largeGroupEmail = settings?.largeGroupEmail ?? LARGE_GROUP_EMAIL;

  return {
    products,
    maxOnlineServings,
    largeGroupEmail,
    categories: settings?.categories || [],
    getProduct(id: string) {
      return products.find((product) => product.id === id);
    },
    productsByCategory(categoryId: CateringCategoryId) {
      return products.filter((product) => product.categoryId === categoryId);
    },
    categoryLabel(categoryId: CateringCategoryId, t: (key: string) => string) {
      return categoryLabel(settings, categoryId, lang, t);
    }
  };
}

export type ResolvedCateringCatalog = ReturnType<typeof resolveCateringCatalog>;
