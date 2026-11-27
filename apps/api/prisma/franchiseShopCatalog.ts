/** Standaard franchise-shop catalogus (prijslijst vestigingen). */

export type FranchiseShopCatalogSeedItem = {
  /** Stabiele id voor migraties/seed. */
  id: string;
  name: string;
  type: string;
  unit: string;
  sku: string;
  priceCents: number;
  sortOrder: number;
};

function pid(n: number) {
  return `a0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

export const FRANCHISE_SHOP_CATALOG: FranchiseShopCatalogSeedItem[] = [
  {
    id: pid(1),
    name: "Chicken (Kip)",
    type: "Vlees / Proteïne",
    unit: "3.5 kg",
    sku: "2100000000021",
    priceCents: 3350,
    sortOrder: 1
  },
  {
    id: pid(2),
    name: "Ground Beef (Gehakt)",
    type: "Vlees / Proteïne",
    unit: "1.5 kg",
    sku: "2100000000029",
    priceCents: 2150,
    sortOrder: 2
  },
  {
    id: pid(3),
    name: "Pulled Beef",
    type: "Vlees / Proteïne",
    unit: "2.5 kg",
    sku: "2100000000036",
    priceCents: 3190,
    sortOrder: 3
  },
  {
    id: pid(4),
    name: "Jackfruit",
    type: "Vlees / Proteïne",
    unit: "1.5 kg",
    sku: "2100000000043",
    priceCents: 1310,
    sortOrder: 4
  },
  {
    id: pid(5),
    name: "Beans (Bonen)",
    type: "Vlees / Proteïne",
    unit: "2.5 kg",
    sku: "2100000000050",
    priceCents: 1930,
    sortOrder: 5
  },
  {
    id: pid(6),
    name: "Bell Peppers (Paprika)",
    type: "Groenten",
    unit: "1.0 kg",
    sku: "2100000000210",
    priceCents: 420,
    sortOrder: 6
  },
  {
    id: pid(7),
    name: "Onions Moons (Halve maantjes ui)",
    type: "Groenten",
    unit: "1.0 kg",
    sku: "2100000000227",
    priceCents: 300,
    sortOrder: 7
  },
  {
    id: pid(8),
    name: "Onions Diced",
    type: "Groenten",
    unit: "1.0 kg",
    sku: "2100000000234",
    priceCents: 300,
    sortOrder: 8
  },
  {
    id: pid(9),
    name: "Tomato (Tomaat)",
    type: "Groenten",
    unit: "1.0 kg",
    sku: "2100000000258",
    priceCents: 300,
    sortOrder: 9
  },
  {
    id: pid(10),
    name: "Lettuce (Sla)",
    type: "Groenten",
    unit: "1.0 kg",
    sku: "2100000000265",
    priceCents: 200,
    sortOrder: 10
  },
  {
    id: pid(11),
    name: "Lime (Limoen)",
    type: "Groenten",
    unit: "Crate",
    sku: "2100000000272",
    priceCents: 1630,
    sortOrder: 11
  },
  {
    id: pid(12),
    name: "Avocado",
    type: "Groenten",
    unit: "1 piece",
    sku: "2100000000289",
    priceCents: 80,
    sortOrder: 12
  },
  {
    id: pid(13),
    name: "Onions pickled",
    type: "Groenten",
    unit: "1.0 kg",
    sku: "2100000000197",
    priceCents: 430,
    sortOrder: 13
  },
  {
    id: pid(14),
    name: "Fresh Coriander",
    type: "Groenten",
    unit: "1.0 kg",
    sku: "2100000000241",
    priceCents: 1350,
    sortOrder: 14
  },
  {
    id: pid(15),
    name: "Guacamole",
    type: "Groenten",
    unit: "1.0 kg",
    sku: "2100000000297",
    priceCents: 900,
    sortOrder: 15
  },
  {
    id: pid(16),
    name: "Rice",
    type: "Groenten",
    unit: "1.3 kg",
    sku: "",
    priceCents: 270,
    sortOrder: 16
  },
  {
    id: pid(17),
    name: "Chicken Sauce (Kipsaus)",
    type: "Sauzen",
    unit: "1.5 kg",
    sku: "2100000000418",
    priceCents: 390,
    sortOrder: 17
  },
  {
    id: pid(18),
    name: "Beef Sauce (Rundersaus)",
    type: "Sauzen",
    unit: "1.5 kg",
    sku: "2100000000425",
    priceCents: 680,
    sortOrder: 18
  },
  {
    id: pid(19),
    name: "Cilantro Sauce (Koriandersaus)",
    type: "Sauzen",
    unit: "1.5 kg",
    sku: "2100000000432",
    priceCents: 990,
    sortOrder: 19
  },
  {
    id: pid(20),
    name: "Chipotle Sauce",
    type: "Sauzen",
    unit: "Bucket",
    sku: "2100000000449",
    priceCents: 4030,
    sortOrder: 20
  },
  {
    id: pid(21),
    name: "Garlic Sauce (Knoflooksaus)",
    type: "Sauzen",
    unit: "Bucket",
    sku: "2100000000456",
    priceCents: 2900,
    sortOrder: 21
  },
  {
    id: pid(22),
    name: "Birria",
    type: "Sauzen",
    unit: "1.5 kg",
    sku: "2100000000463",
    priceCents: 680,
    sortOrder: 22
  },
  {
    id: pid(23),
    name: "Hibiscus",
    type: "Drinks",
    unit: "1 can",
    sku: "",
    priceCents: 100,
    sortOrder: 23
  },
  {
    id: pid(24),
    name: "Coconut Lime",
    type: "Drinks",
    unit: "1 can",
    sku: "",
    priceCents: 150,
    sortOrder: 24
  }
];

export function franchiseShopProductDescription(item: FranchiseShopCatalogSeedItem) {
  return `${item.type} · ${item.unit}`;
}
