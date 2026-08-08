"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string;
}

interface ProductIngredient {
  id: string;
  product_id: string;
  ingredient_id: string;
  quantity_needed: number;
  ingredient: { id: string; name: string; unit: string; current_stock: number };
}

interface IngredientForm {
  name: string;
  unit: string;
  current_stock: string;
  min_stock: string;
  cost_per_unit: string;
}

const EMPTY_FORM: IngredientForm = {
  name: "",
  unit: "unidad",
  current_stock: "0",
  min_stock: "0",
  cost_per_unit: "0",
};

const UNITS = ["unidad", "kg", "g", "litro", "ml", "docena", "paquete", "botella", "lata"];

export default function InventarioPage() {
  const params = useParams<{ slug: string }>();
  const [tab, setTab] = useState<"ingredientes" | "recetas">("ingredientes");

  // Ingredients state
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IngredientForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [stockAdjust, setStockAdjust] = useState<{ id: string; amount: string } | null>(null);

  // Recipes state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [productIngredients, setProductIngredients] = useState<ProductIngredient[]>([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [newLink, setNewLink] = useState({ ingredient_id: "", quantity_needed: "1" });

  const fetchIngredients = useCallback(async () => {
    try {
      const res = await fetch(`/api/${params.slug}/ingredients`);
      if (res.ok) {
        const data = await res.json();
        setIngredients(data.ingredients ?? []);
      }
    } catch {}
    setLoading(false);
  }, [params.slug]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/${params.slug}/products`);
      if (res.ok) {
        const data = await res.json();
        const allProducts: Product[] = [];
        if (data.categories) {
          for (const cat of data.categories) {
            if (cat.products) {
              for (const p of cat.products) {
                allProducts.push(p);
              }
            }
          }
        }
        setProducts(allProducts);
      }
    } catch {}
  }, [params.slug]);

  const fetchProductIngredients = useCallback(async (productId: string) => {
    setLoadingRecipe(true);
    try {
      const res = await fetch(`/api/${params.slug}/product-ingredients?product_id=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setProductIngredients(data.product_ingredients ?? []);
      }
    } catch {}
    setLoadingRecipe(false);
  }, [params.slug]);

  useEffect(() => {
    fetchIngredients();
    fetchProducts();
  }, [fetchIngredients, fetchProducts]);

  useEffect(() => {
    if (selectedProduct) {
      fetchProductIngredients(selectedProduct);
    } else {
      setProductIngredients([]);
    }
  }, [selectedProduct, fetchProductIngredients]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      name: form.name.trim(),
      unit: form.unit,
      current_stock: parseFloat(form.current_stock) || 0,
      min_stock: parseFloat(form.min_stock) || 0,
      cost_per_unit: parseFloat(form.cost_per_unit) || 0,
    };
    const res = await fetch(`/api/${params.slug}/ingredients`, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchIngredients();
    }
    setSaving(false);
  };

  const handleEdit = (ing: Ingredient) => {
    setEditingId(ing.id);
    setForm({
      name: ing.name,
      unit: ing.unit,
      current_stock: String(ing.current_stock),
      min_stock: String(ing.min_stock),
      cost_per_unit: String(ing.cost_per_unit),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/${params.slug}/ingredients?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchIngredients();
  };

  const handleStockAdjust = async (id: string, delta: number) => {
    const ing = ingredients.find((i) => i.id === id);
    if (!ing) return;
    const newStock = Math.max(0, ing.current_stock + delta);
    const res = await fetch(`/api/${params.slug}/ingredients`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, current_stock: newStock }),
    });
    if (res.ok) fetchIngredients();
    setStockAdjust(null);
  };

  const handleAddLink = async () => {
    if (!selectedProduct || !newLink.ingredient_id) return;
    setAddingIngredient(true);
    const res = await fetch(`/api/${params.slug}/product-ingredients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: selectedProduct,
        ingredient_id: newLink.ingredient_id,
        quantity_needed: parseFloat(newLink.quantity_needed) || 1,
      }),
    });
    if (res.ok) {
      setNewLink({ ingredient_id: "", quantity_needed: "1" });
      fetchProductIngredients(selectedProduct);
    }
    setAddingIngredient(false);
  };

  const handleRemoveLink = async (linkId: string) => {
    const res = await fetch(`/api/${params.slug}/product-ingredients?id=${linkId}`, { method: "DELETE" });
    if (res.ok && selectedProduct) fetchProductIngredients(selectedProduct);
  };

  const lowStockItems = ingredients.filter((i) => i.current_stock <= i.min_stock && i.min_stock > 0);
  const linkedIngredientIds = new Set(productIngredients.map((pi) => pi.ingredient_id));
  const availableIngredients = ingredients.filter((i) => !linkedIngredientIds.has(i.id));

  return (
    <div className="p-4 lg:p-0 space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-[#f0ede6] p-1">
        <button
          onClick={() => setTab("ingredientes")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "ingredientes" ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#777] hover:text-[#1a1a1a]"
          }`}
        >
          Ingredientes
        </button>
        <button
          onClick={() => setTab("recetas")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "recetas" ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#777] hover:text-[#1a1a1a]"
          }`}
        >
          Recetas
        </button>
      </div>

      {tab === "ingredientes" ? (
        <>
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#777]">
              Controlá el stock de ingredientes y recibí alertas cuando quede poco.
            </p>
            <button
              onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); }}
              className="flex items-center gap-2 rounded-lg bg-[#141414] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a2a2a] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Agregar ingrediente
            </button>
          </div>

          {/* Low stock alert */}
          {lowStockItems.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="text-sm font-semibold text-amber-800">Stock bajo ({lowStockItems.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.map((i) => (
                  <span key={i.id} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                    {i.name}
                    <span className="font-bold tabular-nums">{i.current_stock} {i.unit}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e8e6e1] border-t-[#b49a5a]" />
            </div>
          ) : ingredients.length === 0 ? (
            <div className="rounded-xl border border-[#e8e6e1] bg-white text-center py-12 px-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-[#ccc] mx-auto mb-3">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <path d="M3 6h18M16 10a4 4 0 01-8 0" />
              </svg>
              <p className="text-sm text-[#999]">No hay ingredientes cargados. Agregá ingredientes para controlar el stock.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e8e6e1]">
                    <th className="text-left py-3 font-semibold text-[#999] text-xs uppercase tracking-wider">Ingrediente</th>
                    <th className="text-right py-3 font-semibold text-[#999] text-xs uppercase tracking-wider">Stock</th>
                    <th className="text-right py-3 font-semibold text-[#999] text-xs uppercase tracking-wider hidden sm:table-cell">Mínimo</th>
                    <th className="text-right py-3 font-semibold text-[#999] text-xs uppercase tracking-wider hidden sm:table-cell">Costo/u</th>
                    <th className="text-right py-3 font-semibold text-[#999] text-xs uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ing) => {
                    const isLow = ing.current_stock <= ing.min_stock && ing.min_stock > 0;
                    return (
                      <tr key={ing.id} className="border-b border-[#f0ede6]">
                        <td className="py-3">
                          <span className="font-medium text-[#1a1a1a]">{ing.name}</span>
                          <span className="ml-1.5 text-xs text-[#999]">({ing.unit})</span>
                        </td>
                        <td className="py-3 text-right tabular-nums">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${isLow ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                            {isLow && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                              </svg>
                            )}
                            {ing.current_stock}
                          </span>
                        </td>
                        <td className="py-3 text-right tabular-nums text-[#777] hidden sm:table-cell">{ing.min_stock}</td>
                        <td className="py-3 text-right tabular-nums text-[#777] hidden sm:table-cell">${Number(ing.cost_per_unit).toLocaleString("es-AR")}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {stockAdjust?.id === ing.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={stockAdjust.amount}
                                  onChange={(e) => setStockAdjust({ ...stockAdjust, amount: e.target.value })}
                                  className="w-16 rounded border border-[#e8e6e1] px-2 py-1 text-xs text-right tabular-nums"
                                  autoFocus
                                />
                                <button onClick={() => handleStockAdjust(ing.id, parseFloat(stockAdjust.amount) || 0)} className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700">OK</button>
                                <button onClick={() => setStockAdjust(null)} className="rounded bg-[#f0ede6] px-2 py-1 text-xs text-[#777] hover:bg-[#e8e5dd]">X</button>
                              </div>
                            ) : (
                              <>
                                <button onClick={() => setStockAdjust({ id: ing.id, amount: "" })} title="Ajustar stock" className="rounded-lg p-1.5 text-[#999] hover:bg-[#f5f3ee] hover:text-[#1a1a1a] transition-colors">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 20V10M6 20v-4M18 20V4" /></svg>
                                </button>
                                <button onClick={() => handleEdit(ing)} title="Editar" className="rounded-lg p-1.5 text-[#999] hover:bg-[#f5f3ee] hover:text-[#1a1a1a] transition-colors">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                </button>
                                <button onClick={() => handleDelete(ing.id)} title="Eliminar" className="rounded-lg p-1.5 text-[#999] hover:bg-red-50 hover:text-red-600 transition-colors">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* Recetas tab */
        <>
          <p className="text-sm text-[#777]">
            Definí qué ingredientes lleva cada producto. Cuando se envíe un pedido a cocina, se descuenta el stock automáticamente.
          </p>

          {/* Product selector */}
          <div>
            <label className="text-xs font-medium text-[#999] uppercase tracking-wider">Producto</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#e8e6e1] px-3 py-2.5 text-sm focus:border-[#b49a5a] focus:outline-none"
            >
              <option value="">Seleccioná un producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — ${Number(p.price).toLocaleString("es-AR")}</option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="rounded-xl border border-[#e8e6e1] bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e8e6e1] bg-[#fafaf8]">
                <h3 className="text-sm font-semibold text-[#1a1a1a]">
                  Ingredientes de &ldquo;{products.find((p) => p.id === selectedProduct)?.name}&rdquo;
                </h3>
              </div>

              {loadingRecipe ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e8e6e1] border-t-[#b49a5a]" />
                </div>
              ) : (
                <div className="divide-y divide-[#f0ede6]">
                  {productIngredients.map((pi) => (
                    <div key={pi.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="text-sm font-medium text-[#1a1a1a]">{pi.ingredient.name}</span>
                        <span className="ml-2 text-xs text-[#999]">
                          {pi.quantity_needed} {pi.ingredient.unit} por unidad
                        </span>
                        {pi.ingredient.current_stock <= 0 && (
                          <span className="ml-2 text-xs font-semibold text-red-500">Sin stock</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveLink(pi.id)}
                        className="rounded-lg p-1.5 text-[#999] hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {productIngredients.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-[#999]">
                      Este producto no tiene ingredientes vinculados.
                    </p>
                  )}
                </div>
              )}

              {/* Add ingredient to recipe */}
              {ingredients.length > 0 && availableIngredients.length > 0 && (
                <div className="border-t border-[#e8e6e1] px-4 py-3 bg-[#fafaf8]">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-[#999] uppercase tracking-wider">Ingrediente</label>
                      <select
                        value={newLink.ingredient_id}
                        onChange={(e) => setNewLink({ ...newLink, ingredient_id: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm focus:border-[#b49a5a] focus:outline-none"
                      >
                        <option value="">Seleccionar...</option>
                        {availableIngredients.map((i) => (
                          <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="text-xs font-medium text-[#999] uppercase tracking-wider">Cantidad</label>
                      <input
                        type="number"
                        value={newLink.quantity_needed}
                        onChange={(e) => setNewLink({ ...newLink, quantity_needed: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm focus:border-[#b49a5a] focus:outline-none tabular-nums"
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                    <button
                      onClick={handleAddLink}
                      disabled={addingIngredient || !newLink.ingredient_id}
                      className="rounded-lg bg-[#141414] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
                    >
                      {addingIngredient ? "..." : "Agregar"}
                    </button>
                  </div>
                </div>
              )}

              {ingredients.length === 0 && (
                <div className="border-t border-[#e8e6e1] px-4 py-4 text-center">
                  <p className="text-sm text-[#999]">
                    Primero cargá ingredientes en la pestaña &ldquo;Ingredientes&rdquo;.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add/Edit ingredient modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-4">
              {editingId ? "Editar ingrediente" : "Nuevo ingrediente"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#999] uppercase tracking-wider">Nombre</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Carne picada" className="mt-1 w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm focus:border-[#b49a5a] focus:outline-none" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#999] uppercase tracking-wider">Unidad</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm focus:border-[#b49a5a] focus:outline-none">
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#999] uppercase tracking-wider">Stock actual</label>
                  <input type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm focus:border-[#b49a5a] focus:outline-none tabular-nums" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#999] uppercase tracking-wider">Stock mínimo</label>
                  <input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm focus:border-[#b49a5a] focus:outline-none tabular-nums" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#999] uppercase tracking-wider">Costo por unidad</label>
                  <input type="number" value={form.cost_per_unit} onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm focus:border-[#b49a5a] focus:outline-none tabular-nums" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }} disabled={saving} className="rounded-lg border border-[#e8e6e1] px-4 py-2 text-sm font-medium text-[#777] hover:bg-[#f5f3ee] transition-colors">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving || !form.name.trim()} className="rounded-lg bg-[#141414] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-50">
                {saving ? "Guardando..." : editingId ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
