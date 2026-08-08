"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { OrderWithItems } from "@/types";
import { KitchenCard } from "@/components/cocina/KitchenCard";
import { useStaff } from "@/contexts/staff-context";
import { PinLogin, StaffBadge } from "@/components/staff/PinLogin";
import { useRealtime } from "@/hooks/use-realtime";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationToasts, useToasts } from "@/components/ui/NotificationToasts";

export default function CocinaPage() {
  const params = useParams<{ slug: string }>();
  const { staff, loading: staffLoading, logout } = useStaff();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch {
      // offline
    }
  }

  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "in_kitchen" || o.status === "ready"
  );

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
          <span className="badge bg-white/[0.06] text-[#999]">
            {activeOrders.length} pedido{activeOrders.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] text-slate-600">
          <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-emerald-500">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-slate-400">Sin pedidos pendientes</p>
          <p className="mt-1 text-sm text-slate-600">Los nuevos pedidos aparecen automáticamente</p>
        </div>
      ) : (
        <div className="p-4 lg:p-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:max-w-7xl lg:mx-auto">
          {activeOrders.map((order) => (
            <KitchenCard
              key={order.id}
              order={order}
              onMarkPreparing={(id) => updateOrderStatus(id, "in_kitchen")}
              onMarkReady={(id) => updateOrderStatus(id, "ready")}
            />
          ))}
        </div>
      )}
    </main>
  );
}
