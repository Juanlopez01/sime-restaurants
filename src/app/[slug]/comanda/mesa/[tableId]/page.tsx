"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { CategoryWithProducts, OrderWithItems } from "@/types";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { useStaff } from "@/contexts/staff-context";
import { PinLogin } from "@/components/staff/PinLogin";

interface PendingItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  notes: string;
}

export default function ComandaMesaPage() {
  const params = useParams<{ slug: string; tableId: string }>();
  const router = useRouter();
  const { staff, loading: staffLoading } = useStaff();
  const [menu, setMenu] = useState<CategoryWithProducts[]>([]);
  const [items, setItems] = useState<PendingItem[]>([]);
  const [existingOrders, setExistingOrders] = useState<OrderWithItems[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelSent, setCancelSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch(`/api/${params.slug}/products`).then((r) => r.json()),
      fetch(`/api/${params.slug}/orders?table_id=${params.tableId}`).then((r) => r.json()),
    ]).then(([menuData, ordersData]) => {
      setMenu(menuData.menu);
      if (menuData.menu.length > 0) setActiveCategory(menuData.menu[0].id);
      setExistingOrders(ordersData.orders ?? []);
      setLoading(false);
    });
  }, [params.slug, params.tableId]);

  function addItem(product: { id: string; name: string; price: number }) {
    const existing = items.find((i) => i.product_id === product.id);
    if (existing) {
      setItems(items.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { product_id: product.id, product_name: product.name, unit_price: product.price, quantity: 1, notes: "" }]);
    }
  }

  function removeItem(productId: string) {
    setItems(items.filter((i) => i.product_id !== productId));
  }

  function updateItemQuantity(productId: string, delta: number) {
    setItems(items.map((i) => i.product_id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter((i) => i.quantity > 0));
  }

  function updateItemNotes(productId: string, notes: string) {
    setItems(items.map((i) => i.product_id === productId ? { ...i, notes } : i));
  }

  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  async function sendOrder() {
    if (items.length === 0) return;
    setSending(true);
    try {
      const res = await fetch(`/api/${params.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_id: params.tableId, items, notes: orderNotes, waiter_id: staff?.id }),
      });
      if (res.ok) { router.push(`/${params.slug}/comanda`); return; }
    } catch { /* offline */ }
    router.push(`/${params.slug}/comanda`);
  }

  async function requestCancel(orderId: string) {
    try {
      await fetch(`/api/${params.slug}/cancel-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, requested_by: staff?.id, reason: cancelReason || undefined }),
      });
      setCancelSent((prev) => new Set(prev).add(orderId));
      setCancellingOrderId(null);
      setCancelReason("");
    } catch { /* offline */ }
  }

  const activeProducts = menu.find((c) => c.id === activeCategory)?.products ?? [];

  if (staffLoading) return null;
  if (!staff) return <PinLogin module="Comanda" />;

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#e8e6e1] border-t-[#b49a5a]" />
          <p className="mt-3 text-sm text-ink-faint">Cargando menú...</p>
        </div>
      </main>
    );
  }

  const categoryNav = (
    <div className="flex gap-1.5 overflow-x-auto bg-white px-4 py-2.5 scrollbar-hide border-b border-[#e8e6e1] lg:flex-col lg:gap-0.5 lg:px-0 lg:py-0 lg:bg-transparent lg:border-0">
      {menu.filter((c) => c.products.length > 0).map((cat) => (
        <button
          key={cat.id}
          onClick={() => setActiveCategory(cat.id)}
          className={`flex-shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors lg:w-full lg:text-left ${
            activeCategory === cat.id
              ? "bg-[#141414] text-white"
              : "text-[#999] hover:bg-[#f5f3ee] hover:text-[#1a1a1a]"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );

  const productList = (
    <div className="space-y-1.5">
      {activeProducts.filter((p) => p.is_available).map((product) => {
        const inCart = items.find((i) => i.product_id === product.id);
        return (
          <button
            key={product.id}
            onClick={() => addItem(product)}
            className="card flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-slate-50 touch-target hover:shadow-card-hover transition-all"
          >
            <div>
              <span className="text-sm font-medium text-ink">{product.name}</span>
              <span className="ml-2 text-sm text-ink-faint tabular-nums">${product.price.toLocaleString("es-AR")}</span>
            </div>
            {inCart && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#141414] text-xs font-bold text-white">
                {inCart.quantity}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const cartPanel = items.length > 0 ? (
    <div className="border-t border-slate-200 bg-white px-5 py-4 space-y-3 shadow-float lg:border-t-0 lg:shadow-none lg:rounded-2xl lg:border lg:border-slate-200/80">
      <p className="hidden lg:block section-label mb-2">Pedido actual</p>
      <div className="max-h-48 lg:max-h-[50vh] overflow-y-auto space-y-2">
        {items.map((item) => (
          <div key={item.product_id} className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <button onClick={() => updateItemQuantity(item.product_id, -1)} className="h-8 w-8 rounded-lg bg-slate-100 font-bold text-ink-muted touch-target active:bg-slate-200 transition-colors">-</button>
              <span className="w-6 text-center font-bold tabular-nums">{item.quantity}</span>
              <button onClick={() => updateItemQuantity(item.product_id, 1)} className="h-8 w-8 rounded-lg bg-slate-100 font-bold text-ink-muted touch-target active:bg-slate-200 transition-colors">+</button>
            </div>
            <span className="flex-1 truncate">{item.product_name}</span>
            <input type="text" placeholder="Nota..." value={item.notes} onChange={(e) => updateItemNotes(item.product_id, e.target.value)} className="w-24 input py-1.5 text-xs" />
            <span className="font-medium tabular-nums text-ink-muted">${(item.unit_price * item.quantity).toLocaleString("es-AR")}</span>
            <button onClick={() => removeItem(item.product_id)} className="text-red-400 hover:text-red-600 font-bold touch-target transition-colors">x</button>
          </div>
        ))}
      </div>

      <input type="text" placeholder="Notas generales del pedido..." value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} className="input" />

      <div className="flex items-center justify-between lg:pt-2 lg:border-t lg:border-slate-100">
        <span className="hidden lg:block text-lg font-bold text-ink tabular-nums">${total.toLocaleString("es-AR")}</span>
        <button
          onClick={sendOrder}
          disabled={sending}
          className="btn-primary w-full lg:w-auto"
        >
          {sending ? "Enviando..." : `Enviar pedido · $${total.toLocaleString("es-AR")}`}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <main className="min-h-screen bg-surface flex flex-col lg:flex-row">
      {/* Left side: header + menu */}
      <div className="flex-1 flex flex-col lg:min-h-screen">
        <header className="module-header">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-[#888] hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1>Mesa {params.tableId.replace(/^t/, "")}</h1>
          </div>
          {items.length > 0 && (
            <span className="badge bg-white/[0.06] text-[#999] lg:hidden">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
          )}
        </header>

        {existingOrders.length > 0 && (
          <div className="border-b border-[#e8e6e1] bg-[#f5f3ee] px-5 py-3.5 space-y-2.5">
            <p className="section-label">Pedidos activos</p>
            {existingOrders.map((order) => (
              <div key={order.id} className="card card-body">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">
                    #{order.order_number} — {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <span className="text-xs text-ink-faint tabular-nums">
                    ${order.subtotal.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                  {order.items.map((item) => (
                    <span key={item.id}>{item.quantity}x {item.product_name}</span>
                  ))}
                </div>
                {cancelSent.has(order.id) ? (
                  <p className="mt-2 text-xs text-[#b49a5a] font-medium">
                    Cancelación solicitada — esperando caja
                  </p>
                ) : cancellingOrderId === order.id ? (
                  <div className="mt-3 space-y-2">
                    <input type="text" placeholder="Motivo (opcional)..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="input text-sm py-2" />
                    <div className="flex gap-2">
                      <button onClick={() => requestCancel(order.id)} className="btn-primary flex-1 bg-red-600 hover:bg-red-700">Confirmar</button>
                      <button onClick={() => { setCancellingOrderId(null); setCancelReason(""); }} className="btn-secondary flex-1">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setCancellingOrderId(order.id)} className="mt-2 text-xs text-red-500 font-medium touch-target">
                    Solicitar cancelación
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Mobile category nav */}
        <div className="lg:hidden">{categoryNav}</div>

        {/* Desktop: sidebar categories + product grid */}
        <div className="hidden lg:flex flex-1">
          <div className="w-48 border-r border-slate-200/80 bg-white p-3 overflow-y-auto">
            <p className="section-label px-3 mb-2">Categorías</p>
            {categoryNav}
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
              {activeProducts.filter((p) => p.is_available).map((product) => {
                const inCart = items.find((i) => i.product_id === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => addItem(product)}
                    className="card flex items-center justify-between px-4 py-3.5 text-left hover:shadow-card-hover transition-all"
                  >
                    <div>
                      <span className="text-sm font-medium text-ink">{product.name}</span>
                      <span className="block text-sm text-ink-faint tabular-nums mt-0.5">${product.price.toLocaleString("es-AR")}</span>
                    </div>
                    {inCart && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#141414] text-xs font-bold text-white">
                        {inCart.quantity}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile product list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 lg:hidden">
          {productList}
        </div>

        {/* Mobile cart */}
        <div className="lg:hidden">{cartPanel}</div>
      </div>

      {/* Desktop right panel: cart */}
      <div className="hidden lg:flex lg:w-96 lg:flex-col lg:border-l lg:border-slate-200/80 bg-slate-50/50">
        <div className="p-5 border-b border-slate-200/80 bg-white">
          <h2 className="text-base font-bold text-ink tracking-tight">Pedido</h2>
          <p className="text-xs text-ink-faint mt-0.5">Mesa {params.tableId.replace(/^t/, "")}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-ink-faint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 mb-3 opacity-40">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
              </svg>
              <p className="text-sm">Seleccioná productos del menú</p>
            </div>
          ) : (
            cartPanel
          )}
        </div>
      </div>
    </main>
  );
}
