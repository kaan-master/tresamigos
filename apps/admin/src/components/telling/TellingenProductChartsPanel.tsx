import { useEffect, useMemo, useState } from "react";
import {
  storeLabel,
  type CountCategoryStat,
  type CountList,
  type CountProductStat,
  type CountStaffRecord,
  type Location
} from "@tresamigos/types";
import { api } from "../../lib/api";
import { WEEKDAY_NAMES } from "../../lib/countDates";
import { mergeTellingFilters, type TellingenOverviewFilters } from "../../lib/tellingFilters";
import { BarChart, DonutChart, HBarChart, chartColors } from "../DonutChart";
import { EntraCommand, EntraCommands } from "./entraUi";

interface ProductStatsResponse {
  products: CountProductStat[];
  categories: CountCategoryStat[];
  weekdays: Array<{ weekday: string; quantity: number }>;
  locations: Array<{ locationId: string; locationName: string; locationCode: string; quantity: number }>;
  lists: Array<{ listId: string; listTitle: string; quantity: number }>;
  totalQuantity: number;
  sessionCount: number;
}

interface Props {
  locations: Location[];
  onOpenOverview: (filters: Partial<TellingenOverviewFilters>) => void;
}

export function TellingenProductChartsPanel({ locations, onOpenOverview }: Props) {
  const [stats, setStats] = useState<ProductStatsResponse>({
    products: [],
    categories: [],
    weekdays: [],
    locations: [],
    lists: [],
    totalQuantity: 0,
    sessionCount: 0
  });
  const [staff, setStaff] = useState<CountStaffRecord[]>([]);
  const [lists, setLists] = useState<CountList[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    locationId: "",
    staffId: "",
    listId: "",
    shift: "",
    status: ""
  });

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    const suffix = params.toString() ? `?${params}` : "";
    try {
      const [nextStats, staffData, listsData] = await Promise.all([
        api<ProductStatsResponse>(`/api/admin/tellingen/product-stats${suffix}`),
        api<{ staff: CountStaffRecord[] }>("/api/admin/tellingen/staff"),
        api<{ lists: CountList[] }>("/api/admin/tellingen/lists")
      ]);
      setStats(nextStats);
      setStaff(staffData.staff);
      setLists(listsData.lists);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [filters.dateFrom, filters.dateTo, filters.locationId, filters.staffId, filters.listId, filters.shift, filters.status]);

  function openOverview(patch: Partial<TellingenOverviewFilters>) {
    onOpenOverview(
      mergeTellingFilters({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        locationId: filters.locationId,
        staffId: filters.staffId,
        listId: filters.listId,
        shift: filters.shift,
        status: filters.status,
        ...patch
      })
    );
  }

  const topProducts = useMemo(() => {
    const colors = chartColors(15);
    return stats.products.slice(0, 15).map((product, index) => ({
      id: product.productId || product.productName,
      label: product.productName,
      value: product.quantity,
      color: colors[index]
    }));
  }, [stats.products]);

  const categorySegments = useMemo(() => {
    const colors = chartColors(Math.max(stats.categories.length, 1));
    return stats.categories.map((category, index) => ({
      id: category.categoryName,
      label: category.categoryName,
      value: category.quantity,
      color: colors[index]
    }));
  }, [stats.categories]);

  const weekdayBars = useMemo(
    () =>
      WEEKDAY_NAMES.map((day) => ({
        id: day,
        label: `${day.charAt(0).toUpperCase()}${day.slice(1, 2)}`,
        value: stats.weekdays.find((item) => item.weekday === day)?.quantity || 0
      })),
    [stats.weekdays]
  );

  const locationBars = useMemo(() => {
    const colors = chartColors(Math.max(stats.locations.length, 1));
    return stats.locations.map((location, index) => ({
      id: location.locationId,
      label: storeLabel(location.locationCode, location.locationName),
      value: location.quantity,
      color: colors[index]
    }));
  }, [stats.locations]);

  const listSegments = useMemo(() => {
    const colors = chartColors(Math.max(stats.lists.length, 1));
    return stats.lists.map((list, index) => ({
      id: list.listId,
      label: list.listTitle,
      value: list.quantity,
      color: colors[index]
    }));
  }, [stats.lists]);

  return (
    <>
      <EntraCommands>
        <EntraCommand onClick={() => void load()}>Vernieuwen</EntraCommand>
      </EntraCommands>

      <div className="entra-toolbar entra-toolbar-wrap">
        <input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
        <input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
        <select value={filters.locationId} onChange={(event) => setFilters((current) => ({ ...current, locationId: event.target.value }))}>
          <option value="">Alle winkels</option>
          {locations.map((location) => (
            <option value={location.id} key={location.id}>
              {storeLabel(location.code, location.name)}
            </option>
          ))}
        </select>
        <select value={filters.staffId} onChange={(event) => setFilters((current) => ({ ...current, staffId: event.target.value }))}>
          <option value="">Iedereen</option>
          {staff.map((user) => (
            <option value={user.id} key={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <select value={filters.listId} onChange={(event) => setFilters((current) => ({ ...current, listId: event.target.value }))}>
          <option value="">Alle lijsten</option>
          {lists.map((list) => (
            <option value={list.id} key={list.id}>
              {list.title}
            </option>
          ))}
        </select>
        <select value={filters.shift} onChange={(event) => setFilters((current) => ({ ...current, shift: event.target.value }))}>
          <option value="">Alle soorten</option>
          <option value="morning">Ochtendtelling</option>
          <option value="evening">Avondtelling</option>
        </select>
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
          <option value="">Alle statussen</option>
          <option value="submitted">Verzonden</option>
          <option value="draft">Concept</option>
        </select>
        <span className="entra-count">{loading ? "Laden…" : `${stats.products.length} producten`}</span>
      </div>

      <div className="entra-kpis">
        <article>
          <span>Geteld</span>
          <strong>{String(Math.round(stats.totalQuantity * 100) / 100).replace(".", ",")}</strong>
        </article>
        <article>
          <span>Producten</span>
          <strong>{stats.products.length}</strong>
        </article>
        <article>
          <span>Categorieën</span>
          <strong>{stats.categories.length}</strong>
        </article>
        <article>
          <span>Tellingen</span>
          <strong>{stats.sessionCount}</strong>
        </article>
      </div>

      <section className="ta-analytics-charts entra-charts">
        <article className="ta-chart-card ta-chart-card-wide">
          <div className="ta-chart-card-head">
            <strong>Meest getelde producten</strong>
            <p>Klik op een product om de tellingen in het overzicht te openen</p>
          </div>
          <HBarChart
            data={topProducts}
            onSelect={(item) => {
              const product = stats.products.find((entry) => (entry.productId || entry.productName) === item.id);
              openOverview({
                productId: product?.productId || "",
                productName: product?.productName || item.label
              });
            }}
          />
        </article>
        <article className="ta-chart-card">
          <div className="ta-chart-card-head">
            <strong>Per categorie</strong>
            <p>Klik door naar het overzicht</p>
          </div>
          {categorySegments.some((item) => item.value) ? (
            <DonutChart
              segments={categorySegments}
              centerLabel="STUKS"
              onSelect={(segment) => openOverview({ categoryName: segment.id || segment.label })}
            />
          ) : (
            <p className="entra-empty">Nog geen aantallen.</p>
          )}
        </article>
        <article className="ta-chart-card">
          <div className="ta-chart-card-head">
            <strong>Per weekdag</strong>
            <p>Klik op dinsdag of een andere dag</p>
          </div>
          <BarChart data={weekdayBars} onSelect={(item) => openOverview({ weekday: item.id || "" })} />
        </article>
        <article className="ta-chart-card">
          <div className="ta-chart-card-head">
            <strong>Per lijst</strong>
            <p>Klik op start of sluit</p>
          </div>
          {listSegments.some((item) => item.value) ? (
            <DonutChart segments={listSegments} centerLabel="LIJST" onSelect={(segment) => openOverview({ listId: segment.id || "" })} />
          ) : (
            <p className="entra-empty">Nog geen tellingen.</p>
          )}
        </article>
        <article className="ta-chart-card">
          <div className="ta-chart-card-head">
            <strong>Per winkel</strong>
            <p>Klik op een vestiging</p>
          </div>
          <HBarChart data={locationBars} onSelect={(item) => openOverview({ locationId: item.id || "" })} />
        </article>
      </section>
    </>
  );
}
