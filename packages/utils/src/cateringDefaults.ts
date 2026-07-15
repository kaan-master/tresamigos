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
  ingredient("pulled-chicken", "protein", "Pulled chicken", "Pulled chicken", "/assets/catering/ingredients/pulled-chicken.png", 0),
  ingredient("pulled-beef", "protein", "Pulled beef", "Pulled beef", "/assets/catering/ingredients/pulled-beef.png", 1),
  ingredient("ground-beef", "protein", "Ground beef", "Ground beef", "/assets/catering/ingredients/ground-beef.png", 2),
  ingredient("jackfruit", "protein", "Jackfruit", "Jackfruit", "/assets/catering/ingredients/jackfruit.png", 3),
  ingredient("cilantro", "buffetTopping", "Cilantro", "Cilantro", "/assets/catering/ingredients/cilantro.png", 0),
  ingredient("jalapeno-crunch", "buffetTopping", "Jalapeño Crunch", "Jalapeño Crunch", "/assets/catering/ingredients/jalapeno-crunch.png", 1),
  ingredient("pico-de-gallo", "buffetTopping", "Pico de gallo", "Pico de gallo", "/assets/catering/ingredients/pico-de-gallo.png", 2),
  ingredient("mexican-corn-salad", "buffetTopping", "Mexican Corn Salad", "Mexican Corn Salad", "/assets/catering/ingredients/mexican-corn-salad.png", 3),
  ingredient("cebolla-fresca", "buffetTopping", "Cebolla Fresca", "Cebolla Fresca", "/assets/catering/ingredients/cebolla-fresca.png", 4),
  ingredient("corn", "burritoTopping", "Corn", "Corn", "/assets/catering/ingredients/corn.png", 0),
  ingredient("pico-burrito", "burritoTopping", "Pico de Gallo", "Pico de Gallo", "/assets/catering/ingredients/pico-de-gallo.png", 1),
  ingredient("bell-peppers", "burritoTopping", "Bell peppers", "Bell peppers", "/assets/catering/ingredients/bell-peppers.png", 2),
  ingredient("diced-onion", "burritoTopping", "Diced Onion", "Diced Onion", "/assets/catering/ingredients/diced-onion.png", 3),
  ingredient("lettuce", "burritoTopping", "Lettuce", "Lettuce", "/assets/catering/ingredients/lettuce.png", 4),
  ingredient("jalapeno", "burritoTopping", "Jalapeño", "Jalapeño", "/assets/catering/ingredients/jalapeno.png", 5),
  ingredient("pickled-onions", "burritoTopping", "Pickled Onions", "Pickled Onions", "/assets/catering/ingredients/pickled-onions.png", 6),
  ingredient("chipotle", "sauce", "Chipotle", "Chipotle", "/assets/catering/sauces/chipotle.png", 0),
  ingredient("garlic-sauce", "sauce", "Garlic sauce", "Garlic sauce", "/assets/catering/sauces/garlic.png", 1),
  ingredient("el-cielo", "sauce", "El cielo", "El cielo", "/assets/catering/sauces/el-cielo.png", 2),
  ingredient("salsa-verde", "sauce", "Salsa verde", "Salsa verde", "/assets/catering/sauces/salsa-verde.png", 3),
  ingredient("salsa-cilantro", "sauce", "Salsa Cilantro", "Salsa Cilantro", "/assets/catering/ingredients/cilantro.png", 4),
  ingredient("tortilla-30", "tortilla", "Tortilla 30cm", "Tortilla 30cm", "/assets/menu/cheese-quesedilla-2-150x150.jpg", 0),
  ingredient("tortilla-16", "tortilla", "Tortilla 16cm", "Tortilla 16cm", "/assets/menu/pulled-chicken-burrito-150x150.jpg", 1),
  ingredient("guacamole", "cream", "Guacamole", "Guacamole", "/assets/catering/ingredients/guacamole.png", 0),
  ingredient("sour-cream", "cream", "Sour cream", "Sour cream", "/assets/catering/ingredients/sour-cream.png", 1),
  ingredient("cream-none", "cream", "None", "None", "/assets/brand/breakfast-lunch-dinner.png", 2),
  ingredient("guac-and-sour", "tripleCream", "Guacamole and sour cream", "Guacamole and sour cream", "/assets/catering/ingredients/guac-and-sour.png", 0),
  ingredient("double-guac", "tripleCream", "Double Guacamole", "Double Guacamole", "/assets/catering/ingredients/double-guac.png", 1),
  ingredient("double-sour", "tripleCream", "Double sour cream", "Double sour cream", "/assets/catering/ingredients/double-sour.png", 2),
  ingredient("triple-cream-none", "tripleCream", "None", "None", "/assets/brand/breakfast-lunch-dinner.png", 3)
];

const BUFFET_BUDGET_DESC = text(
  "Onze rice en beans zijn altijd inbegrepen als verse basis. Stel je eigen bord samen met 1 proteïne naar keuze, 1 topping, 1 saus en 1 soort tortilla.",
  "Our rice and beans are always included as a fresh base. Build your own plate with 1 protein of your choice, 1 topping, 1 sauce, and 1 type of tortilla."
);

const BUFFET_SINGLE_DESC = text(
  "Onze rice en beans zijn altijd inbegrepen als verse basis. Kies jouw favoriete combinatie met 1 proteïne, 2 toppings, guacamole of sour cream, 2 sauzen en 1 tortilla soort. Meer variatie, één geweldige smaak.",
  "Our rice and beans are always included as a fresh base. Choose your favourite combination with 1 protein, 2 toppings, guacamole or sour cream, 2 sauces and 1 type of tortilla. More variety, one great taste."
);

const BUFFET_DOUBLE_DESC = text(
  "Onze rice en beans zijn altijd inbegrepen als verse basis. Geniet van een uitgebreider buffet met 2 proteïnes naar keuze, 2 toppings, guacamole of sour cream, 2 sauzen en 1 tortilla soort. Perfect voor wie wil variëren.",
  "Our rice and beans are always included as a fresh base. Enjoy a more generous buffet with 2 proteins of your choice, 2 toppings, guacamole or sour cream, 2 sauces and 1 type of tortilla. Perfect for those who love variety."
);

const BUFFET_TRIPLE_DESC = text(
  "Onze rice en beans zijn altijd inbegrepen als verse basis. De ultieme Tres Amigos ervaring: 3 proteïnes, 3 toppings, guacamole én sour cream, 3 sauzen en beide tortilla soorten. Het complete Mexicaanse buffet voor de echte liefhebber.",
  "Our rice and beans are always included as a fresh base. The ultimate Tres Amigos experience: 3 proteins, 3 toppings, guacamole and sour cream, 3 sauces and both tortilla types. The complete Mexican buffet for true fans."
);

const BURRITO_SINGLE_DESC = text(
  "Onze rice, beans en cheese zijn altijd inbegrepen als verse basis. Stel jouw eigen combinatie samen met 1 proteïne naar keuze, 1 topping en 1 saus. Simpel, fris en heerlijk Mexicaans — stevig gerold en vol smaak.",
  "Our rice, beans, and cheese are always included as a fresh base. Create your own combination with 1 protein of your choice, 1 topping, and 1 sauce. Simple, fresh, and deliciously Mexican - tightly rolled and packed with flavor."
);

const BURRITO_DOUBLE_DESC = text(
  "Onze rice, beans en cheese zijn altijd inbegrepen als verse basis. Meer variatie in iedere hap: kies 1 proteïne, 2 toppings en 2 sauzen. De perfecte burrito voor wie iets extra’s wil.",
  "Our rice, beans, and cheese are always included as a fresh base. Enjoy more variety in every bite: choose 1 protein, 2 toppings, and 2 sauces. The perfect burrito for those who want a little extra."
);

const BURRITO_TRIPLE_DESC = text(
  "Onze rice, beans en cheese zijn altijd inbegrepen als verse basis. De ultieme burrito-ervaring: kies 1 proteïne, 3 toppings en 3 sauzen. Maximale smaak, stevig gerold in één burrito.",
  "Our rice, beans, and cheese are always included as a fresh base. The ultimate burrito experience: choose 1 protein, 3 toppings, and 3 sauces. Maximum flavor, all wrapped up in one perfectly rolled burrito."
);

const DRINK_IMG = "/assets/catering/drinks/drinks-cover.webp";

export const DEFAULT_CATERING_PRODUCTS: CateringProductConfig[] = [
  buffet("budget", text("Budget", "Budget"), BUFFET_BUDGET_DESC, 120, [0, 60, 110, 160, 210], "/assets/catering/packages/buffet-budget.png", 0),
  buffet("single", text("Single", "Single"), BUFFET_SINGLE_DESC, 150, [0, 75, 150, 225, 300], "/assets/catering/packages/buffet-single.png", 1),
  buffet("double", text("Double", "Double"), BUFFET_DOUBLE_DESC, 170, [0, 85, 170, 255, 340], "/assets/catering/packages/buffet-double.png", 2),
  buffet("triple", text("Triple", "Triple"), BUFFET_TRIPLE_DESC, 200, [0, 100, 200, 300, 400], "/assets/catering/packages/buffet-triple.png", 3),
  burrito("single", text("Single", "Single"), BURRITO_SINGLE_DESC, 150, [0, 75, 150, 225, 300], "/assets/catering/packages/burrito-single.png", 0),
  burrito("double", text("Double", "Double"), BURRITO_DOUBLE_DESC, 165, [0, 82.5, 165, 247.5, 330], "/assets/catering/packages/burrito-double.png", 1),
  burrito("triple", text("Triple", "Triple"), BURRITO_TRIPLE_DESC, 180, [0, 90, 180, 270, 360], "/assets/catering/packages/burrito-triple.png", 2),
  simple("drink-jarritos-cola", "drinks", text("Jarritos Mexican cola 370ml", "Jarritos Mexican cola 370ml"), text("Mexicaanse frisdrank", "Mexican soft drink"), DRINK_IMG, 395, 0),
  simple("drink-jarritos-fruit-punch", "drinks", text("Jarritos fruit punch 370ml", "Jarritos fruit punch 370ml"), text("Mexicaanse frisdrank", "Mexican soft drink"), DRINK_IMG, 395, 1),
  simple("drink-jarritos-lime", "drinks", text("Jarritos lime 370ml", "Jarritos lime 370ml"), text("Mexicaanse frisdrank", "Mexican soft drink"), DRINK_IMG, 395, 2),
  simple("drink-jarritos-passion-fruit", "drinks", text("Jarritos passion fruit 370ml", "Jarritos passion fruit 370ml"), text("Mexicaanse frisdrank", "Mexican soft drink"), DRINK_IMG, 395, 3),
  simple("drink-jarritos-mandarin", "drinks", text("Jarritos mandarin orange 370ml", "Jarritos mandarin orange 370ml"), text("Mexicaanse frisdrank", "Mexican soft drink"), DRINK_IMG, 395, 4),
  simple("drink-jarritos-strawberry", "drinks", text("Jarritos strawberry 370ml", "Jarritos strawberry 370ml"), text("Mexicaanse frisdrank", "Mexican soft drink"), DRINK_IMG, 395, 5),
  simple("drink-jarritos-guava", "drinks", text("Jarritos guava 370ml", "Jarritos guava 370ml"), text("Mexicaanse frisdrank", "Mexican soft drink"), DRINK_IMG, 395, 6),
  simple("drink-jarritos-pineapple", "drinks", text("Jarritos pineapple 370ml", "Jarritos pineapple 370ml"), text("Mexicaanse frisdrank", "Mexican soft drink"), DRINK_IMG, 395, 7),
  simple("drink-coca-cola", "drinks", text("Coca-Cola 330ml", "Coca-Cola 330ml"), text("Classic cola", "Classic cola"), DRINK_IMG, 300, 8),
  simple("drink-coca-cola-zero", "drinks", text("Coca-Cola Zero Sugar 330ml", "Coca-Cola Zero Sugar 330ml"), text("Suikervrije cola", "Sugar-free cola"), DRINK_IMG, 300, 9),
  simple("drink-fanta-exotic", "drinks", text("Fanta exotic 330ml", "Fanta exotic 330ml"), text("Fruitige frisdrank", "Fruity soft drink"), DRINK_IMG, 300, 10),
  simple("drink-lipton-green", "drinks", text("Lipton ice tea green 330ml", "Lipton ice tea green 330ml"), text("Ice tea", "Ice tea"), DRINK_IMG, 300, 11),
  simple("drink-lipton-peach", "drinks", text("Lipton ice tea peach 330ml", "Lipton ice tea peach 330ml"), text("Ice tea", "Ice tea"), DRINK_IMG, 300, 12),
  simple("drink-spa-blauw", "drinks", text("Spa blauw", "Spa blauw"), text("Plat water", "Still water"), DRINK_IMG, 300, 13),
  simple("drink-red-bull", "drinks", text("Red Bull Energy Drink 250ml", "Red Bull Energy Drink 250ml"), text("Energy drink", "Energy drink"), DRINK_IMG, 395, 14),
  simple("drink-spa-rood", "drinks", text("Spa Rood", "Spa Rood"), text("Bruisend water", "Sparkling water"), DRINK_IMG, 300, 15),
  simple("drink-fanta-orange", "drinks", text("Fanta orange 330ml", "Fanta orange 330ml"), text("Sinaasappel", "Orange soft drink"), DRINK_IMG, 300, 16),
  simple("drink-spa-strawberry-watermelon", "drinks", text("Spa strawberry watermelon 400ml", "Spa strawberry watermelon 400ml"), text("Gearomatiseerd water", "Flavoured water"), DRINK_IMG, 395, 17),
  simple("sauce-chipotle", "sauces", text("Homemade chipotle sauce", "Homemade chipotle sauce"), text("Homemade chipotle sauce.", "Homemade chipotle sauce."), "/assets/catering/sauces/chipotle.png", 100, 0),
  simple("sauce-garlic", "sauces", text("Homemade garlic sauce", "Homemade garlic Sauce"), text("Saus van knoflook, mayonaise en kruiden.", "A homemade sauce made of garlic, mayonnaise with added spices."), "/assets/catering/sauces/garlic.png", 100, 1),
  simple("sauce-el-cielo", "sauces", text("El cielo sauce", "El cielo sauce"), text("Pittige saus van mayonaise, ketchup en harissa.", "A spicy sauce made of mayonnaise, ketchup, and harissa."), "/assets/catering/sauces/el-cielo.png", 100, 2),
  simple("sauce-cilantro", "sauces", text("Homemade cilantro sauce", "Homemade cilantro sauce"), text("Dagelijks verse saus van cilantro, munt en limoensap.", "A daily fresh made sauce of cilantro, mint and fresh lime juice."), "/assets/catering/ingredients/cilantro.png", 150, 3),
  simple("sauce-sour-cream", "sauces", text("Sour cream", "Sour cream"), text("Romige, pittige topping.", "Creamy and spicy topping. Perfect for adding richness."), "/assets/catering/sauces/sour-cream.png", 250, 4),
  simple("sauce-guacamole", "sauces", text("Homemade Guacamole", "Homemade Guacamole"), text("Homemade guacamole", "Homemade guacamole"), "/assets/catering/sauces/guacamole.png", 250, 5),
  simple("sauce-salsa-verde", "sauces", text("Salsa verde", "Salsa verde"), text("Authentieke Mexicaanse salsa van tomatillos, groene chili, ui, knoflook, koriander en limoensap.", "Authentic Mexican salsa made from tomatillos, green chillies, onion, garlic, coriander and lime juice."), "/assets/catering/sauces/salsa-verde.png", 150, 6),
  simple("sauce-habanero", "sauces", text("Habanero", "Habanero"), text("Zeer scherp", "Very sharp"), "/assets/catering/sauces/habanero.png", 150, 7),
  simple("sauce-mayonnaise", "sauces", text("Mayonnaise", "mayonnaise"), text("Saus", "saus"), "/assets/catering/sauces/sour-cream.png", 100, 8),
  simple("sauce-ketchup", "sauces", text("Ketchup", "Ketchup"), text("Saus", "saus"), "/assets/catering/sauces/birria.png", 100, 9),
  simple("team-thanks-050", "team-thanks", text("Team bedankje €0,50", "Team thank-you €0.50"), text("Klein bedankje", "Small thank-you"), "/assets/brand/breakfast-lunch-dinner.png", 50, 0),
  simple("team-thanks-100", "team-thanks", text("Team bedankje €1,00", "Team thank-you €1.00"), text("Groter bedankje", "Larger thank-you"), "/assets/brand/breakfast-lunch-dinner.png", 100, 1)
];

export const DEFAULT_CATERING_FULFILLMENT: CateringFulfillmentSettings = {
  pickup: { enabled: true, openTime: "11:00", closeTime: "22:30" },
  delivery: { enabled: true, openTime: "17:00", closeTime: "22:30" }
};

export const DEFAULT_CATERING_SETTINGS: CateringSettings = {
  maxOnlineServings: 30,
  largeGroupEmail: "catering@tresamigos.nl",
  categories: DEFAULT_CATERING_CATEGORIES,
  products: DEFAULT_CATERING_PRODUCTS,
  ingredients: DEFAULT_CATERING_INGREDIENTS,
  formFields: DEFAULT_CATERING_FORM_FIELDS,
  notifications: DEFAULT_CATERING_NOTIFICATIONS,
  fulfillment: DEFAULT_CATERING_FULFILLMENT
};
