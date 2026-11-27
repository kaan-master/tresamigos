-- Franchise shop: wis alle bestellingen en zet standaardcatalogus klaar
DELETE FROM "FranchiseShopOrderItem";
DELETE FROM "FranchiseShopOrder";
DELETE FROM "FranchiseProductPrice";
DELETE FROM "FranchiseShopProduct";

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000001', 'Chicken (Kip)', 'Vlees / Proteïne · 3.5 kg', '', '2100000000021', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000001', l.id, 3350, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000002', 'Ground Beef (Gehakt)', 'Vlees / Proteïne · 1.5 kg', '', '2100000000029', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000002', l.id, 2150, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000003', 'Pulled Beef', 'Vlees / Proteïne · 2.5 kg', '', '2100000000036', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000003', l.id, 3190, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000004', 'Jackfruit', 'Vlees / Proteïne · 1.5 kg', '', '2100000000043', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000004', l.id, 1310, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000005', 'Beans (Bonen)', 'Vlees / Proteïne · 2.5 kg', '', '2100000000050', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000005', l.id, 1930, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000006', 'Bell Peppers (Paprika)', 'Groenten · 1.0 kg', '', '2100000000210', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000006', l.id, 420, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000007', 'Onions Moons (Halve maantjes ui)', 'Groenten · 1.0 kg', '', '2100000000227', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000007', l.id, 300, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000008', 'Onions Diced', 'Groenten · 1.0 kg', '', '2100000000234', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000008', l.id, 300, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000009', 'Tomato (Tomaat)', 'Groenten · 1.0 kg', '', '2100000000258', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000009', l.id, 300, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000010', 'Lettuce (Sla)', 'Groenten · 1.0 kg', '', '2100000000265', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000010', l.id, 200, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000011', 'Lime (Limoen)', 'Groenten · Crate', '', '2100000000272', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000011', l.id, 1630, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000012', 'Avocado', 'Groenten · 1 piece', '', '2100000000289', true, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000012', l.id, 80, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000013', 'Onions pickled', 'Groenten · 1.0 kg', '', '2100000000197', true, 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000013', l.id, 430, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000014', 'Fresh Coriander', 'Groenten · 1.0 kg', '', '2100000000241', true, 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000014', l.id, 1350, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000015', 'Guacamole', 'Groenten · 1.0 kg', '', '2100000000297', true, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000015', l.id, 900, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000016', 'Rice', 'Groenten · 1.3 kg', '', '', true, 16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000016', l.id, 270, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000017', 'Chicken Sauce (Kipsaus)', 'Sauzen · 1.5 kg', '', '2100000000418', true, 17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000017', l.id, 390, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000018', 'Beef Sauce (Rundersaus)', 'Sauzen · 1.5 kg', '', '2100000000425', true, 18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000018', l.id, 680, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000019', 'Cilantro Sauce (Koriandersaus)', 'Sauzen · 1.5 kg', '', '2100000000432', true, 19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000019', l.id, 990, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000020', 'Chipotle Sauce', 'Sauzen · Bucket', '', '2100000000449', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000020', l.id, 4030, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000021', 'Garlic Sauce (Knoflooksaus)', 'Sauzen · Bucket', '', '2100000000456', true, 21, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000021', l.id, 2900, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000022', 'Birria', 'Sauzen · 1.5 kg', '', '2100000000463', true, 22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000022', l.id, 680, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000023', 'Hibiscus', 'Drinks · 1 can', '', '', true, 23, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000023', l.id, 100, CURRENT_TIMESTAMP FROM "Location" l;

INSERT INTO "FranchiseShopProduct" (id, name, description, image, sku, active, "sortOrder", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000024', 'Coconut Lime', 'Drinks · 1 can', '', '', true, 24, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "FranchiseProductPrice" (id, "productId", "locationId", "priceCents", "updatedAt")
SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000024', l.id, 150, CURRENT_TIMESTAMP FROM "Location" l;
