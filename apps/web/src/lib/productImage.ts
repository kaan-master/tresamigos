import { assetUrl } from "./api";

const FALLBACK_IMAGE = "assets/site/quesadilla-drinks.webp";

const MENU_IMAGES_BY_ID: Record<string, string> = {
  "xl-pulled-beef-tacos": "assets/menu/pulled-beef-taco-150x150.jpg",
  "xl-pulled-chicken-tacos": "assets/menu/pulled-chicken-taco-3-150x150.jpg",
  "xl-jackfruit-tacos": "assets/menu/jackfruit-taco-150x150.jpg",
  "fried-fish-tacos": "assets/menu/fried-fish-taco-150x150.jpg",
  "pulled-chicken-burrito": "assets/menu/pulled-chicken-burrito-150x150.jpg",
  "ground-beef-burrito": "assets/menu/beef-burrito-2-150x150.jpg",
  "white-fish-burrito": "assets/menu/whitefish-burrito-150x150.jpg",
  "jackfruit-burrito": "assets/menu/Jackfruit-burrito-150x150.jpg",
  "vegan-burrito": "assets/menu/vegan-burrito-150x150.jpg",
  "pulled-chicken-quesadilla": "assets/menu/pulled-chicken-quesadilla-2-150x150.jpg",
  "ground-beef-quesadilla": "assets/menu/beef-quesdilla-2-150x150.jpg",
  "cheese-quesadilla": "assets/menu/cheese-quesedilla-2-150x150.jpg",
  "spicy-pulled-chicken-bowl": "assets/menu/Spicy-chicken-bowl-2-e1751149480798-150x150.jpg",
  "vegan-jackfruit-bowl": "assets/menu/Jackfruit-bowl-2-e1751149625253-150x150.jpg",
  "chili-con-carne-bowl": "assets/menu/Chilli-con-carne-bowl-2-e1751149645451-150x150.jpg",
  "mozzarella-sticks": "assets/menu/mozzarella-sticks-2-e1751148061721-150x150.jpg",
  "twister-fries": "assets/menu/twister-fries-2-e1751148206457-150x150.jpg",
  "chili-cheese-nuggets": "assets/menu/chilli-cheese-nuggets-2-e1751148300610-150x150.jpg",
  fries: "assets/menu/friese-2-150x150.jpg",
  cheesecake: "assets/menu/cheese-cake-2-e1751148971314-150x150.jpg",
  "xl-chocolate-chip-cookie": "assets/menu/home-made-XL-choclate-chip-cookie-2-150x150.jpg",
  "fudge-brownie": "assets/menu/home-made-brownie-2-e1751148991100-150x150.jpg"
};

export function productImageUrl(image?: string, itemId?: string) {
  const path = image || (itemId ? MENU_IMAGES_BY_ID[itemId] : "") || FALLBACK_IMAGE;
  return assetUrl(path);
}
