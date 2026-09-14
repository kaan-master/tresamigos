export type TellingenOverviewFilters = {
  dateFrom: string;
  dateTo: string;
  locationId: string;
  staffId: string;
  listId: string;
  weekday: string;
  shift: string;
  status: string;
  productId: string;
  productName: string;
  categoryName: string;
};

export const EMPTY_TELLING_FILTERS: TellingenOverviewFilters = {
  dateFrom: "",
  dateTo: "",
  locationId: "",
  staffId: "",
  listId: "",
  weekday: "",
  shift: "",
  status: "",
  productId: "",
  productName: "",
  categoryName: ""
};

export function mergeTellingFilters(
  base: Partial<TellingenOverviewFilters>,
  patch: Partial<TellingenOverviewFilters> = {}
): TellingenOverviewFilters {
  return { ...EMPTY_TELLING_FILTERS, ...base, ...patch };
}
