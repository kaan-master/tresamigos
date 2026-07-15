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

const DRINK_IMG = "/assets/catering/drinks/drinks-cover.webp";

export const CATERING_PRODUCTS: CateringProduct[] = [
  buffetProduct("budget", 120, [0, 60, 110, 160, 210], "/assets/catering/packages/buffet-budget.png"),
  buffetProduct("single", 150, [0, 75, 150, 225, 300], "/assets/catering/packages/buffet-single.png"),
  buffetProduct("double", 170, [0, 85, 170, 255, 340], "/assets/catering/packages/buffet-double.png"),
  buffetProduct("triple", 200, [0, 100, 200, 300, 400], "/assets/catering/packages/buffet-triple.png"),
  burritoProduct("single", 150, [0, 75, 150, 225, 300], "/assets/catering/packages/burrito-single.png"),
  burritoProduct("double", 165, [0, 82.5, 165, 247.5, 330], "/assets/catering/packages/burrito-double.png"),
  burritoProduct("triple", 180, [0, 90, 180, 270, 360], "/assets/catering/packages/burrito-triple.png"),
  simpleProduct("drink-jarritos-cola", "drinks", "catering.drink.jarritosCola", "catering.drink.softDesc", DRINK_IMG, 395),
  simpleProduct("drink-jarritos-fruit-punch", "drinks", "catering.drink.jarritosFruitPunch", "catering.drink.softDesc", DRINK_IMG, 395),
  simpleProduct("drink-jarritos-lime", "drinks", "catering.drink.jarritosLime", "catering.drink.softDesc", DRINK_IMG, 395),
  simpleProduct("drink-jarritos-passion-fruit", "drinks", "catering.drink.jarritosPassionFruit", "catering.drink.softDesc", DRINK_IMG, 395),
  simpleProduct("drink-jarritos-mandarin", "drinks", "catering.drink.jarritosMandarin", "catering.drink.softDesc", DRINK_IMG, 395),
  simpleProduct("drink-jarritos-strawberry", "drinks", "catering.drink.jarritosStrawberry", "catering.drink.softDesc", DRINK_IMG, 395),
  simpleProduct("drink-jarritos-guava", "drinks", "catering.drink.jarritosGuava", "catering.drink.softDesc", DRINK_IMG, 395),
  simpleProduct("drink-jarritos-pineapple", "drinks", "catering.drink.jarritosPineapple", "catering.drink.softDesc", DRINK_IMG, 395),
  simpleProduct("drink-coca-cola", "drinks", "catering.drink.cocaCola", "catering.drink.cocaColaDesc", DRINK_IMG, 300),
  simpleProduct("drink-coca-cola-zero", "drinks", "catering.drink.cocaColaZero", "catering.drink.cocaColaZeroDesc", DRINK_IMG, 300),
  simpleProduct("drink-fanta-exotic", "drinks", "catering.drink.fantaExotic", "catering.drink.fantaExoticDesc", DRINK_IMG, 300),
  simpleProduct("drink-lipton-green", "drinks", "catering.drink.liptonGreen", "catering.drink.iceTeaDesc", DRINK_IMG, 300),
  simpleProduct("drink-lipton-peach", "drinks", "catering.drink.liptonPeach", "catering.drink.iceTeaDesc", DRINK_IMG, 300),
  simpleProduct("drink-spa-blauw", "drinks", "catering.drink.spaBlauw", "catering.drink.spaBlauwDesc", DRINK_IMG, 300),
  simpleProduct("drink-red-bull", "drinks", "catering.drink.redBull", "catering.drink.redBullDesc", DRINK_IMG, 395),
  simpleProduct("drink-spa-rood", "drinks", "catering.drink.spaRood", "catering.drink.spaRoodDesc", DRINK_IMG, 300),
  simpleProduct("drink-fanta-orange", "drinks", "catering.drink.fantaOrange", "catering.drink.fantaOrangeDesc", DRINK_IMG, 300),
  simpleProduct("drink-spa-strawberry-watermelon", "drinks", "catering.drink.spaStrawberryWatermelon", "catering.drink.spaFlavouredDesc", DRINK_IMG, 395),
  simpleProduct("sauce-chipotle", "sauces", "catering.sauce.chipotle", "catering.sauce.chipotleDesc", "/assets/catering/sauces/chipotle.png", 100),
  simpleProduct("sauce-garlic", "sauces", "catering.sauce.garlic", "catering.sauce.garlicDesc", "/assets/catering/sauces/garlic.png", 100),
  simpleProduct("sauce-el-cielo", "sauces", "catering.sauce.elCielo", "catering.sauce.elCieloDesc", "/assets/catering/sauces/el-cielo.png", 100),
  simpleProduct("sauce-cilantro", "sauces", "catering.sauce.cilantro", "catering.sauce.cilantroDesc", "/assets/catering/ingredients/cilantro.png", 150),
  simpleProduct("sauce-sour-cream", "sauces", "catering.sauce.sourCream", "catering.sauce.sourCreamDesc", "/assets/catering/sauces/sour-cream.png", 250),
  simpleProduct("sauce-guacamole", "sauces", "catering.sauce.guacamole", "catering.sauce.guacamoleDesc", "/assets/catering/sauces/guacamole.png", 250),
  simpleProduct("sauce-salsa-verde", "sauces", "catering.sauce.salsaVerde", "catering.sauce.salsaVerdeDesc", "/assets/catering/sauces/salsa-verde.png", 150),
  simpleProduct("sauce-habanero", "sauces", "catering.sauce.habanero", "catering.sauce.habaneroDesc", "/assets/catering/sauces/habanero.png", 150),
  simpleProduct("sauce-mayonnaise", "sauces", "catering.sauce.mayonnaise", "catering.sauce.mayoKetchupDesc", "/assets/catering/sauces/sour-cream.png", 100),
  simpleProduct("sauce-ketchup", "sauces", "catering.sauce.ketchup", "catering.sauce.mayoKetchupDesc", "/assets/catering/sauces/birria.png", 100),
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
export const LARGE_GROUP_EMAIL = "catering@tresamigos.nl";
