import type { CateringCategoryId, CateringPackageTier } from "@tresamigos/types";

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

export const CATERING_CATEGORIES: { id: CateringCategoryId; labelKey: string }[] = [
  { id: "buffet", labelKey: "catering.cat.buffet" },
  { id: "burrito", labelKey: "catering.cat.burrito" },
  { id: "drinks", labelKey: "catering.cat.drinks" },
  { id: "sauces", labelKey: "catering.cat.sauces" },
  { id: "team-thanks", labelKey: "catering.cat.teamThanks" }
];

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

const buffetServings = (extras: number[]) =>
  [10, 15, 20, 25, 30].map((servings, index) => ({
    servings,
    extraCents: extras[index] * 100,
    labelKey: `catering.servings.${servings}`
  }));

const burritoServings = (extras: number[]) =>
  [10, 15, 20, 25, 30].map((servings, index) => ({
    servings,
    extraCents: extras[index] * 100,
    labelKey: `catering.servings.${servings}`
  }));

function buffetProduct(tier: CateringPackageTier, baseEuro: number, extras: number[], image: string): CateringProduct {
  return {
    id: `buffet-${tier}`,
    categoryId: "buffet",
    nameKey: `catering.tier.${tier}`,
    descKey: `catering.tier.${tier}BuffetDesc`,
    image,
    basePriceCents: baseEuro * 100,
    tier,
    configurable: true,
    servingOptions: buffetServings(extras)
  };
}

function burritoProduct(tier: CateringPackageTier, baseEuro: number, extras: number[], image: string): CateringProduct {
  return {
    id: `burrito-${tier}`,
    categoryId: "burrito",
    nameKey: `catering.tier.${tier}`,
    descKey: `catering.tier.${tier}BurritoDesc`,
    image,
    basePriceCents: baseEuro * 100,
    tier,
    configurable: true,
    servingOptions: burritoServings(extras)
  };
}

function simpleProduct(
  id: string,
  categoryId: CateringCategoryId,
  nameKey: string,
  descKey: string,
  image: string,
  priceCents: number
): CateringProduct {
  return {
    id,
    categoryId,
    nameKey,
    descKey,
    image,
    basePriceCents: priceCents,
    configurable: false
  };
}

export const CATERING_PRODUCTS: CateringProduct[] = [
  buffetProduct("budget", 120, [0, 60, 110, 160, 210], "/assets/menu/Jackfruit-bowl-2-e1751149625253-150x150.jpg"),
  buffetProduct("single", 150, [0, 75, 150, 225, 300], "/assets/menu/pulled-chicken-burrito-150x150.jpg"),
  buffetProduct("double", 170, [0, 85, 170, 255, 340], "/assets/menu/pulled-beef-taco-150x150.jpg"),
  buffetProduct("triple", 200, [0, 100, 200, 300, 400], "/assets/menu/cheese-quesedilla-2-150x150.jpg"),
  burritoProduct("single", 150, [0, 75, 150, 225, 300], "/assets/menu/pulled-chicken-burrito-150x150.jpg"),
  burritoProduct("double", 165, [0, 82.5, 165, 247.5, 330], "/assets/menu/pulled-beef-taco-150x150.jpg"),
  burritoProduct("triple", 180, [0, 90, 180, 270, 360], "/assets/menu/cheese-quesedilla-2-150x150.jpg"),
  simpleProduct("drink-jarritos-cola", "drinks", "catering.drink.jarritosCola", "catering.drink.jarritosColaDesc", "/assets/brand/breakfast-lunch-dinner.png", 395),
  simpleProduct("drink-jarritos-lime", "drinks", "catering.drink.jarritosLime", "catering.drink.jarritosLimeDesc", "/assets/brand/breakfast-lunch-dinner.png", 395),
  simpleProduct("drink-coca-cola", "drinks", "catering.drink.cocaCola", "catering.drink.cocaColaDesc", "/assets/brand/breakfast-lunch-dinner.png", 300),
  simpleProduct("drink-spa-blauw", "drinks", "catering.drink.spaBlauw", "catering.drink.spaBlauwDesc", "/assets/brand/breakfast-lunch-dinner.png", 300),
  simpleProduct("sauce-chipotle", "sauces", "catering.sauce.chipotle", "catering.sauce.chipotleDesc", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 100),
  simpleProduct("sauce-garlic", "sauces", "catering.sauce.garlic", "catering.sauce.garlicDesc", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 100),
  simpleProduct("sauce-guacamole", "sauces", "catering.sauce.guacamole", "catering.sauce.guacamoleDesc", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 250),
  simpleProduct("team-thanks-050", "team-thanks", "catering.team.thanks050", "catering.team.thanks050Desc", "/assets/brand/breakfast-lunch-dinner.png", 50),
  simpleProduct("team-thanks-100", "team-thanks", "catering.team.thanks100", "catering.team.thanks100Desc", "/assets/brand/breakfast-lunch-dinner.png", 100)
];

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
export const LARGE_GROUP_EMAIL = "info@tresamigos.nl";
