"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { OrderWithItems } from "@/types";
import { useStaff } from "@/contexts/staff-context";
import { PinLogin, StaffBadge } from "@/components/staff/PinLogin";
import { useRealtime } from "@/hooks/use-realtime";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationToasts, useToasts } from "@/components/ui/NotificationToasts";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return "0:00";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${m}:00`;
}

function urgencyLevel(dateStr: string): "ok" | "warning" | "critical" {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff >= 20) return "critical";
  if (diff >= 10) return "warning";
  return "ok";
}

const URGENCY_STYLES = {
  ok: "text-emerald-400",
  warning: "text-amber-400",
  critical: "text-red-400 animate-pulse",
};

interface KDSItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  notes: string | null;
  status: string;
}

interface KDSOrder {
  order: {
    id: string;
    order_number: number;
    status: string;
    created_at: string;
    notes: string | null;
    table: { id: string; table_number: string } | null;
    waiter: { id: string; name: string } | null;
  };
  items: KDSItem[];
}

type Station = "all" | "cocina" | "barra";
type ViewMode = "items" | "orders";

function ItemCard({
  item,
  order,
  onMarkItem,
}: {
  item: KDSItem;
  order: KDSOrder["order"];
  onMarkItem: (itemId: string, status: string) => void;
}) {
  const [elapsed, setElapsed] = useState(() => timeAgo(order.created_at));
  const [urgency, setUrgency] = useState(() => urgencyLevel(order.created_at));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(timeAgo(order.created_at));
      setUrgency(urgencyLevel(order.created_at));
    }, 10000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const isPending = item.status === "pending";
  const isPreparing = item.status === "preparing";

  return (
    <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">
            Mesa {order.table?.table_number ?? "?"}
          </span>
          <span className="text-[10px] text-[#555] font-mono">#{order.order_number}</span>
        </div>
        <span className={`font-mono text-xs font-bold tabular-nums ${URGENCY_STYLES[urgency]}`}>
          {elapsed}
        </span>
      </div>

      <div className="flex items-start gap-2 mb-3">
        <span className="text-lg font-bold text-white/70 tabular-nums">{item.quantity}×</span>
        <div className="flex-1">
          <span className="text-lg font-semibold text-white">{item.product_name}</span>
          {item.notes && <p className="text-xs text-[#b49a5a] mt-0.5">→ {item.notes}</p>}
        </div>
      </div>

      {order.notes && (
        <p className="text-xs text-[#666] mb-3 border-t border-[#2a2a2a] pt-2">
          {order.notes}
        </p>
      )}

      {isPending && (
        <button
          onClick={() => onMarkItem(item.id, "preparing")}
          className="w-full rounded-lg bg-orange-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-orange-700 transition-colors"
        >
          Preparar
        </button>
      )}
      {isPreparing && (
        <button
          onClick={() => onMarkItem(item.id, "ready")}
          className="w-full rounded-lg bg-green-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors"
        >
          Listo
        </button>
      )}
    </div>
  );
}

function OrderCard({
  kdsOrder,
  onMarkItem,
  onMarkOrder,
}: {
  kdsOrder: KDSOrder;
  onMarkItem: (itemId: string, status: string) => void;
  onMarkOrder: (orderId: string, status: string) => void;
}) {
  const { order, items } = kdsOrder;
  const [elapsed, setElapsed] = useState(() => timeAgo(order.created_at));
  const [urgency, setUrgency] = useState(() => urgencyLevel(order.created_at));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(timeAgo(order.created_at));
      setUrgency(urgencyLevel(order.created_at));
    }, 10000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const isQR = order.notes?.includes("[Pedido desde QR]");
  const allReady = items.every((i) => i.status === "ready");
  const someReady = items.some((i) => i.status === "ready");

  return (
    <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">
            Mesa {order.table?.table_number ?? "?"}
          </span>
          <span className="text-xs text-[#555] font-mono">#{order.order_number}</span>
          {isQR && (
            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-purple-400">QR</span>
          )}
        </div>
        <span className={`font-mono text-sm font-bold tabular-nums ${URGENCY_STYLES[urgency]}`}>
          {elapsed}
        </span>
      </div>

      <div className="px-4 py-3 space-y-2">
        {items.map((item) => {
          const statusColor =
            item.status === "ready" ? "text-green-400" :
            item.status === "preparing" ? "text-orange-400" : "text-white/50";
          const statusIcon =
            item.status === "ready" ? "✓" :
            item.status === "preparing" ? "●" : "○";

          return (
            <div key={item.id} className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (item.status === "pending") onMarkItem(item.id, "preparing");
                  else if (item.status === "preparing") onMarkItem(item.id, "ready");
                }}
                className={`text-base flex-shrink-0 ${statusColor} hover:scale-110 transition-transform`}
                title={item.status === "pending" ? "Marcar preparando" : item.status === "preparing" ? "Marcar listo" : "Listo"}
              >
                {statusIcon}
              </button>
              <span className="text-base font-bold text-white/70 w-6 text-right tabular-nums flex-shrink-0">
                {item.quantity}×
              </span>
              <div className="flex-1 min-w-0">
                <span className={`text-base font-semibold ${item.status === "ready" ? "text-green-300 line-through opacity-60" : "text-white"}`}>
                  {item.product_name}
                </span>
                {item.notes && <p className="text-xs text-[#b49a5a] mt-0.5">→ {item.notes}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {order.notes && (
        <div className="px-4 pb-2">
          <p className="text-xs text-[#b49a5a] border-t border-[#2a2a2a] pt-2">{order.notes}</p>
        </div>
      )}

      <div className="px-3 pb-3 flex gap-2">
        {!allReady && !someReady && order.status === "pending" && (
          <button
            onClick={() => onMarkOrder(order.id, "in_kitchen")}
            className="flex-1 rounded-lg bg-orange-600 px-3 py-3 text-sm font-bold text-white hover:bg-orange-700 transition-colors"
          >
            Todo a preparar
          </button>
        )}
        {allReady && (
          <button
            onClick={() => onMarkOrder(order.id, "ready")}
            className="flex-1 rounded-lg bg-green-600 px-3 py-3 text-sm font-bold text-white hover:bg-green-700 transition-colors"
          >
            Pedido completo
          </button>
        )}
      </div>
    </div>
  );
}

export default function CocinaPage() {
  const params = useParams<{ slug: string }>();
  const { staff, loading: staffLoading, logout } = useStaff();
  const [kdsOrders, setKdsOrders] = useState<KDSOrder[]>([]);
  const [, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [station, setStation] = useState<Station>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("orders");
  const { toasts, addToast, removeToast } = useToasts();
  const { initialize, checkForNewOrders } = useNotifications(addToast);
  const initializedRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    try {
      const stationParam = station !== "all" ? `?station=${station}` : "";
      const [itemsRes, ordersRes] = await Promise.all([
        fetch(`/api/${params.slug}/order-items${stationParam}`),
        fetch(`/api/${params.slug}/orders`),
      ]);

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setKdsOrders(data.orders ?? []);
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        const fetched = data.orders as OrderWithItems[];
        setOrders(fetched);

        if (!initializedRef.current) {
          initialize(fetched.map((o) => o.id));
          initializedRef.current = true;
        } else {
          checkForNewOrders(fetched);
        }
      }
    } catch {}
    setLoading(false);
  }, [params.slug, station, initialize, checkForNewOrders]);

  useEffect(() => {
    if (!staff) return;
    fetchOrders();
  }, [fetchOrders, staff]);

  useRealtime({ table: "orders", onUpdate: fetchOrders });
  useRealtime({ table: "order_items", onUpdate: fetchOrders });

  async function handleMarkItem(itemId: string, status: string) {
    setKdsOrders((prev) =>
      prev.map((ko) => ({
        ...ko,
        items: ko.items.map((i) => (i.id === itemId ? { ...i, status } : i)),
      }))
    );

    try {
      await fetch(`/api/${params.slug}/order-items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, status }),
      });
      fetchOrders();
    } catch {}
  }

  async function handleMarkOrder(orderId: string, status: string) {
    try {
      await fetch(`/api/${params.slug}/orders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status }),
      });
      fetchOrders();
    } catch {}
  }

  const totalItems = kdsOrders.reduce((sum, ko) => sum + ko.items.filter((i) => i.status !== "ready").length, 0);

  if (staffLoading) return null;
  if (!staff) return <PinLogin module="Cocina" />;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-orange-500/30 border-t-orange-500" />
          <p className="mt-3 text-sm text-slate-500">Cargando pedidos...</p>
        </div>
      </main>
    );
  }

  const pendingItems = kdsOrders.flatMap((ko) =>
    ko.items.filter((i) => i.status === "pending").map((i) => ({ item: i, order: ko.order }))
  );
  const preparingItems = kdsOrders.flatMap((ko) =>
    ko.items.filter((i) => i.status === "preparing").map((i) => ({ item: i, order: ko.order }))
  );
  const readyItems = kdsOrders.flatMap((ko) =>
    ko.items.filter((i) => i.status === "ready").map((i) => ({ item: i, order: ko.order }))
  );

  return (
    <main className="min-h-screen bg-[#0f0f0f]">
      <NotificationToasts toasts={toasts} onDismiss={removeToast} />

      <header className="module-header">
        <div className="flex items-center gap-3">
          <Link href={`/${params.slug}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-[#888] hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1>Cocina</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StaffBadge onLogout={logout} />

          {/* Station filter */}
          <div className="flex rounded-lg bg-white/[0.06] p-0.5">
            {([["all", "Todo"], ["cocina", "Cocina"], ["barra", "Barra"]] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStation(val)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${station === val ? "bg-white/10 text-white" : "text-[#666] hover:text-[#999]"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg bg-white/[0.06] p-0.5">
            <button
              onClick={() => setViewMode("orders")}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${viewMode === "orders" ? "bg-white/10 text-white" : "text-[#666] hover:text-[#999]"}`}
            >
              Pedidos
            </button>
            <button
              onClick={() => setViewMode("items")}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${viewMode === "items" ? "bg-white/10 text-white" : "text-[#666] hover:text-[#999]"}`}
            >
              Items
            </button>
          </div>

          <span className="badge bg-white/[0.06] text-[#999]">
            {totalItems} pendiente{totalItems !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {kdsOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] text-slate-600">
          <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-emerald-500">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-slate-400">
            Sin pedidos {station !== "all" ? `en ${station}` : "pendientes"}
          </p>
          <p className="mt-1 text-sm text-slate-600">Los nuevos pedidos aparecen automáticamente</p>
        </div>
      ) : viewMode === "items" ? (
        /* Items view — 3 columns */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-[calc(100vh-64px)]">
          {[
            { title: "Pendiente", color: "text-amber-400", dot: "bg-amber-400", items: pendingItems },
            { title: "Preparando", color: "text-orange-400", dot: "bg-orange-400", items: preparingItems },
            { title: "Listo", color: "text-green-400", dot: "bg-green-400", items: readyItems },
          ].map((col) => (
            <div key={col.title} className="flex flex-col border-b lg:border-b-0 lg:border-r border-[#1a1a1a] last:border-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#111]">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <span className={`text-sm font-bold ${col.color}`}>{col.title}</span>
                </div>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-bold text-[#666] tabular-nums">{col.items.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {col.items.length === 0 ? (
                  <p className="text-center text-xs text-[#333] py-8">Sin items</p>
                ) : (
                  col.items.map(({ item, order }) => (
                    <ItemCard key={item.id} item={item} order={order} onMarkItem={handleMarkItem} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Orders view */
        <div className="p-4 lg:p-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:max-w-7xl lg:mx-auto">
          {kdsOrders.map((ko) => (
            <OrderCard key={ko.order.id} kdsOrder={ko} onMarkItem={handleMarkItem} onMarkOrder={handleMarkOrder} />
          ))}
        </div>
      )}
    </main>
  );
}
