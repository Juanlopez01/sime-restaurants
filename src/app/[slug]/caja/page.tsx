"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { TableWithStatus } from "@/types";
import { FloorMap } from "@/components/salon/FloorMap";
import { CancelRequestBanner } from "@/components/caja/CancelRequestBanner";
import { useStaff } from "@/contexts/staff-context";
import { PinLogin, StaffBadge } from "@/components/staff/PinLogin";
import { useRealtime } from "@/hooks/use-realtime";

export default function CajaPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { staff, loading: staffLoading, logout } = useStaff();
  const [tables, setTables] = useState<TableWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!staff) return;
    fetchTables();
  }, [fetchTables, staff]);

  useRealtime({ table: "orders", onUpdate: fetchTables });

  function handleTableClick(table: TableWithStatus) {
    router.push(`/${params.slug}/caja/mesa/${table.id}`);
  }

  if (staffLoading) return null;
  if (!staff) return <PinLogin module="Caja" />;

  const tablesWithOrders = tables.filter(
    (t) => t.current_order || t.has_open_bill
  ).length;

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
      <header className="module-header">
        <div className="flex items-center gap-3">
          <Link href={`/${params.slug}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-[#888] hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1>Caja</h1>
        </div>
        <div className="flex items-center gap-2">
          <StaffBadge onLogout={logout} />
          {tablesWithOrders > 0 && (
            <span className="badge bg-white/[0.06] text-[#999]">
              {tablesWithOrders} activa{tablesWithOrders !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </header>

      <CancelRequestBanner cashierId={staff.id} />

      <div className="p-4 lg:p-8">
        <div className="lg:max-w-5xl lg:mx-auto">
          <div className="table-legend mb-4">
            <span><span className="legend-dot bg-mesa-free" /> Libre</span>
            <span><span className="legend-dot bg-mesa-order" /> Con pedido</span>
            <span><span className="legend-dot bg-mesa-bill" /> Cuenta</span>
          </div>

          <FloorMap tables={tables} onTableClick={handleTableClick} />
        </div>
      </div>
    </main>
  );
}
