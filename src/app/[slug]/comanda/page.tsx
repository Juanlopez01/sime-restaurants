"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { TableWithStatus, OrderWithItems } from "@/types";
import { FloorMap } from "@/components/salon/FloorMap";
import { useStaff } from "@/contexts/staff-context";
import { PinLogin, StaffBadge } from "@/components/staff/PinLogin";
import { useRealtime } from "@/hooks/use-realtime";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationToasts, useToasts } from "@/components/ui/NotificationToasts";

export default function ComandaPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { staff, loading: staffLoading, logout } = useStaff();
  const [tables, setTables] = useState<TableWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const { toasts, addToast, removeToast } = useToasts();
  const { checkForReadyOrders } = useNotifications(addToast);
  const prevOrdersRef = useRef<{ id: string; status: string }[]>([]);

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch(`/api/${params.slug}/tables/status`);
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables);
      }
    } catch {
      // offline
    }
    setLoading(false);
  }, [params.slug]);

  const fetchOrdersForNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/${params.slug}/orders`);
      if (res.ok) {
        const data = await res.json();
        const orders = data.orders as OrderWithItems[];

        if (prevOrdersRef.current.length > 0) {
          checkForReadyOrders(orders, prevOrdersRef.current);
        }

        prevOrdersRef.current = orders.map((o) => ({ id: o.id, status: o.status }));
      }
    } catch {}
  }, [params.slug, checkForReadyOrders]);

  const handleUpdate = useCallback(() => {
    fetchTables();
    fetchOrdersForNotifications();
  }, [fetchTables, fetchOrdersForNotifications]);

  useEffect(() => {
    if (!staff) return;
    fetchTables();
    fetchOrdersForNotifications();
  }, [fetchTables, fetchOrdersForNotifications, staff]);

  useRealtime({ table: "orders", onUpdate: handleUpdate });

  function handleTableClick(table: TableWithStatus) {
    router.push(`/${params.slug}/comanda/mesa/${table.id}`);
  }

  if (staffLoading) return null;
  if (!staff) return <PinLogin module="Comanda" />;

  const myTables = tables.filter(
    (t) => t.assigned_waiter_id === staff.id
  );
  const hasAssignedTables = myTables.length > 0;
  const displayTables = hasAssignedTables && !showAll ? myTables : tables;

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#e8e6e1] border-t-[#b49a5a]" />
          <p className="mt-3 text-sm text-ink-faint">Cargando mesas...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <NotificationToasts toasts={toasts} onDismiss={removeToast} />

      <header className="module-header">
        <div className="flex items-center gap-3">
          <Link href={`/${params.slug}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-[#888] hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1>Comanda</h1>
        </div>
        <div className="flex items-center gap-2">
          <StaffBadge onLogout={logout} />
          {hasAssignedTables && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-[#888] hover:text-white transition-colors"
            >
              {showAll ? "Mis mesas" : "Ver todas"}
            </button>
          )}
          <span className="badge bg-white/[0.06] text-[#999]">
            {displayTables.length} mesas
          </span>
        </div>
      </header>

      <div className="p-4 lg:p-8">
        <div className="lg:max-w-5xl lg:mx-auto">
          <div className="table-legend mb-4">
            <span><span className="legend-dot bg-mesa-free" /> Libre</span>
            <span><span className="legend-dot bg-mesa-order" /> Con pedido</span>
            <span><span className="legend-dot bg-mesa-bill" /> Cuenta</span>
          </div>

          <FloorMap tables={displayTables} onTableClick={handleTableClick} />
        </div>
      </div>
    </main>
  );
}
