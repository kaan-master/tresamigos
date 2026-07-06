import type { CateringCategoryId, CateringIngredientConfig, CateringPackageTier, CateringSettings } from "@tresamigos/types";
import {
  BUFFET_TOPPINGS,
  CREAM_OPTIONS,
  PROTEINS,
  SAUCES,
  TORTILLAS,
  TRIPLE_CREAM_OPTIONS,
  toppingsForCategory as fallbackToppingsForCategory
} from "./catalog";

export interface ResolvedIngredientOption {
  id: string;
  label: string;
  image?: string;
}

function pickLocalized(value: { nl: string; en: string }, lang: "nl" | "en") {
  return lang === "en" ? value.en || value.nl : value.nl || value.en;
}

function fromConfig(config: CateringIngredientConfig, lang: "nl" | "en"): ResolvedIngredientOption {
  return {
    id: config.id,
    label: pickLocalized(config.label, lang),
    image: config.image || undefined
  };
}

function fallbackOptions(values: readonly string[]): ResolvedIngredientOption[] {
  return values.map((label) => ({ id: label.toLowerCase().replace(/\s+/g, "-"), label }));
}

function activeByGroup(settings: CateringSettings | undefined, group: CateringIngredientConfig["group"], lang: "nl" | "en") {
  const fromSettings = (settings?.ingredients || [])
    .filter((item) => item.group === group && item.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => fromConfig(item, lang));
  return fromSettings.length ? fromSettings : null;
}

export function resolveCateringIngredients(settings: CateringSettings | undefined, lang: "nl" | "en" = "nl") {
  const proteins = activeByGroup(settings, "protein", lang) || fallbackOptions(PROTEINS);
  const sauces = activeByGroup(settings, "sauce", lang) || fallbackOptions(SAUCES);
  const tortillas = activeByGroup(settings, "tortilla", lang) || fallbackOptions(TORTILLAS);
  const buffetToppings = activeByGroup(settings, "buffetTopping", lang) || fallbackOptions(BUFFET_TOPPINGS);
  const burritoToppings = activeByGroup(settings, "burritoTopping", lang) || fallbackOptions(fallbackToppingsForCategory("burrito"));
  const cream = activeByGroup(settings, "cream", lang) || fallbackOptions(CREAM_OPTIONS);
  const tripleCream = activeByGroup(settings, "tripleCream", lang) || fallbackOptions(TRIPLE_CREAM_OPTIONS);

  return {
    proteins,
    sauces,
    tortillas,
    toppingsFor(categoryId: CateringCategoryId) {
      return categoryId === "burrito" ? burritoToppings : buffetToppings;
    },
    creamFor(tier?: CateringPackageTier) {
      return tier === "triple" ? tripleCream : cream;
    }
  };
}

export type ResolvedCateringIngredients = ReturnType<typeof resolveCateringIngredients>;
