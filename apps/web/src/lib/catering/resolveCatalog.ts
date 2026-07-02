import type { CateringCategoryId, CateringProductConfig, CateringSettings } from "@tresamigos/types";
import {
  CATERING_PRODUCTS,
  LARGE_GROUP_EMAIL,
  MAX_ONLINE_SERVINGS,
  type CateringProduct,
  type ServingOption
} from "./catalog";

function configToProduct(config: CateringProductConfig): CateringProduct {
  const servingOptions: ServingOption[] = config.servingOptions.map((option) => ({
    servings: option.servings,
    extraCents: option.extraCents,
    labelKey: `catering.servings.${option.servings}`
  }));

  return {
    id: config.id,
    categoryId: config.categoryId,
    nameKey: config.name,
    descKey: config.description,
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

export function resolveCateringCatalog(settings?: CateringSettings) {
  const products =
    settings?.products?.length && settings.products.some((product) => product.active)
      ? settings.products.filter((product) => product.active).map(configToProduct)
      : CATERING_PRODUCTS;

  const maxOnlineServings = settings?.maxOnlineServings ?? MAX_ONLINE_SERVINGS;
  const largeGroupEmail = settings?.largeGroupEmail ?? LARGE_GROUP_EMAIL;

  return {
    products,
    maxOnlineServings,
    largeGroupEmail,
    getProduct(id: string) {
      return products.find((product) => product.id === id);
    },
    productsByCategory(categoryId: CateringCategoryId) {
      return products.filter((product) => product.categoryId === categoryId);
    }
  };
}

export type ResolvedCateringCatalog = ReturnType<typeof resolveCateringCatalog>;
