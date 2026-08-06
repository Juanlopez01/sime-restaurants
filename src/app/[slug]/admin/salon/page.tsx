"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Table } from "@/types";
import { FloorEditor } from "@/components/salon/FloorEditor";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
}

export default function SalonEditorPage() {
  const params = useParams<{ slug: string }>();
  const [tables, setTables] = useState<Table[]>([]);
  const [waiters, setWaiters] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/${params.slug}/tables`).then((r) => r.json()),
      fetch(`/api/${params.slug}/staff`).then((r) => r.json()).catch(() => ({ staff: [] })),
    ]).then(([tablesData, staffData]) => {
      setTables(tablesData.tables);
      setWaiters(
        (staffData.staff ?? []).filter(
          (u: StaffMember) => u.role === "waiter" && u.is_active
        )
      );
      setLoading(false);
    });
  }, [params.slug]);

  async function assignWaiter(tableId: string, waiterId: string | null) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId ? { ...t, assigned_waiter_id: waiterId } : t
      )
    );
    try {
      await fetch(`/api/${params.slug}/tables/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_id: tableId, waiter_id: waiterId }),
      });
    } catch { /* offline */ }
  }

  if (loading) {
    return (
      <main className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      </main>
    );
  }

  return (
    <main className="p-5 lg:p-0 max-w-2xl lg:max-w-4xl mx-auto">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink tracking-tight">Editor de Salón</h2>
          <p className="text-sm text-ink-muted mt-0.5">{tables.length} mesas configuradas</p>
        </div>
        <button
          onClick={() => setShowAssign(!showAssign)}
          className={`btn text-sm px-4 py-2.5 rounded-xl transition-all ${
            showAssign
              ? "bg-[#141414] text-white"
              : "bg-white border border-[#e8e6e1] text-[#999] hover:bg-[#f5f3ee]"
          }`}
        >
          {showAssign ? "Volver a edición" : "Asignar mozos"}
        </button>
      </div>

      {showAssign ? (
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">
            Asigná cada mesa a un mozo. Las mesas sin asignar las puede tomar cualquier mozo.
          </p>
          {waiters.length === 0 && (
            <p className="text-sm text-[#b49a5a]">
              No hay mozos cargados. Agregá empleados en Admin → Staff.
            </p>
          )}
          <div className="space-y-2">
            {tables.map((table) => (
              <div key={table.id} className="card flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#141414] text-white font-bold text-sm">
                    {table.table_number}
                  </span>
                  <span className="text-sm text-ink-muted">
                    {table.capacity}p · {table.shape}
                  </span>
                </div>
                <select
                  value={table.assigned_waiter_id ?? ""}
                  onChange={(e) => assignWaiter(table.id, e.target.value || null)}
                  className="input w-auto py-2"
                >
                  <option value="">Sin asignar</option>
                  {waiters.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <FloorEditor tables={tables} slug={params.slug} onTablesChange={setTables} />
      )}
    </main>
  );
}
