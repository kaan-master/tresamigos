import type { CateringCategoryId, CateringPackageTier } from "@tresamigos/types";
import { DEFAULT_CATERING_CATEGORIES, DEFAULT_CATERING_PRODUCTS } from "@tresamigos/utils";

export type FulfillmentMode = "pickup" | "delivery";

export interface ServingOption {
  servings: number;
  extraCents: number;
  labelKey: string;
}

export interface PackageRules {
  proteins: number;
  toppings: number;
  sauces: number;
  tortillas: number;
  cream: "none" | "or" | "and";
}

export interface CateringProduct {
  id: string;
  categoryId: CateringCategoryId;
  nameKey: string;
  descKey: string;
  image: string;
  basePriceCents: number;
  tier?: CateringPackageTier;
  configurable: boolean;
  servingOptions?: ServingOption[];
}

const CATEGORY_LABEL_KEYS: Record<CateringCategoryId, string> = {
  buffet: "catering.cat.buffet",
  burrito: "catering.cat.burrito",
  tacos: "catering.cat.tacos",
  burritos: "catering.cat.burritos",
  quesadillas: "catering.cat.quesadillas",
  "burrito-bowls": "catering.cat.burritoBowls",
  sides: "catering.cat.sides",
  sauces: "catering.cat.sauces",
  desserts: "catering.cat.desserts",
  drinks: "catering.cat.drinks",
  deals: "catering.cat.deals",
  "team-thanks": "catering.cat.teamThanks"
};

export const CATERING_CATEGORIES: { id: CateringCategoryId; labelKey: string }[] = DEFAULT_CATERING_CATEGORIES.map(
  (category) => ({
    id: category.id,
    labelKey: CATEGORY_LABEL_KEYS[category.id]
  })
);

export const PROTEINS = ["Pulled chicken", "Pulled beef", "Ground beef", "Jackfruit"] as const;
export const BUFFET_TOPPINGS = ["Cilantro", "Jalapeño Crunch", "Pico de gallo", "Mexican Corn Salad", "Cebolla Fresca"] as const;
export const BURRITO_TOPPINGS = ["Corn", "Pico de Gallo", "Bell peppers", "Diced Onion", "Lettuce", "Jalapeño", "Pickled Onions"] as const;
export const SAUCES = ["Chipotle", "Garlic sauce", "El cielo", "Salsa verde", "Salsa Cilantro"] as const;
export const TORTILLAS = ["Tortilla 30cm", "Tortilla 16cm"] as const;
export const CREAM_OPTIONS = ["Guacamole", "Sour cream", "None"] as const;
export const TRIPLE_CREAM_OPTIONS = ["Guacamole and sour cream", "Double Guacamole", "Double sour cream", "None"] as const;

export const PACKAGE_RULES: Record<CateringPackageTier, PackageRules> = {
  budget: { proteins: 1, toppings: 1, sauces: 1, tortillas: 1, cream: "none" },
  single: { proteins: 1, toppings: 2, sauces: 2, tortillas: 1, cream: "or" },
  double: { proteins: 2, toppings: 2, sauces: 2, tortillas: 1, cream: "or" },
  triple: { proteins: 3, toppings: 3, sauces: 3, tortillas: 2, cream: "and" }
};

/** Burrito keuzelimieten (afwijkend van buffet per tier). */
export const BURRITO_PACKAGE_RULES: Record<Exclude<CateringPackageTier, "budget">, PackageRules> = {
  single: { proteins: 1, toppings: 1, sauces: 1, tortillas: 0, cream: "none" },
  double: { proteins: 1, toppings: 2, sauces: 2, tortillas: 0, cream: "none" },
  triple: { proteins: 1, toppings: 3, sauces: 3, tortillas: 0, cream: "none" }
};

export function packageRulesFor(categoryId: CateringCategoryId, tier: CateringPackageTier): PackageRules {
  if (categoryId === "burrito" && tier !== "budget") {
    return BURRITO_PACKAGE_RULES[tier];
  }
  return PACKAGE_RULES[tier];
}

export const CATERING_PRODUCTS: CateringProduct[] = DEFAULT_CATERING_PRODUCTS.filter((product) => product.active).map(
  (product) => ({
    id: product.id,
    categoryId: product.categoryId,
    nameKey: product.name.en,
    descKey: product.description.en,
    image: product.image,
    basePriceCents: product.basePriceCents,
    tier: product.tier,
    configurable: product.configurable,
    servingOptions: product.servingOptions.length
      ? product.servingOptions.map((option) => ({
          servings: option.servings,
          extraCents: option.extraCents,
          labelKey: `catering.servings.${option.servings}`
        }))
      : undefined
  })
);

export function getProduct(id: string) {
  return CATERING_PRODUCTS.find((product) => product.id === id);
}

export function productsByCategory(categoryId: CateringCategoryId) {
  return CATERING_PRODUCTS.filter((product) => product.categoryId === categoryId);
}

export function toppingsForCategory(categoryId: CateringCategoryId) {
  return categoryId === "burrito" ? BURRITO_TOPPINGS : BUFFET_TOPPINGS;
}

export const MAX_ONLINE_SERVINGS = 30;
export const LARGE_GROUP_EMAIL = "catering@tresamigos.nl";
