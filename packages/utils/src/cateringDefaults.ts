import type {
  CateringCategoryConfig,
  CateringFormFieldConfig,
  CateringIngredientConfig,
  CateringIngredientGroup,
  CateringLocalizedText,
  CateringNotificationsSettings,
  CateringProductConfig,
  CateringFulfillmentSettings,
  CateringSettings
} from "@tresamigos/types";

function text(nl: string, en: string): CateringLocalizedText {
  return { nl, en };
}

function servings(extras: number[]) {
  return [10, 15, 20, 25, 30].map((count, index) => ({
    servings: count,
    extraCents: Math.round(extras[index] * 100)
  }));
}

function buffet(
  tier: CateringProductConfig["tier"],
  name: CateringLocalizedText,
  description: CateringLocalizedText,
  baseEuro: number,
  extras: number[],
  image: string,
  sortOrder: number
): CateringProductConfig {
  return {
    id: `buffet-${tier}`,
    categoryId: "buffet",
    name,
    description,
    image,
    basePriceCents: baseEuro * 100,
    active: true,
    sortOrder,
    minServings: 10,
    maxServings: 30,
    tier,
    configurable: true,
    servingOptions: servings(extras)
  };
}

function burrito(
  tier: CateringProductConfig["tier"],
  name: CateringLocalizedText,
  description: CateringLocalizedText,
  baseEuro: number,
  extras: number[],
  image: string,
  sortOrder: number
): CateringProductConfig {
  return {
    id: `burrito-${tier}`,
    categoryId: "burrito",
    name,
    description,
    image,
    basePriceCents: baseEuro * 100,
    active: true,
    sortOrder,
    minServings: 10,
    maxServings: 30,
    tier,
    configurable: true,
    servingOptions: servings(extras)
  };
}

function simple(
  id: string,
  categoryId: CateringProductConfig["categoryId"],
  name: CateringLocalizedText,
  description: CateringLocalizedText,
  image: string,
  priceCents: number,
  sortOrder: number
): CateringProductConfig {
  return {
    id,
    categoryId,
    name,
    description,
    image,
    basePriceCents: priceCents,
    active: true,
    sortOrder,
    minServings: 1,
    maxServings: 99,
    configurable: false,
    servingOptions: []
  };
}

export const DEFAULT_CATERING_CATEGORIES: CateringCategoryConfig[] = [
  { id: "buffet", label: text("Buffet catering", "Buffet Catering"), sortOrder: 0, visible: true },
  { id: "burrito", label: text("Burrito catering", "Burrito Catering"), sortOrder: 1, visible: true },
  { id: "drinks", label: text("Drinken", "Drinks"), sortOrder: 2, visible: true },
  { id: "sauces", label: text("Sauzen", "Sauces"), sortOrder: 3, visible: true },
  { id: "team-thanks", label: text("Team bedankje", "Team thank-you"), sortOrder: 4, visible: true }
];

export const DEFAULT_CATERING_FORM_FIELDS: CateringFormFieldConfig[] = [
  { id: "name", label: text("Naam", "Name"), enabled: true, required: true },
  { id: "company", label: text("Bedrijf", "Company"), enabled: true, required: false },
  { id: "email", label: text("E-mail", "Email"), enabled: true, required: true },
  { id: "phone", label: text("Telefoon", "Phone"), enabled: true, required: false },
  { id: "eventDate", label: text("Datum event", "Event date"), enabled: true, required: true },
  { id: "eventTime", label: text("Tijd event", "Event time"), enabled: true, required: true },
  { id: "servings", label: text("Aantal personen", "Number of guests"), enabled: true, required: true },
  { id: "location", label: text("Locatie / adres", "Location / address"), enabled: true, required: true },
  { id: "notes", label: text("Opmerkingen", "Notes"), enabled: true, required: false }
];

export const DEFAULT_CATERING_NOTIFICATIONS: CateringNotificationsSettings = {
  recipientEmail: "info@tresamigos.nl",
  notifyOnNewOrder: true,
  notifyOnStatusChange: false
};

function ingredient(
  id: string,
  group: CateringIngredientGroup,
  nl: string,
  en: string,
  image: string,
  sortOrder: number
): CateringIngredientConfig {
  return {
    id,
    group,
    label: text(nl, en),
    image,
    active: true,
    sortOrder
  };
}

export const DEFAULT_CATERING_INGREDIENTS: CateringIngredientConfig[] = [
  ingredient("pulled-chicken", "protein", "Pulled chicken", "Pulled chicken", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 0),
  ingredient("pulled-beef", "protein", "Pulled beef", "Pulled beef", "/assets/menu/pulled-beef-taco-150x150.jpg", 1),
  ingredient("ground-beef", "protein", "Ground beef", "Ground beef", "/assets/menu/pulled-beef-taco-150x150.jpg", 2),
  ingredient("jackfruit", "protein", "Jackfruit", "Jackfruit", "/assets/menu/Jackfruit-bowl-2-e1751149625253-150x150.jpg", 3),
  ingredient("cilantro", "buffetTopping", "Cilantro", "Cilantro", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 0),
  ingredient("jalapeno-crunch", "buffetTopping", "Jalapeño Crunch", "Jalapeño Crunch", "/assets/menu/pulled-beef-taco-150x150.jpg", 1),
  ingredient("pico-de-gallo", "buffetTopping", "Pico de gallo", "Pico de gallo", "/assets/menu/cheese-quesedilla-2-150x150.jpg", 2),
  ingredient("mexican-corn-salad", "buffetTopping", "Mexican Corn Salad", "Mexican Corn Salad", "/assets/menu/Jackfruit-bowl-2-e1751149625253-150x150.jpg", 3),
  ingredient("cebolla-fresca", "buffetTopping", "Cebolla Fresca", "Cebolla Fresca", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 4),
  ingredient("corn", "burritoTopping", "Corn", "Corn", "/assets/menu/Jackfruit-bowl-2-e1751149625253-150x150.jpg", 0),
  ingredient("pico-burrito", "burritoTopping", "Pico de Gallo", "Pico de Gallo", "/assets/menu/cheese-quesedilla-2-150x150.jpg", 1),
  ingredient("bell-peppers", "burritoTopping", "Bell peppers", "Bell peppers", "/assets/menu/pulled-beef-taco-150x150.jpg", 2),
  ingredient("diced-onion", "burritoTopping", "Diced Onion", "Diced Onion", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 3),
  ingredient("lettuce", "burritoTopping", "Lettuce", "Lettuce", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 4),
  ingredient("jalapeno", "burritoTopping", "Jalapeño", "Jalapeño", "/assets/menu/pulled-beef-taco-150x150.jpg", 5),
  ingredient("pickled-onions", "burritoTopping", "Pickled Onions", "Pickled Onions", "/assets/menu/cheese-quesedilla-2-150x150.jpg", 6),
  ingredient("chipotle", "sauce", "Chipotle", "Chipotle", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 0),
  ingredient("garlic-sauce", "sauce", "Garlic sauce", "Garlic sauce", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 1),
  ingredient("el-cielo", "sauce", "El cielo", "El cielo", "/assets/menu/pulled-beef-taco-150x150.jpg", 2),
  ingredient("salsa-verde", "sauce", "Salsa verde", "Salsa verde", "/assets/menu/Jackfruit-bowl-2-e1751149625253-150x150.jpg", 3),
  ingredient("salsa-cilantro", "sauce", "Salsa Cilantro", "Salsa Cilantro", "/assets/menu/cheese-quesedilla-2-150x150.jpg", 4),
  ingredient("tortilla-30", "tortilla", "Tortilla 30cm", "Tortilla 30cm", "/assets/menu/cheese-quesedilla-2-150x150.jpg", 0),
  ingredient("tortilla-16", "tortilla", "Tortilla 16cm", "Tortilla 16cm", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 1),
  ingredient("guacamole", "cream", "Guacamole", "Guacamole", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 0),
  ingredient("sour-cream", "cream", "Sour cream", "Sour cream", "/assets/menu/pulled-beef-taco-150x150.jpg", 1),
  ingredient("cream-none", "cream", "None", "None", "/assets/brand/breakfast-lunch-dinner.png", 2),
  ingredient("guac-and-sour", "tripleCream", "Guacamole and sour cream", "Guacamole and sour cream", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 0),
  ingredient("double-guac", "tripleCream", "Double Guacamole", "Double Guacamole", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 1),
  ingredient("double-sour", "tripleCream", "Double sour cream", "Double sour cream", "/assets/menu/pulled-beef-taco-150x150.jpg", 2),
  ingredient("triple-cream-none", "tripleCream", "None", "None", "/assets/brand/breakfast-lunch-dinner.png", 3)
];

export const DEFAULT_CATERING_PRODUCTS: CateringProductConfig[] = [
  buffet("budget", text("Budget buffet", "Budget buffet"), text("Rijst en bonen. 1 eiwit, 1 topping, 1 salsa, 1 tortilla.", "Rice and beans. 1 protein, 1 topping, 1 sauce, 1 tortilla."), 120, [0, 60, 110, 160, 210], "/assets/menu/Jackfruit-bowl-2-e1751149625253-150x150.jpg", 0),
  buffet("single", text("Single buffet", "Single buffet"), text("Rijst en bonen. 1 eiwit, 2 toppings, 2 salsa's.", "Rice and beans. 1 protein, 2 toppings, 2 sauces."), 150, [0, 75, 150, 225, 300], "/assets/menu/pulled-chicken-burrito-150x150.jpg", 1),
  buffet("double", text("Double buffet", "Double buffet"), text("Rijst en bonen. 2 eiwitten, 2 toppings, 2 salsa's.", "Rice and beans. 2 proteins, 2 toppings, 2 sauces."), 170, [0, 85, 170, 255, 340], "/assets/menu/pulled-beef-taco-150x150.jpg", 2),
  buffet("triple", text("Triple buffet", "Triple buffet"), text("Rijst en bonen. 3 eiwitten, 3 toppings, 3 salsa's.", "Rice and beans. 3 proteins, 3 toppings, 3 sauces."), 200, [0, 100, 200, 300, 400], "/assets/menu/cheese-quesedilla-2-150x150.jpg", 3),
  burrito("single", text("Single burrito box", "Single burrito box"), text("Rijst, bonen en kaas. 1 eiwit, 2 toppings, 2 salsa's.", "Rice, beans and cheese. 1 protein, 2 toppings, 2 sauces."), 150, [0, 75, 150, 225, 300], "/assets/menu/pulled-chicken-burrito-150x150.jpg", 0),
  burrito("double", text("Double burrito box", "Double burrito box"), text("Rijst, bonen en kaas. 1 eiwit, 2 toppings, 2 salsa's.", "Rice, beans and cheese. 1 protein, 2 toppings, 2 sauces."), 165, [0, 82.5, 165, 247.5, 330], "/assets/menu/pulled-beef-taco-150x150.jpg", 1),
  burrito("triple", text("Triple burrito box", "Triple burrito box"), text("Rijst, bonen en kaas. 1 eiwit, 3 toppings, 3 salsa's.", "Rice, beans and cheese. 1 protein, 3 toppings, 3 sauces."), 180, [0, 90, 180, 270, 360], "/assets/menu/cheese-quesedilla-2-150x150.jpg", 2),
  simple("drink-jarritos-cola", "drinks", text("Jarritos Mexican cola", "Jarritos Mexican cola"), text("370ml", "370ml"), "/assets/brand/breakfast-lunch-dinner.png", 395, 0),
  simple("drink-jarritos-lime", "drinks", text("Jarritos lime", "Jarritos lime"), text("370ml", "370ml"), "/assets/brand/breakfast-lunch-dinner.png", 395, 1),
  simple("drink-coca-cola", "drinks", text("Coca-Cola", "Coca-Cola"), text("330ml", "330ml"), "/assets/brand/breakfast-lunch-dinner.png", 300, 2),
  simple("drink-spa-blauw", "drinks", text("Spa blauw", "Spa blauw"), text("Stille water", "Still water"), "/assets/brand/breakfast-lunch-dinner.png", 300, 3),
  simple("sauce-chipotle", "sauces", text("Homemade chipotle sauce", "Homemade chipotle sauce"), text("Extra portie", "Extra portion"), "/assets/menu/pulled-chicken-burrito-150x150.jpg", 100, 0),
  simple("sauce-garlic", "sauces", text("Homemade garlic sauce", "Homemade garlic sauce"), text("Extra portie", "Extra portion"), "/assets/menu/pulled-chicken-burrito-150x150.jpg", 100, 1),
  simple("sauce-guacamole", "sauces", text("Guacamole", "Guacamole"), text("Extra portie", "Extra portion"), "/assets/menu/pulled-chicken-burrito-150x150.jpg", 250, 2),
  simple("team-thanks-050", "team-thanks", text("Team bedankje €0,50", "Team thank-you €0.50"), text("Klein bedankje", "Small thank-you"), "/assets/brand/breakfast-lunch-dinner.png", 50, 0),
  simple("team-thanks-100", "team-thanks", text("Team bedankje €1,00", "Team thank-you €1.00"), text("Groter bedankje", "Larger thank-you"), "/assets/brand/breakfast-lunch-dinner.png", 100, 1)
];

export const DEFAULT_CATERING_FULFILLMENT: CateringFulfillmentSettings = {
  pickup: { enabled: true, openTime: "11:00", closeTime: "22:30" },
  delivery: { enabled: true, openTime: "17:00", closeTime: "22:30" }
};

export const DEFAULT_CATERING_SETTINGS: CateringSettings = {
  maxOnlineServings: 30,
  largeGroupEmail: "info@tresamigos.nl",
  categories: DEFAULT_CATERING_CATEGORIES,
  products: DEFAULT_CATERING_PRODUCTS,
  ingredients: DEFAULT_CATERING_INGREDIENTS,
  formFields: DEFAULT_CATERING_FORM_FIELDS,
  notifications: DEFAULT_CATERING_NOTIFICATIONS,
  fulfillment: DEFAULT_CATERING_FULFILLMENT
};
