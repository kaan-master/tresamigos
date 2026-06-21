import { useMemo, useState } from "react";
import type { MenuCategory, MenuItem, SiteContent } from "@tresamigos/types";
import { AdminListRow, AdminSearchBar } from "./AdminListUi";
import { FormSaveBar, type PanelSaveProps } from "./FormSaveBar";
import { MediaField } from "./MediaPickerModal";
import { createSlugId } from "../lib/id";
import { mediaAssetUrl } from "../lib/media";

interface Props extends PanelSaveProps {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
}

type ProductRow = {
  categoryId: string;
  categoryTitle: string;
  product: MenuItem;
  productIndex: number;
};

function emptyProduct(categoryId: string): MenuItem {
  return {
    id: createSlugId("product", categoryId),
    name: "Nieuw product",
    description: "",
    price: "€0,00",
    active: true
  };
}

function emptyCategory(): MenuCategory {
  const title = "Nieuwe categorie";
  const id = createSlugId(title, "cat");
  return {
    id,
    title,
    orderLabel: "Order now",
    active: true,
    items: [emptyProduct(id)]
  };
}

export function ProductsPanel({ content, onChange, onSave, saving }: Props) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const rows = useMemo<ProductRow[]>(
    () =>
      content.menu.flatMap((category) =>
        category.items.map((product, productIndex) => ({
          categoryId: category.id,
          categoryTitle: category.title,
          product,
          productIndex
        }))
      ),
    [content.menu]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (categoryFilter !== "all" && row.categoryId !== categoryFilter) return false;
      if (!normalized) return true;
      return `${row.product.name} ${row.product.description} ${row.product.price} ${row.categoryTitle}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [rows, query, categoryFilter]);

  const selected = filtered.find((row) => `${row.categoryId}:${row.product.id}` === selectedKey) ||
    rows.find((row) => `${row.categoryId}:${row.product.id}` === selectedKey) ||
    null;

  function setMenu(menu: MenuCategory[]) {
    onChange({ ...content, menu });
  }

  function updateCategory(categoryId: string, next: MenuCategory) {
    setMenu(content.menu.map((category) => (category.id === categoryId ? next : category)));
  }

  function addCategory() {
    const next = emptyCategory();
    setMenu([...content.menu, next]);
    setCategoryFilter(next.id);
  }

  function addProduct(categoryId: string) {
    const category = content.menu.find((item) => item.id === categoryId);
    if (!category) return;
    const product = emptyProduct(categoryId);
    updateCategory(categoryId, { ...category, items: [...category.items, product] });
    setSelectedKey(`${categoryId}:${product.id}`);
  }

  function updateProduct(categoryId: string, productIndex: number, next: MenuItem) {
    const category = content.menu.find((item) => item.id === categoryId);
    if (!category) return;
    const items = [...category.items];
    items[productIndex] = next;
    updateCategory(categoryId, { ...category, items });
  }

  function removeProduct(categoryId: string, productIndex: number) {
    const category = content.menu.find((item) => item.id === categoryId);
    if (!category || category.items.length <= 1) return;
    updateCategory(
      categoryId,
      { ...category, items: category.items.filter((_, index) => index !== productIndex) }
    );
    setSelectedKey(null);
  }

  function moveProduct(fromCategoryId: string, productId: string, toCategoryId: string) {
    if (fromCategoryId === toCategoryId) return;
    const menu = content.menu.map((category) => ({ ...category, items: [...category.items] }));
    const from = menu.find((category) => category.id === fromCategoryId);
    const to = menu.find((category) => category.id === toCategoryId);
    if (!from || !to) return;
    const index = from.items.findIndex((item) => item.id === productId);
    if (index < 0) return;
    const [product] = from.items.splice(index, 1);
    to.items.push(product);
    setMenu(menu);
    setSelectedKey(`${toCategoryId}:${product.id}`);
  }

  return (
    <div className="ta-master-detail">
      <div className="ta-list-pane">
        <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek product, prijs of categorie..." />

        <div className="ta-toolbar ta-toolbar-spread">
          <label className="ta-field" style={{ marginBottom: 0, minWidth: 180 }}>
            <span>Categorie</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">Alle categorieën</option>
              {content.menu.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>
          <div className="ta-toolbar">
            <button className="ta-btn ta-btn-ghost" type="button" onClick={addCategory}>
              + Categorie
            </button>
            <button
              className="ta-btn ta-btn-primary"
              type="button"
              onClick={() => addProduct(categoryFilter === "all" ? content.menu[0]?.id || "" : categoryFilter)}
              disabled={!content.menu.length}
            >
              + Product
            </button>
          </div>
        </div>

        <div className="ta-list-scroll">
          {filtered.length ? (
            filtered.map((row) => (
              <AdminListRow
                key={`${row.categoryId}:${row.product.id}`}
                title={row.product.name}
                meta={`${row.categoryTitle} · ${row.product.price}`}
                badge={row.product.active !== false ? "Actief" : "Verborgen"}
                thumb={row.product.image ? mediaAssetUrl(row.product.image) : undefined}
                active={`${row.categoryId}:${row.product.id}` === selectedKey}
                onClick={() => setSelectedKey(`${row.categoryId}:${row.product.id}`)}
              />
            ))
          ) : (
            <div className="ta-empty">Geen producten gevonden.</div>
          )}
        </div>
      </div>

      {selected ? (
        <div className="ta-detail-pane ta-fade-in">
          <div className="ta-toolbar ta-toolbar-spread">
            <h3 className="ta-section-title">Product bewerken</h3>
            <button
              className="ta-btn ta-btn-danger"
              type="button"
              onClick={() => removeProduct(selected.categoryId, selected.productIndex)}
            >
              Verwijderen
            </button>
          </div>

          <label className="ta-field ta-grid-wide">
            <span>Verplaats naar categorie</span>
            <select
              value={selected.categoryId}
              onChange={(event) => moveProduct(selected.categoryId, selected.product.id, event.target.value)}
            >
              {content.menu.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>

          <div className="ta-grid">
            <MediaField
              label="Afbeelding"
              value={selected.product.image || ""}
              placeholder="assets/site/quesadilla-drinks.webp"
              onChange={(value) =>
                updateProduct(selected.categoryId, selected.productIndex, {
                  ...selected.product,
                  image: value
                })
              }
            />
            <label className="ta-field ta-grid-wide">
              <span>Naam</span>
              <input
                value={selected.product.name}
                onChange={(event) =>
                  updateProduct(selected.categoryId, selected.productIndex, {
                    ...selected.product,
                    name: event.target.value
                  })
                }
              />
            </label>
            <label className="ta-field">
              <span>Prijs</span>
              <input
                value={selected.product.price}
                onChange={(event) =>
                  updateProduct(selected.categoryId, selected.productIndex, {
                    ...selected.product,
                    price: event.target.value
                  })
                }
              />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Omschrijving</span>
              <textarea
                value={selected.product.description}
                onChange={(event) =>
                  updateProduct(selected.categoryId, selected.productIndex, {
                    ...selected.product,
                    description: event.target.value
                  })
                }
                rows={4}
              />
            </label>
          </div>

          <div className="ta-product-meta">
            <label className="ta-toggle">
              <input
                type="checkbox"
                checked={selected.product.active !== false}
                onChange={(event) =>
                  updateProduct(selected.categoryId, selected.productIndex, {
                    ...selected.product,
                    active: event.target.checked
                  })
                }
              />
              <span>Actief</span>
            </label>
            <label className="ta-toggle">
              <input
                type="checkbox"
                checked={selected.product.featured === true}
                onChange={(event) =>
                  updateProduct(selected.categoryId, selected.productIndex, {
                    ...selected.product,
                    featured: event.target.checked
                  })
                }
              />
              <span>Featured op home</span>
            </label>
          </div>
          <FormSaveBar onSave={onSave} saving={saving} />
        </div>
      ) : (
        <div className="ta-detail-pane ta-empty">Selecteer een product uit de lijst om te bewerken.</div>
      )}
    </div>
  );
}
