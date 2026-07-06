export type CateringView =
  | "overview"
  | "orders"
  | "products"
  | "categories"
  | "ingredients"
  | "form"
  | "fulfillment"
  | "notifications"
  | "guide";

export interface CateringNavItem {
  id: CateringView;
  label: string;
  description: string;
  image: string;
  badge?: boolean;
}

export interface CateringNavSection {
  id: string;
  label: string;
  items: CateringNavItem[];
}

export const CATERING_NAV_SECTIONS: CateringNavSection[] = [
  {
    id: "operations",
    label: "Operatie",
    items: [
      {
        id: "overview",
        label: "Overzicht",
        description: "Statistieken en urgente acties",
        image: "/assets/brand/breakfast-lunch-dinner.png"
      },
      {
        id: "orders",
        label: "Bestellingen",
        description: "Inkomende cateringorders beheren",
        image: "/assets/menu/pulled-chicken-burrito-150x150.jpg",
        badge: true
      }
    ]
  },
  {
    id: "catalog",
    label: "Catalogus",
    items: [
      {
        id: "products",
        label: "Producten",
        description: "Pakketten, prijzen en foto's",
        image: "/assets/menu/cheese-quesedilla-2-150x150.jpg"
      },
      {
        id: "categories",
        label: "Categorieën",
        description: "Zichtbaarheid en volgorde in de shop",
        image: "/assets/menu/pulled-beef-taco-150x150.jpg"
      },
      {
        id: "ingredients",
        label: "Ingrediënten",
        description: "Eiwitten, toppings, sauzen en opties",
        image: "/assets/menu/Jackfruit-bowl-2-e1751149625253-150x150.jpg"
      }
    ]
  },
  {
    id: "settings",
    label: "Instellingen",
    items: [
      {
        id: "form",
        label: "Formulier",
        description: "Checkout-velden en verplichtingen",
        image: "/assets/site/restaurant-interior.jpg"
      },
      {
        id: "fulfillment",
        label: "Afhalen & bezorgen",
        description: "Tijden en beschikbaarheid per optie",
        image: "/assets/brand/platforms/delivery.svg"
      },
      {
        id: "notifications",
        label: "Meldingen",
        description: "E-mail bij nieuwe orders",
        image: "/assets/brand/breakfast-lunch-dinner.png"
      },
      {
        id: "guide",
        label: "Werkwijze",
        description: "Uitleg voor het team",
        image: "/assets/menu/pulled-chicken-burrito-150x150.jpg"
      }
    ]
  }
];
