import { assetUrl } from "./api";

const FALLBACK_IMAGE = "/assets/site/quesadilla-drinks.webp";

export function productImageUrl(image?: string) {
  return assetUrl(image || FALLBACK_IMAGE);
}
