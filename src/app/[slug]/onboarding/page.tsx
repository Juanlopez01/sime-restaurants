"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { formatPrice } from "@/lib/format";

type Step = "menu" | "mesas" | "equipo";
const STEPS: { key: Step; label: string; icon: string }[] = [
  { key: "menu", label: "Menú", icon: "📖" },
  { key: "mesas", label: "Mesas", icon: "🪑" },
  { key: "equipo", label: "Equipo", icon: "👥" },
];

interface Category {
  id: string;
  name: string;
  products: { id: string; name: string; price: number; description: string }[];
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  pin: string;
}

export default function OnboardingPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("menu");
  const currentIdx = STEPS.findIndex((s) => s.key === step);

  // --- Menu state ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "" });
  const [addingProduct, setAddingProduct] = useState(false);

  // --- Tables state ---
  const [tableCount, setTableCount] = useState(8);
  const [creatingTables, setCreatingTables] = useState(false);
  const [tablesCreated, setTablesCreated] = useState(false);

  // --- Staff state ---
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newStaff, setNewStaff] = useState({ name: "", role: "waiter", pin: "" });
  const [addingStaff, setAddingStaff] = useState(false);

  async function addCategory() {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    const res = await fetch(`/api/${params.slug}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setCategories([...categories, { ...data.category, products: [] }]);
      setNewCatName("");
      setActiveCat(data.category.id);
    }
    setAddingCat(false);
  }

  async function addProduct() {
    if (!activeCat || !newProduct.name.trim() || !newProduct.price) return;
    setAddingProduct(true);
    const res = await fetch(`/api/${params.slug}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: activeCat,
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        description: newProduct.description.trim() || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setCategories(
        categories.map((c) =>
          c.id === activeCat
            ? { ...c, products: [...c.products, data.product] }
            : c
        )
      );
      setNewProduct({ name: "", price: "", description: "" });
    }
    setAddingProduct(false);
  }

  async function createTables() {
    setCreatingTables(true);
    const cols = 4;
    const promises = Array.from({ length: tableCount }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return fetch(`/api/${params.slug}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_number: String(i + 1),
          x: 60 + col * 120,
          y: 60 + row * 120,
          shape: "square",
          capacity: 4,
        }),
      });
    });
    await Promise.all(promises);
    setTablesCreated(true);
    setCreatingTables(false);
  }

  async function addStaffMember() {
    if (!newStaff.name.trim() || !newStaff.pin.trim()) return;
    setAddingStaff(true);
    const res = await fetch(`/api/${params.slug}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStaff),
    });
    const data = await res.json();
    if (res.ok) {
      setStaff([...staff, data.user]);
      setNewStaff({ name: "", role: "waiter", pin: "" });
    } else {
      alert(data.error);
    }
    setAddingStaff(false);
  }

  function nextStep() {
    if (currentIdx < STEPS.length - 1) {
      setStep(STEPS[currentIdx + 1].key);
    }
  }

  function finish() {
    router.push(`/${params.slug}`);
  }

  const roleLabels: Record<string, string> = {
    waiter: "Mozo",
    kitchen: "Cocina",
    cashier: "Cajero",
    admin: "Admin",
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col">
      <header className="px-6 pt-8 pb-6 text-center">
        <p className="text-[#b49a5a] text-xs uppercase tracking-widest font-medium">
          Configuración inicial
        </p>
        <h1 className="font-display text-2xl font-bold text-white mt-2">
          {user?.restaurantName || "Tu restaurante"}
        </h1>

        {/* Progress */}
        <div className="flex items-center justify-center gap-1 mt-6 max-w-xs mx-auto">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <div
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= currentIdx ? "bg-[#b49a5a]" : "bg-white/10"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between max-w-xs mx-auto mt-2">
          {STEPS.map((s) => (
            <span
              key={s.key}
              className={`text-[10px] ${
                s.key === step ? "text-[#b49a5a]" : "text-stone-600"
              }`}
            >
              {s.icon} {s.label}
            </span>
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full">
        {/* --- STEP: MENU --- */}
        {step === "menu" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-medium text-white mb-1">
                Armá tu carta
              </p>
              <p className="text-xs text-stone-500 mb-4">
                Creá categorías y agregá productos. Podés modificarlo después.
              </p>

              {/* Add category */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  placeholder="Ej: Entradas, Parrilla, Bebidas..."
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none"
                />
                <button
                  onClick={addCategory}
                  disabled={addingCat || !newCatName.trim()}
                  className="rounded-xl bg-[#b49a5a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#c4aa6a] disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  + Categoría
                </button>
              </div>

              {/* Category tabs */}
              {categories.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCat(cat.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        activeCat === cat.id
                          ? "bg-[#b49a5a] text-white"
                          : "bg-white/5 text-stone-400 hover:bg-white/10"
                      }`}
                    >
                      {cat.name}
                      <span className="ml-1 opacity-60">
                        ({cat.products.length})
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Add product to active category */}
              {activeCat && (
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <p className="text-xs text-stone-400">
                    Agregá productos a{" "}
                    <span className="text-white font-medium">
                      {categories.find((c) => c.id === activeCat)?.name}
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      placeholder="Nombre del producto"
                      className="col-span-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                      placeholder="Precio"
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          description: e.target.value,
                        })
                      }
                      placeholder="Descripción (opcional)"
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={addProduct}
                    disabled={
                      addingProduct ||
                      !newProduct.name.trim() ||
                      !newProduct.price
                    }
                    className="w-full rounded-xl border border-[#b49a5a]/30 bg-[#b49a5a]/10 px-4 py-2.5 text-sm font-medium text-[#b49a5a] hover:bg-[#b49a5a]/20 disabled:opacity-50 transition-colors"
                  >
                    {addingProduct ? "Guardando..." : "+ Agregar producto"}
                  </button>

                  {/* Product list */}
                  {categories
                    .find((c) => c.id === activeCat)
                    ?.products.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"
                      >
                        <span className="text-sm text-white">{p.name}</span>
                        <span className="text-sm text-[#b49a5a] tabular-nums">
                          {formatPrice(p.price)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <button
              onClick={nextStep}
              className="w-full rounded-xl bg-[#b49a5a] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#c4aa6a] transition-colors"
            >
              {categories.length > 0 ? "Siguiente: Mesas →" : "Omitir por ahora →"}
            </button>
          </div>
        )}

        {/* --- STEP: MESAS --- */}
        {step === "mesas" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-medium text-white mb-1">
                Configurá tus mesas
              </p>
              <p className="text-xs text-stone-500 mb-6">
                Indicá cuántas mesas tiene tu restaurante. Después podés
                editarlas en el mapa de salón.
              </p>

              {!tablesCreated ? (
                <>
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <button
                      onClick={() => setTableCount(Math.max(1, tableCount - 1))}
                      className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 text-xl text-white hover:bg-white/10 transition-colors"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <span className="text-4xl font-bold text-white tabular-nums">
                        {tableCount}
                      </span>
                      <p className="text-xs text-stone-500 mt-1">mesas</p>
                    </div>
                    <button
                      onClick={() => setTableCount(tableCount + 1)}
                      className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 text-xl text-white hover:bg-white/10 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={createTables}
                    disabled={creatingTables}
                    className="w-full rounded-xl bg-[#b49a5a] px-4 py-3 text-sm font-bold text-white hover:bg-[#c4aa6a] disabled:opacity-50 transition-colors"
                  >
                    {creatingTables
                      ? "Creando mesas..."
                      : `Crear ${tableCount} mesas`}
                  </button>
                </>
              ) : (
                <div className="text-center py-4">
                  <span className="text-3xl">✅</span>
                  <p className="mt-2 text-sm text-white font-medium">
                    {tableCount} mesas creadas
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Podés editarlas desde Admin → Editor de salón
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={nextStep}
              className="w-full rounded-xl bg-[#b49a5a] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#c4aa6a] transition-colors"
            >
              {tablesCreated ? "Siguiente: Equipo →" : "Omitir por ahora →"}
            </button>
          </div>
        )}

        {/* --- STEP: EQUIPO --- */}
        {step === "equipo" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-medium text-white mb-1">
                Agregá tu equipo
              </p>
              <p className="text-xs text-stone-500 mb-4">
                Cada miembro ingresa con un PIN. Sin apps, sin cuentas.
              </p>

              <div className="space-y-3">
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, name: e.target.value })
                  }
                  placeholder="Nombre"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newStaff.role}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, role: e.target.value })
                    }
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#b49a5a]/50 focus:outline-none appearance-none"
                  >
                    <option value="waiter">Mozo</option>
                    <option value="kitchen">Cocina</option>
                    <option value="cashier">Cajero</option>
                    <option value="admin">Admin</option>
                  </select>
                  <input
                    type="text"
                    value={newStaff.pin}
                    onChange={(e) =>
                      setNewStaff({
                        ...newStaff,
                        pin: e.target.value.replace(/\D/g, "").slice(0, 6),
                      })
                    }
                    placeholder="PIN (4+ dígitos)"
                    inputMode="numeric"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none"
                  />
                </div>
                <button
                  onClick={addStaffMember}
                  disabled={
                    addingStaff ||
                    !newStaff.name.trim() ||
                    newStaff.pin.length < 4
                  }
                  className="w-full rounded-xl border border-[#b49a5a]/30 bg-[#b49a5a]/10 px-4 py-2.5 text-sm font-medium text-[#b49a5a] hover:bg-[#b49a5a]/20 disabled:opacity-50 transition-colors"
                >
                  {addingStaff ? "Guardando..." : "+ Agregar miembro"}
                </button>
              </div>

              {/* Staff list */}
              {staff.length > 0 && (
                <div className="mt-4 space-y-2">
                  {staff.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5"
                    >
                      <div>
                        <span className="text-sm text-white font-medium">
                          {s.name}
                        </span>
                        <span className="ml-2 text-xs text-stone-500">
                          {roleLabels[s.role] || s.role}
                        </span>
                      </div>
                      <span className="text-xs text-stone-400 font-mono">
                        PIN: {s.pin}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={finish}
              className="w-full rounded-xl bg-[#b49a5a] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#c4aa6a] transition-colors"
            >
              Empezar a usar Mise →
            </button>
          </div>
        )}

        <button
          onClick={() => router.push(`/${params.slug}`)}
          className="w-full mt-3 rounded-xl px-4 py-3 text-sm text-stone-500 hover:text-stone-300 transition-colors text-center"
        >
          Saltar configuración
        </button>
      </main>
    </div>
  );
}
