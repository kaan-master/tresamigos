export type CateringBoxId = "burrito-box" | "bowl-box" | "quesadilla-box" | "taco-box";
export type FulfillmentMode = "pickup" | "delivery";

export interface CateringBox {
  id: CateringBoxId;
  image: string;
  titleKey: string;
  descKey: string;
}

export const CATERING_BOXES: CateringBox[] = [
  {
    id: "burrito-box",
    image: "/assets/menu/pulled-chicken-burrito-150x150.jpg",
    titleKey: "catering.box.burrito",
    descKey: "catering.box.burritoDesc"
  },
  {
    id: "bowl-box",
    image: "/assets/menu/Jackfruit-bowl-2-e1751149625253-150x150.jpg",
    titleKey: "catering.box.bowl",
    descKey: "catering.box.bowlDesc"
  },
  {
    id: "quesadilla-box",
    image: "/assets/menu/cheese-quesedilla-2-150x150.jpg",
    titleKey: "catering.box.quesadilla",
    descKey: "catering.box.quesadillaDesc"
  },
  {
    id: "taco-box",
    image: "/assets/menu/pulled-beef-taco-150x150.jpg",
    titleKey: "catering.box.taco",
    descKey: "catering.box.tacoDesc"
  }
];

export const CATERING_PROTEINS = ["Chicken", "Beef", "Jackfruit", "Fish", "Vegan mix"] as const;
export const CATERING_TOPPINGS = ["Guacamole", "Pico de gallo", "Lettuce", "Cheese", "Jalapeños", "Sour cream"] as const;
export const CATERING_SALSAS = ["Mild", "Medium", "Hot", "Verde", "Chipotle"] as const;
export const CATERING_DIET = ["Gluten free", "Dairy free", "Vegetarian", "Vegan", "Nut free"] as const;

export const CATERING_STEPS = 6;
