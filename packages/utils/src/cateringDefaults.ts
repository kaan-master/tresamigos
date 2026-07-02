import type { CateringProductConfig, CateringSettings } from "@tresamigos/types";

function servings(extras: number[]) {
  return [10, 15, 20, 25, 30].map((count, index) => ({
    servings: count,
    extraCents: Math.round(extras[index] * 100)
  }));
}

function buffet(
  tier: CateringProductConfig["tier"],
  name: string,
  description: string,
  baseEuro: number,
  extras: number[],
  image: string
): CateringProductConfig {
  return {
    id: `buffet-${tier}`,
    categoryId: "buffet",
    name,
    description,
    image,
    basePriceCents: baseEuro * 100,
    active: true,
    tier,
    configurable: true,
    servingOptions: servings(extras)
  };
}

function burrito(
  tier: CateringProductConfig["tier"],
  name: string,
  description: string,
  baseEuro: number,
  extras: number[],
  image: string
): CateringProductConfig {
  return {
    id: `burrito-${tier}`,
    categoryId: "burrito",
    name,
    description,
    image,
    basePriceCents: baseEuro * 100,
    active: true,
    tier,
    configurable: true,
    servingOptions: servings(extras)
  };
}

function simple(
  id: string,
  categoryId: CateringProductConfig["categoryId"],
  name: string,
  description: string,
  image: string,
  priceCents: number
): CateringProductConfig {
  return {
    id,
    categoryId,
    name,
    description,
    image,
    basePriceCents: priceCents,
    active: true,
    configurable: false,
    servingOptions: []
  };
}

export const DEFAULT_CATERING_PRODUCTS: CateringProductConfig[] = [
  buffet("budget", "Budget buffet", "Rijst en bonen. 1 eiwit, 1 topping, 1 salsa, 1 tortilla.", 120, [0, 60, 110, 160, 210], "/assets/menu/Jackfruit-bowl-2-e1751149625253-150x150.jpg"),
  buffet("single", "Single buffet", "Rijst en bonen. 1 eiwit, 2 toppings, 2 salsa's, guacamole of room, 1 tortilla.", 150, [0, 75, 150, 225, 300], "/assets/menu/pulled-chicken-burrito-150x150.jpg"),
  buffet("double", "Double buffet", "Rijst en bonen. 2 eiwitten, 2 toppings, 2 salsa's, guacamole of room, 1 tortilla.", 170, [0, 85, 170, 255, 340], "/assets/menu/pulled-beef-taco-150x150.jpg"),
  buffet("triple", "Triple buffet", "Rijst en bonen. 3 eiwitten, 3 toppings, 3 salsa's, guacamole én room, meerdere tortilla's.", 200, [0, 100, 200, 300, 400], "/assets/menu/cheese-quesedilla-2-150x150.jpg"),
  burrito("single", "Single burrito box", "Rijst, bonen en kaas. 1 eiwit, 2 toppings, 2 salsa's.", 150, [0, 75, 150, 225, 300], "/assets/menu/pulled-chicken-burrito-150x150.jpg"),
  burrito("double", "Double burrito box", "Rijst, bonen en kaas. 1 eiwit, 2 toppings, 2 salsa's.", 165, [0, 82.5, 165, 247.5, 330], "/assets/menu/pulled-beef-taco-150x150.jpg"),
  burrito("triple", "Triple burrito box", "Rijst, bonen en kaas. 1 eiwit, 3 toppings, 3 salsa's.", 180, [0, 90, 180, 270, 360], "/assets/menu/cheese-quesedilla-2-150x150.jpg"),
  simple("drink-jarritos-cola", "drinks", "Jarritos Mexican cola", "370ml", "/assets/brand/breakfast-lunch-dinner.png", 395),
  simple("drink-jarritos-lime", "drinks", "Jarritos lime", "370ml", "/assets/brand/breakfast-lunch-dinner.png", 395),
  simple("drink-coca-cola", "drinks", "Coca-Cola", "330ml", "/assets/brand/breakfast-lunch-dinner.png", 300),
  simple("drink-spa-blauw", "drinks", "Spa blauw", "Stille water", "/assets/brand/breakfast-lunch-dinner.png", 300),
  simple("sauce-chipotle", "sauces", "Homemade chipotle sauce", "Extra portie", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 100),
  simple("sauce-garlic", "sauces", "Homemade garlic sauce", "Extra portie", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 100),
  simple("sauce-guacamole", "sauces", "Guacamole", "Extra portie", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 250),
  simple("team-thanks-050", "team-thanks", "Team bedankje €0,50", "Klein bedankje voor het team", "/assets/brand/breakfast-lunch-dinner.png", 50),
  simple("team-thanks-100", "team-thanks", "Team bedankje €1,00", "Groter bedankje voor het team", "/assets/brand/breakfast-lunch-dinner.png", 100)
];

export const DEFAULT_CATERING_SETTINGS: CateringSettings = {
  maxOnlineServings: 30,
  largeGroupEmail: "info@tresamigos.nl",
  products: DEFAULT_CATERING_PRODUCTS
};
