import { useEffect, useMemo, useState } from "react";
import type { CountCategory, CountList } from "@tresamigos/types";
import { useAdminFeedback } from "../../context/AdminFeedbackContext";
import { api } from "../../lib/api";
import { AdminButton } from "../AdminButton";
import { EntraBlade, EntraCommand, EntraCommands, EntraSearch } from "./entraUi";

export function TellingenListsPanel() {
  const { runSave } = useAdminFeedback();
  const [lists, setLists] = useState<CountList[]>([]);
  const [categories, setCategories] = useState<CountCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blade, setBlade] = useState<"create" | "edit" | null>(null);
  const [title, setTitle] = useState("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [productQuery, setProductQuery] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [listsData, catalogData] = await Promise.all([
        api<{ lists: CountList[] }>("/api/admin/tellingen/lists"),
        api<{ categories: CountCategory[] }>("/api/admin/tellingen/catalog")
      ]);
      setLists(listsData.lists);
      setCategories(catalogData.categories);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lists;
    return lists.filter((list) => list.title.toLowerCase().includes(q));
  }, [lists, query]);

  const selected = lists.find((list) => list.id === selectedId) || null;

  const pickerCategories = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        products: category.products.filter((product) => !q || product.name.toLowerCase().includes(q) || category.name.toLowerCase().includes(q))
      }))
      .filter((category) => category.products.length);
  }, [categories, productQuery]);

  function openCreate() {
    setTitle("");
    setProductIds([]);
    setProductQuery("");
    setBlade("create");
  }

  function openEdit(list: CountList) {
    setSelectedId(list.id);
    setTitle(list.title);
    setProductIds(list.productIds);
    setProductQuery("");
    setBlade("edit");
  }

  function toggleProduct(id: string) {
    setProductIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleCategory(category: CountCategory) {
    const ids = category.products.map((product) => product.id);
    const allOn = ids.every((id) => productIds.includes(id));
    setProductIds((current) => (allOn ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]));
  }

  async function save() {
    await runSave(
      async () => {
        if (blade === "edit" && selected) {
          await api(`/api/admin/tellingen/lists/${selected.id}`, {
            method: "PATCH",
            body: JSON.stringify({ title, productIds })
          });
        } else {
          await api("/api/admin/tellingen/lists", {
            method: "POST",
            body: JSON.stringify({ title, productIds })
          });
        }
        setBlade(null);
      },
      { refresh: load, successMessage: blade === "edit" ? "Lijst opgeslagen." : "Lijst toegevoegd." }
    );
  }

  async function move(direction: "up" | "down") {
    if (!selected) return;
    const data = await api<{ lists: CountList[] }>(`/api/admin/tellingen/lists/${selected.id}/move`, {
      method: "POST",
      body: JSON.stringify({ direction })
    });
    setLists(data.lists);
  }

  async function toggleActive() {
    if (!selected) return;
    await runSave(
      async () => {
        await api(`/api/admin/tellingen/lists/${selected.id}`, {
          method: "PATCH",
          body: JSON.stringify({ active: !selected.active })
        });
      },
      { refresh: load, successMessage: selected.active ? "Lijst uitgezet." : "Lijst geactiveerd." }
    );
  }

  async function removeSelected() {
    if (!selected) return;
    if (!window.confirm(`Lijst “${selected.title}” verwijderen? Producten blijven in de catalogus.`)) return;
    await runSave(
      async () => {
        await api(`/api/admin/tellingen/lists/${selected.id}`, { method: "DELETE" });
        setSelectedId(null);
        setBlade(null);
      },
      { refresh: load, successMessage: "Lijst verwijderd." }
    );
  }

  return (
    <>
      <EntraCommands>
        <EntraCommand onClick={openCreate}>+ Lijst</EntraCommand>
        <EntraCommand disabled={!selected} onClick={() => selected && openEdit(selected)}>
          Bewerken
        </EntraCommand>
        <EntraCommand disabled={!selected} onClick={() => void move("up")}>
          Omhoog
        </EntraCommand>
        <EntraCommand disabled={!selected} onClick={() => void move("down")}>
          Omlaag
        </EntraCommand>
        <EntraCommand disabled={!selected} onClick={() => void toggleActive()}>
          {selected?.active === false ? "Activeren" : "Uitzetten"}
        </EntraCommand>
        <EntraCommand danger disabled={!selected} onClick={() => void removeSelected()}>
          Verwijderen
        </EntraCommand>
        <EntraCommand onClick={() => void load()}>Vernieuwen</EntraCommand>
      </EntraCommands>

      <div className="entra-toolbar">
        <EntraSearch value={query} onChange={setQuery} placeholder="Zoek op lijsttitel" />
        <span className="entra-count">{loading ? "Laden…" : `${filtered.length} lijsten`}</span>
      </div>

      <div className="entra-table-wrap">
        <table className="entra-table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Producten</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((list) => (
              <tr
                key={list.id}
                className={selectedId === list.id ? "is-selected" : ""}
                onClick={() => setSelectedId(list.id)}
                onDoubleClick={() => openEdit(list)}
              >
                <td>
                  <button type="button" className="entra-link" onClick={() => openEdit(list)}>
                    {list.title}
                  </button>
                </td>
                <td>{list.productCount}</td>
                <td>
                  <span className={`entra-pill${list.active ? " is-on" : ""}`}>{list.active ? "Actief" : "Uit"}</span>
                </td>
              </tr>
            ))}
            {!loading && !filtered.length ? (
              <tr>
                <td colSpan={3} className="entra-empty">
                  Nog geen lijsten.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {blade ? (
        <EntraBlade title={blade === "edit" ? "Lijst bewerken" : "Lijst toevoegen"} onClose={() => setBlade(null)}>
          <label>
            Titel
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Bijv. Lijst start" />
          </label>
          <p className="entra-meta">{productIds.length} producten geselecteerd</p>
          <EntraSearch value={productQuery} onChange={setProductQuery} placeholder="Zoek producten om aan te vinken" />
          <div className="entra-product-picker">
            {pickerCategories.map((category) => {
              const ids = category.products.map((product) => product.id);
              const selectedCount = ids.filter((id) => productIds.includes(id)).length;
              return (
                <section key={category.id}>
                  <button type="button" className="entra-picker-cat" onClick={() => toggleCategory(category)}>
                    <strong>{category.name}</strong>
                    <span>
                      {selectedCount}/{ids.length}
                    </span>
                  </button>
                  {category.products.map((product) => (
                    <label className="entra-picker-item" key={product.id}>
                      <input type="checkbox" checked={productIds.includes(product.id)} onChange={() => toggleProduct(product.id)} />
                      {product.name}
                    </label>
                  ))}
                </section>
              );
            })}
          </div>
          <AdminButton variant="primary" type="button" onClick={() => void save()} disabled={!title.trim()}>
            Opslaan
          </AdminButton>
        </EntraBlade>
      ) : null}
    </>
  );
}
