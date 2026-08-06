"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  is_available: boolean;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  display_order?: number;
  products: Product[];
}

export default function ProductosPage() {
  const params = useParams<{ slug: string }>();
  const [menu, setMenu] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [showProductForm, setShowProductForm] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "" });
  const [addingProduct, setAddingProduct] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/${params.slug}/products`)
      .then((res) => res.json())
      .then((data) => {
        setMenu(data.menu || []);
        setLoading(false);
      });
  }, [params.slug]);

  async function addCategory() {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    const res = await fetch(`/api/${params.slug}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setMenu([...menu, { ...data.category, products: [] }]);
      setNewCatName("");
    }
    setAddingCat(false);
  }

  async function deleteCategory(catId: string) {
    const cat = menu.find((c) => c.id === catId);
    if (cat && cat.products.length > 0) {
      setError("Eliminá los productos de esta categoría primero.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setMenu(menu.filter((c) => c.id !== catId));
    const res = await fetch(`/api/${params.slug}/categories`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: catId }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al eliminar");
      setTimeout(() => setError(""), 3000);
    }
  }

  async function moveCategoryOrder(catId: string, direction: -1 | 1) {
    const idx = menu.findIndex((c) => c.id === catId);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= menu.length) return;

    const reordered = [...menu];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    setMenu(reordered);

    await Promise.all(
      reordered.map((c, i) =>
        fetch(`/api/${params.slug}/categories`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: c.id, display_order: i + 1 }),
        })
      )
    );
  }

  async function addProduct(categoryId: string) {
    if (!newProduct.name.trim() || !newProduct.price) return;
    setAddingProduct(true);
    const res = await fetch(`/api/${params.slug}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: categoryId,
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        description: newProduct.description.trim() || null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setMenu(
        menu.map((c) =>
          c.id === categoryId
            ? { ...c, products: [...c.products, data.product] }
            : c
        )
      );
      setNewProduct({ name: "", price: "", description: "" });
      setShowProductForm(null);
    }
    setAddingProduct(false);
  }

  async function deleteProduct(productId: string, categoryId: string) {
    setMenu(
      menu.map((c) =>
        c.id === categoryId
          ? { ...c, products: c.products.filter((p) => p.id !== productId) }
          : c
      )
    );
    await fetch(`/api/${params.slug}/products`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId }),
    });
  }

  async function toggleAvailability(productId: string, categoryId: string) {
    const cat = menu.find((c) => c.id === categoryId);
    const product = cat?.products.find((p) => p.id === productId);
    if (!product) return;

    setMenu(
      menu.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              products: c.products.map((p) =>
                p.id === productId ? { ...p, is_available: !p.is_available } : p
              ),
            }
          : c
      )
    );

    await fetch(`/api/${params.slug}/products`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, is_available: !product.is_available }),
    });
  }

  if (loading) {
    return (
      <main className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e8e6e1] border-t-[#b49a5a]" />
      </main>
    );
  }

  return (
    <main className="p-5 lg:p-0 space-y-5 max-w-2xl lg:max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink tracking-tight">Productos</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            {menu.reduce((sum, c) => sum + c.products.length, 0)} productos en {menu.length} categorías
          </p>
        </div>
      </div>

      {error && (
        <div className="card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
          placeholder="Nueva categoría..."
          className="input flex-1"
        />
        <button
          onClick={addCategory}
          disabled={addingCat || !newCatName.trim()}
          className="btn-primary whitespace-nowrap"
        >
          + Categoría
        </button>
      </div>

      {menu.length === 0 && (
        <div className="card flex flex-col items-center py-12 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-[#f5f3ee] flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-ink-faint">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-ink-muted">
            No hay categorías. Creá la primera para empezar a cargar productos.
          </p>
        </div>
      )}

      {menu.map((cat, catIdx) => (
        <div key={cat.id} className="card overflow-hidden">
          <div className="flex items-center">
            <button
              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
              className="flex-1 flex items-center justify-between px-5 py-4 text-left hover:bg-[#f5f3ee]/50 transition-colors"
            >
              <span className="font-semibold text-ink">{cat.name}</span>
              <div className="flex items-center gap-2">
                <span className="badge bg-[#f5f3ee] text-ink-muted">
                  {cat.products.length}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 text-ink-faint transition-transform ${expandedCat === cat.id ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </button>
            <div className="flex items-center gap-0.5 pr-3">
              <button
                onClick={() => moveCategoryOrder(cat.id, -1)}
                disabled={catIdx === 0}
                className="p-1.5 text-ink-faint hover:text-ink disabled:opacity-20 transition-colors"
                title="Subir"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
              <button
                onClick={() => moveCategoryOrder(cat.id, 1)}
                disabled={catIdx === menu.length - 1}
                className="p-1.5 text-ink-faint hover:text-ink disabled:opacity-20 transition-colors"
                title="Bajar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="p-1.5 text-ink-faint hover:text-red-500 transition-colors"
                title="Eliminar categoría"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          </div>

          {expandedCat === cat.id && (
            <div className="border-t border-[#e8e6e1]">
              {cat.products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-[#f5f3ee] last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-sm font-medium ${!product.is_available ? "line-through text-ink-faint" : "text-ink"}`}>
                        {product.name}
                      </span>
                      <span className="text-sm text-[#b49a5a] tabular-nums font-semibold">
                        ${product.price.toLocaleString("es-AR")}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-xs text-ink-faint truncate mt-0.5">{product.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAvailability(product.id, cat.id)}
                      className={`badge transition-colors ${
                        product.is_available
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {product.is_available ? "Disponible" : "Agotado"}
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id, cat.id)}
                      className="p-1.5 text-ink-faint hover:text-red-500 transition-colors"
                      title="Eliminar producto"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {showProductForm === cat.id ? (
                <div className="px-5 py-4 bg-[#f5f3ee]/50 space-y-3 border-t border-[#e8e6e1]">
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Nombre del producto"
                    className="input"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="Precio"
                      className="input"
                    />
                    <input
                      type="text"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Descripción"
                      className="input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowProductForm(null)} className="btn-secondary">
                      Cancelar
                    </button>
                    <button
                      onClick={() => addProduct(cat.id)}
                      disabled={addingProduct || !newProduct.name.trim() || !newProduct.price}
                      className="btn-primary flex-1"
                    >
                      {addingProduct ? "Guardando..." : "Agregar"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowProductForm(cat.id)}
                  className="w-full px-5 py-3 text-sm text-ink-faint hover:text-ink-muted hover:bg-[#f5f3ee]/50 border-t border-[#e8e6e1] transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Agregar producto
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
