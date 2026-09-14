import { useEffect, useMemo, useState } from "react";
import type { CountCategory, CountProduct } from "@tresamigos/types";
import { useAdminFeedback } from "../../context/AdminFeedbackContext";
import { api } from "../../lib/api";
import { AdminButton } from "../AdminButton";
import { EntraBlade, EntraCommand, EntraCommands, EntraSearch } from "./entraUi";

type Row = CountProduct & { categoryName: string };

export function TellingenProductsPanel() {
  const { runSave } = useAdminFeedback();
  const [categories, setCategories] = useState<CountCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blade, setBlade] = useState<"product" | "category" | "categories" | null>(null);
  const [productForm, setProductForm] = useState({ id: "", name: "", categoryId: "" });
  const [categoryName, setCategoryName] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await api<{ categories: CountCategory[] }>("/api/admin/tellingen/catalog");
      setCategories(data.categories);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo<Row[]>(() => {
    return categories.flatMap((category) =>
      category.products.map((product) => ({ ...product, categoryName: category.name }))
    );
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (categoryFilter && row.categoryId !== categoryFilter) return false;
      if (!q) return true;
      return row.name.toLowerCase().includes(q) || row.categoryName.toLowerCase().includes(q);
    });
  }, [rows, query, categoryFilter]);

  const selected = rows.find((row) => row.id === selectedId) || null;

  function openNewProduct() {
    setProductForm({ id: "", name: "", categoryId: categoryFilter || categories[0]?.id || "" });
    setBlade("product");
  }

  function openEditProduct(row: Row) {
    setSelectedId(row.id);
    setProductForm({ id: row.id, name: row.name, categoryId: row.categoryId });
    setBlade("product");
  }

  async function saveProduct() {
    await runSave(
      async () => {
        if (productForm.id) {
          await api(`/api/admin/tellingen/products/${productForm.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: productForm.name, categoryId: productForm.categoryId })
          });
        } else {
          await api("/api/admin/tellingen/products", {
            method: "POST",
            body: JSON.stringify({ name: productForm.name, categoryId: productForm.categoryId })
          });
        }
        setBlade(null);
      },
      { refresh: load, successMessage: productForm.id ? "Product opgeslagen." : "Product toegevoegd." }
    );
  }

  async function addCategory() {
    await runSave(
      async () => {
        await api("/api/admin/tellingen/categories", { method: "POST", body: JSON.stringify({ name: categoryName }) });
        setCategoryName("");
      },
      { refresh: load, successMessage: "Categorie toegevoegd." }
    );
  }

  async function renameCategory(id: string, name: string) {
    if (!name.trim()) return;
    await api(`/api/admin/tellingen/categories/${id}`, { method: "PATCH", body: JSON.stringify({ name: name.trim() }) });
    await load();
  }

  async function move(kind: "products" | "categories", id: string, direction: "up" | "down") {
    const data = await api<{ categories: CountCategory[] }>(`/api/admin/tellingen/${kind}/${id}/move`, {
      method: "POST",
      body: JSON.stringify({ direction })
    });
    setCategories(data.categories);
  }

  async function removeSelected() {
    if (!selected) return;
    if (!window.confirm(`${selected.name} verwijderen?`)) return;
    await runSave(
      async () => {
        await api(`/api/admin/tellingen/products/${selected.id}`, { method: "DELETE" });
        setSelectedId(null);
        setBlade(null);
      },
      { refresh: load, successMessage: "Product verwijderd." }
    );
  }

  async function removeCategory(id: string, name: string) {
    if (!window.confirm(`Categorie “${name}” en alle producten hierin verwijderen?`)) return;
    await runSave(
      async () => {
        await api(`/api/admin/tellingen/categories/${id}`, { method: "DELETE" });
      },
      { refresh: load, successMessage: "Categorie verwijderd." }
    );
  }

  return (
    <>
      <EntraCommands>
        <EntraCommand onClick={openNewProduct}>+ Product</EntraCommand>
        <EntraCommand
          onClick={() => {
            setCategoryName("");
            setBlade("category");
          }}
        >
          + Categorie
        </EntraCommand>
        <EntraCommand onClick={() => setBlade("categories")}>Categorieën</EntraCommand>
        <EntraCommand disabled={!selected} onClick={() => selected && openEditProduct(selected)}>
          Bewerken
        </EntraCommand>
        <EntraCommand disabled={!selected} onClick={() => selected && void move("products", selected.id, "up")}>
          Omhoog
        </EntraCommand>
        <EntraCommand disabled={!selected} onClick={() => selected && void move("products", selected.id, "down")}>
          Omlaag
        </EntraCommand>
        <EntraCommand danger disabled={!selected} onClick={() => void removeSelected()}>
          Verwijderen
        </EntraCommand>
        <EntraCommand onClick={() => void load()}>Vernieuwen</EntraCommand>
      </EntraCommands>

      <div className="entra-toolbar entra-toolbar-wrap">
        <EntraSearch value={query} onChange={setQuery} placeholder="Zoek op product of categorie" />
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="">Alle categorieën</option>
          {categories.map((category) => (
            <option value={category.id} key={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <span className="entra-count">{loading ? "Laden…" : `${filtered.length} producten gevonden`}</span>
      </div>

      <div className="entra-table-wrap">
        <table className="entra-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Categorie</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className={selectedId === row.id ? "is-selected" : ""}
                onClick={() => setSelectedId(row.id)}
                onDoubleClick={() => openEditProduct(row)}
              >
                <td>
                  <button type="button" className="entra-link" onClick={() => openEditProduct(row)}>
                    {row.name}
                  </button>
                </td>
                <td>{row.categoryName}</td>
              </tr>
            ))}
            {!loading && !filtered.length ? (
              <tr>
                <td colSpan={2} className="entra-empty">
                  Geen producten.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {blade === "product" ? (
        <EntraBlade title={productForm.id ? "Product bewerken" : "Product toevoegen"} onClose={() => setBlade(null)}>
          <label>
            Naam
            <input value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            Categorie
            <select
              value={productForm.categoryId}
              onChange={(event) => setProductForm((current) => ({ ...current, categoryId: event.target.value }))}
            >
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <AdminButton variant="primary" type="button" onClick={() => void saveProduct()} disabled={!productForm.name.trim()}>
            Opslaan
          </AdminButton>
        </EntraBlade>
      ) : null}

      {blade === "category" ? (
        <EntraBlade title="Categorie toevoegen" onClose={() => setBlade(null)}>
          <label>
            Naam
            <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
          </label>
          <AdminButton variant="primary" type="button" onClick={() => void addCategory()} disabled={!categoryName.trim()}>
            Toevoegen
          </AdminButton>
        </EntraBlade>
      ) : null}

      {blade === "categories" ? (
        <EntraBlade title="Categorieën" onClose={() => setBlade(null)}>
          <div className="entra-cat-list">
            {categories.map((category) => (
              <div className="entra-cat-row" key={category.id}>
                <input
                  defaultValue={category.name}
                  onBlur={(event) => {
                    const name = event.target.value.trim();
                    if (name !== category.name) void renameCategory(category.id, name);
                  }}
                />
                <button type="button" onClick={() => void move("categories", category.id, "up")}>
                  ↑
                </button>
                <button type="button" onClick={() => void move("categories", category.id, "down")}>
                  ↓
                </button>
                <button type="button" className="is-danger" onClick={() => void removeCategory(category.id, category.name)}>
                  Weg
                </button>
              </div>
            ))}
          </div>
        </EntraBlade>
      ) : null}
    </>
  );
}
