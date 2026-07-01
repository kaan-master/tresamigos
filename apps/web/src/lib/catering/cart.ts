import type { CateringCartLine } from "@tresamigos/types";
import type { CateringProduct } from "./catalog";

export function formatEuro(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function cartSubtotal(lines: CateringCartLine[]) {
  return lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
}

export function cartItemCount(lines: CateringCartLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function createLineId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSimpleLine(product: CateringProduct, quantity: number): CateringCartLine {
  const lineTotalCents = product.basePriceCents * quantity;
  return {
    id: createLineId(),
    productId: product.id,
    categoryId: product.categoryId,
    name: product.nameKey,
    servings: 0,
    quantity,
    unitPriceCents: product.basePriceCents,
    lineTotalCents,
    configuration: {}
  };
}

export function priceConfiguredProduct(
  product: CateringProduct,
  servings: number,
  quantity: number,
  configuration: Record<string, string | number | string[]>
) {
  const servingOption = product.servingOptions?.find((option) => option.servings === servings);
  const unitPriceCents = product.basePriceCents + (servingOption?.extraCents || 0);
  return {
    unitPriceCents,
    lineTotalCents: unitPriceCents * quantity
  };
}
