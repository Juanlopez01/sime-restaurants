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

function KDSCard({
  order,
  onAction,
  actionLabel,
  actionColor,
}: {
  order: OrderWithItems;
  onAction: () => void;
  actionLabel: string;
  actionColor: string;
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

  const isQR = order.notes?.includes("[Pedido desde QR]");

  return (
    <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">
            Mesa {order.table?.table_number ?? "?"}
          </span>
          <span className="text-xs text-[#555] font-mono">#{order.order_number}</span>
          {isQR && (
            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-purple-400">
              QR
            </span>
          )}
        </div>
        <span className={`font-mono text-sm font-bold tabular-nums ${URGENCY_STYLES[urgency]}`}>
          {elapsed}
        </span>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <span className="text-base font-bold text-white/70 w-6 text-right tabular-nums flex-shrink-0">
              {item.quantity}×
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-base font-semibold text-white">{item.product_name}</span>
              {item.notes && (
                <p className="text-xs text-[#b49a5a] mt-0.5">→ {item.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="px-4 pb-2">
          <p className="text-xs text-[#b49a5a] border-t border-[#2a2a2a] pt-2">
            {order.notes}
          </p>
        </div>
      )}

      {/* Action */}
      <div className="px-3 pb-3">
        <button
          onClick={onAction}
          className={`w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition-colors ${actionColor}`}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

export default function CocinaPage() {
  const params = useParams<{ slug: string }>();
  const { staff, loading: staffLoading, logout } = useStaff();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"columns" | "grid">("columns");
  const { toasts, addToast, removeToast } = useToasts();
  const { initialize, checkForNewOrders } = useNotifications(addToast);
  const initializedRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/${params.slug}/orders`);
      if (res.ok) {
        const data = await res.json();
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
  }, [params.slug, initialize, checkForNewOrders]);

  useEffect(() => {
    if (!staff) return;
    fetchOrders();
  }, [fetchOrders, staff]);

  useRealtime({ table: "orders", onUpdate: fetchOrders });

  async function updateOrderStatus(orderId: string, status: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: status as OrderWithItems["status"] } : o
      )
    );
    try {
      await fetch(`/api/${params.slug}/orders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status }),
      });
    } catch {}
  }

  const pending = orders.filter((o) => o.status === "pending");
  const inKitchen = orders.filter((o) => o.status === "in_kitchen");
  const ready = orders.filter((o) => o.status === "ready");
  const totalActive = pending.length + inKitchen.length + ready.length;

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

  const columns = [
    {
      title: "Pendiente",
      count: pending.length,
      color: "text-amber-400",
      borderColor: "border-amber-500/30",
      bgDot: "bg-amber-400",
      orders: pending,
      actionLabel: "Preparar",
      actionColor: "bg-orange-600 hover:bg-orange-700",
      onAction: (id: string) => updateOrderStatus(id, "in_kitchen"),
    },
    {
      title: "En preparación",
      count: inKitchen.length,
      color: "text-orange-400",
      borderColor: "border-orange-500/30",
      bgDot: "bg-orange-400",
      orders: inKitchen,
      actionLabel: "Listo para servir",
      actionColor: "bg-green-600 hover:bg-green-700",
      onAction: (id: string) => updateOrderStatus(id, "ready"),
    },
    {
      title: "Listo",
      count: ready.length,
      color: "text-green-400",
      borderColor: "border-green-500/30",
      bgDot: "bg-green-400",
      orders: ready,
      actionLabel: "Entregado",
      actionColor: "bg-blue-600 hover:bg-blue-700",
      onAction: (id: string) => updateOrderStatus(id, "delivered"),
    },
  ];

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
        <div className="flex items-center gap-2">
          <StaffBadge onLogout={logout} />
          {/* View toggle */}
          <div className="flex rounded-lg bg-white/[0.06] p-0.5">
            <button
              onClick={() => setView("columns")}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${view === "columns" ? "bg-white/10 text-white" : "text-[#666] hover:text-[#999]"}`}
            >
              Columnas
            </button>
            <button
              onClick={() => setView("grid")}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${view === "grid" ? "bg-white/10 text-white" : "text-[#666] hover:text-[#999]"}`}
            >
              Grilla
            </button>
          </div>
          <span className="badge bg-white/[0.06] text-[#999]">
            {totalActive} pedido{totalActive !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {totalActive === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] text-slate-600">
          <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-emerald-500">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-slate-400">Sin pedidos pendientes</p>
          <p className="mt-1 text-sm text-slate-600">Los nuevos pedidos aparecen automáticamente</p>
        </div>
      ) : view === "columns" ? (
        /* Column KDS layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-0 h-[calc(100vh-64px)]">
          {columns.map((col) => (
            <div key={col.title} className={`flex flex-col border-b lg:border-b-0 lg:border-r border-[#1a1a1a] last:border-0`}>
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#111]">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.bgDot}`} />
                  <span className={`text-sm font-bold ${col.color}`}>{col.title}</span>
                </div>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-bold text-[#666] tabular-nums">
                  {col.count}
                </span>
              </div>

              {/* Column body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {col.orders.length === 0 ? (
                  <p className="text-center text-xs text-[#333] py-8">Sin pedidos</p>
                ) : (
                  col.orders.map((order) => (
                    <KDSCard
                      key={order.id}
                      order={order}
                      onAction={() => col.onAction(order.id)}
                      actionLabel={col.actionLabel}
                      actionColor={col.actionColor}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Grid layout (original) */
        <div className="p-4 lg:p-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:max-w-7xl lg:mx-auto">
          {[...pending, ...inKitchen, ...ready].map((order) => {
            const isPending = order.status === "pending";
            const isInKitchen = order.status === "in_kitchen";
            return (
              <KDSCard
                key={order.id}
                order={order}
                onAction={() =>
                  isPending
                    ? updateOrderStatus(order.id, "in_kitchen")
                    : isInKitchen
                      ? updateOrderStatus(order.id, "ready")
                      : updateOrderStatus(order.id, "delivered")
                }
                actionLabel={isPending ? "Preparar" : isInKitchen ? "Listo para servir" : "Entregado"}
                actionColor={
                  isPending
                    ? "bg-orange-600 hover:bg-orange-700"
                    : isInKitchen
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                }
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
