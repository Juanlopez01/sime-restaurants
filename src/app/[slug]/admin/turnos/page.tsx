"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface Shift {
  id: string;
  cashier_id: string;
  cashier?: { id: string; name: string };
  opening_amount: number;
  closing_amount: number | null;
  total_sales: number | null;
  total_tips: number | null;
  total_orders: number | null;
  payments_by_method: Record<string, number> | null;
  difference: number | null;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  mp: "MercadoPago",
  transfer: "Transferencia",
};

export default function TurnosPage() {
  const params = useParams<{ slug: string }>();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState({ cashier_id: "", opening_amount: "0" });
  const [closeForm, setCloseForm] = useState({ closing_amount: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [closedShift, setClosedShift] = useState<Shift | null>(null);

  const fetchShifts = useCallback(async () => {
    try {
      const res = await fetch(`/api/${params.slug}/shifts`);
      if (res.ok) {
        const data = await res.json();
        setShifts(data.shifts ?? []);
      }
    } catch {}
    setLoading(false);
  }, [params.slug]);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch(`/api/${params.slug}/staff`);
      if (res.ok) {
        const data = await res.json();
        setStaff((data.users ?? []).filter((u: StaffMember) => u.role === "cashier" || u.role === "owner" || u.role === "admin"));
      }
    } catch {}
  }, [params.slug]);

  useEffect(() => {
    fetchShifts();
    fetchStaff();
  }, [fetchShifts, fetchStaff]);

  const handleOpenShift = async () => {
    if (!openForm.cashier_id) return;
    setSaving(true);
    const res = await fetch(`/api/${params.slug}/shifts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cashier_id: openForm.cashier_id,
        opening_amount: parseFloat(openForm.opening_amount) || 0,
      }),
    });
    if (res.ok) {
      setShowOpen(false);
      setOpenForm({ cashier_id: "", opening_amount: "0" });
      fetchShifts();
    }
    setSaving(false);
  };

  const handleCloseShift = async () => {
    if (!showClose) return;
    setSaving(true);
    const res = await fetch(`/api/${params.slug}/shifts`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: showClose,
        closing_amount: parseFloat(closeForm.closing_amount) || 0,
        notes: closeForm.notes,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setClosedShift(data.shift);
      setShowClose(null);
      setCloseForm({ closing_amount: "", notes: "" });
      fetchShifts();
    }
    setSaving(false);
  };

  const activeShifts = shifts.filter((s) => !s.closed_at);
  const pastShifts = shifts.filter((s) => s.closed_at);

  return (
    <div className="p-4 lg:p-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#777]">
          Abrí y cerrá turnos de caja con arqueo y reporte.
        </p>
        <button
          onClick={() => setShowOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[#141414] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a2a2a] transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Abrir turno
        </button>
      </div>

      {/* Active shifts */}
      {activeShifts.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#b49a5a] mb-3">Turnos activos</p>
          <div className="space-y-3">
            {activeShifts.map((shift) => {
              const elapsed = Math.floor((Date.now() - new Date(shift.opened_at).getTime()) / 3600000);
              return (
                <div key={shift.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-semibold text-emerald-900">
                        {shift.cashier?.name ?? "Cajero"}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-700">
                      {elapsed}h abierto · Inicio: ${Number(shift.opening_amount).toLocaleString("es-AR")}
                    </span>
                  </div>
                  <button
                    onClick={() => { setShowClose(shift.id); setCloseForm({ closing_amount: "", notes: "" }); }}
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 transition-colors"
                  >
                    Cerrar turno
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Closed shift report */}
      {closedShift && (
        <div className="rounded-xl border border-[#e8e6e1] bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#1a1a1a]">Cierre de caja — {closedShift.cashier?.name}</h3>
            <button onClick={() => setClosedShift(null)} className="text-xs text-[#999] hover:text-[#1a1a1a]">Cerrar</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg bg-[#f5f3ee] p-3">
              <span className="text-[10px] uppercase tracking-wider text-[#999]">Apertura</span>
              <p className="text-lg font-bold tabular-nums text-[#1a1a1a]">${Number(closedShift.opening_amount).toLocaleString("es-AR")}</p>
            </div>
            <div className="rounded-lg bg-[#f5f3ee] p-3">
              <span className="text-[10px] uppercase tracking-wider text-[#999]">Ventas</span>
              <p className="text-lg font-bold tabular-nums text-[#1a1a1a]">${Number(closedShift.total_sales ?? 0).toLocaleString("es-AR")}</p>
            </div>
            <div className="rounded-lg bg-[#f5f3ee] p-3">
              <span className="text-[10px] uppercase tracking-wider text-[#999]">Propinas</span>
              <p className="text-lg font-bold tabular-nums text-[#1a1a1a]">${Number(closedShift.total_tips ?? 0).toLocaleString("es-AR")}</p>
            </div>
            <div className={`rounded-lg p-3 ${(closedShift.difference ?? 0) >= 0 ? "bg-green-50" : "bg-red-50"}`}>
              <span className="text-[10px] uppercase tracking-wider text-[#999]">Diferencia</span>
              <p className={`text-lg font-bold tabular-nums ${(closedShift.difference ?? 0) >= 0 ? "text-green-700" : "text-red-600"}`}>
                {(closedShift.difference ?? 0) >= 0 ? "+" : ""}${Number(closedShift.difference ?? 0).toLocaleString("es-AR")}
              </p>
            </div>
          </div>

          {closedShift.payments_by_method && Object.keys(closedShift.payments_by_method).length > 0 && (
            <div className="border-t border-[#f0ede6] pt-3">
              <p className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-2">Por método</p>
              <div className="space-y-1">
                {Object.entries(closedShift.payments_by_method).map(([m, amt]) => (
                  <div key={m} className="flex justify-between text-sm">
                    <span className="text-[#777]">{METHOD_LABELS[m] ?? m}</span>
                    <span className="font-medium tabular-nums text-[#1a1a1a]">${Number(amt).toLocaleString("es-AR")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                const w = window.open("", "_blank", "width=400,height=500");
                if (!w) return;
                const s = closedShift;
                const methods = Object.entries(s.payments_by_method ?? {}).map(([m, a]) => `<tr><td>${METHOD_LABELS[m] ?? m}</td><td style="text-align:right">$${Number(a).toLocaleString("es-AR")}</td></tr>`).join("");
                w.document.write(`<!DOCTYPE html><html><head><title>Cierre de caja</title><style>body{font-family:monospace;font-size:12px;width:350px;margin:0 auto;padding:16px}h2{text-align:center}hr{border:none;border-top:1px dashed #999;margin:8px 0}table{width:100%;border-collapse:collapse}td{padding:3px 0}.b{font-weight:bold}@media print{body{width:auto}}</style></head><body><h2>Cierre de Caja</h2><p style="text-align:center;color:#666">${s.cashier?.name} · ${new Date(s.opened_at).toLocaleString("es-AR")} - ${new Date(s.closed_at!).toLocaleString("es-AR")}</p><hr><table><tr><td>Apertura</td><td style="text-align:right">$${Number(s.opening_amount).toLocaleString("es-AR")}</td></tr><tr><td>Ventas</td><td style="text-align:right">$${Number(s.total_sales ?? 0).toLocaleString("es-AR")}</td></tr><tr><td>Propinas</td><td style="text-align:right">$${Number(s.total_tips ?? 0).toLocaleString("es-AR")}</td></tr><tr><td>Cierre</td><td style="text-align:right">$${Number(s.closing_amount ?? 0).toLocaleString("es-AR")}</td></tr><tr class="b"><td>Diferencia</td><td style="text-align:right">${(s.difference ?? 0) >= 0 ? "+" : ""}$${Number(s.difference ?? 0).toLocaleString("es-AR")}</td></tr></table><hr><table>${methods}</table>${s.notes ? `<p style="margin-top:8px;color:#666">Nota: ${s.notes}</p>` : ""}<script>window.print();</script></body></html>`);
                w.document.close();
              }}
              className="rounded-lg border border-[#e8e6e1] px-4 py-2 text-sm font-medium text-[#777] hover:bg-[#f5f3ee] transition-colors"
            >
              Imprimir
            </button>
          </div>
        </div>
      )}

      {/* Past shifts */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e8e6e1] border-t-[#b49a5a]" />
        </div>
      ) : pastShifts.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#999] mb-3">Historial</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8e6e1]">
                  <th className="text-left py-3 text-xs font-semibold text-[#999] uppercase tracking-wider">Cajero</th>
                  <th className="text-left py-3 text-xs font-semibold text-[#999] uppercase tracking-wider hidden sm:table-cell">Apertura</th>
                  <th className="text-right py-3 text-xs font-semibold text-[#999] uppercase tracking-wider">Ventas</th>
                  <th className="text-right py-3 text-xs font-semibold text-[#999] uppercase tracking-wider hidden sm:table-cell">Propinas</th>
                  <th className="text-right py-3 text-xs font-semibold text-[#999] uppercase tracking-wider">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {pastShifts.map((s) => (
                  <tr key={s.id} className="border-b border-[#f0ede6]">
                    <td className="py-3">
                      <span className="font-medium text-[#1a1a1a]">{s.cashier?.name ?? "—"}</span>
                      <span className="block text-[10px] text-[#999]">
                        {new Date(s.opened_at).toLocaleDateString("es-AR")}
                      </span>
                    </td>
                    <td className="py-3 text-[#777] tabular-nums hidden sm:table-cell">
                      ${Number(s.opening_amount).toLocaleString("es-AR")}
                    </td>
                    <td className="py-3 text-right font-medium tabular-nums text-[#1a1a1a]">
                      ${Number(s.total_sales ?? 0).toLocaleString("es-AR")}
                    </td>
                    <td className="py-3 text-right tabular-nums text-[#777] hidden sm:table-cell">
                      ${Number(s.total_tips ?? 0).toLocaleString("es-AR")}
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${(s.difference ?? 0) >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {(s.difference ?? 0) >= 0 ? "+" : ""}${Number(s.difference ?? 0).toLocaleString("es-AR")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeShifts.length === 0 ? (
        <div className="rounded-xl border border-[#e8e6e1] bg-white text-center py-12 px-4">
          <p className="text-sm text-[#999]">No hay turnos registrados. Abrí un turno para comenzar.</p>
        </div>
      ) : null}

      {/* Open shift modal */}
      {showOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-4">Abrir turno</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#999] uppercase tracking-wider">Cajero</label>
                <select
                  value={openForm.cashier_id}
                  onChange={(e) => setOpenForm({ ...openForm, cashier_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm focus:border-[#b49a5a] focus:outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#999] uppercase tracking-wider">Monto de apertura</label>
                <input
                  type="number"
                  value={openForm.opening_amount}
                  onChange={(e) => setOpenForm({ ...openForm, opening_amount: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm focus:border-[#b49a5a] focus:outline-none tabular-nums"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => setShowOpen(false)} className="rounded-lg border border-[#e8e6e1] px-4 py-2 text-sm font-medium text-[#777] hover:bg-[#f5f3ee] transition-colors">Cancelar</button>
              <button onClick={handleOpenShift} disabled={saving || !openForm.cashier_id} className="rounded-lg bg-[#141414] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-50">
                {saving ? "Abriendo..." : "Abrir turno"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close shift modal */}
      {showClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-4">Cerrar turno</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#999] uppercase tracking-wider">Monto en caja</label>
                <input
                  type="number"
                  value={closeForm.closing_amount}
                  onChange={(e) => setCloseForm({ ...closeForm, closing_amount: e.target.value })}
                  placeholder="Contá el efectivo en caja"
                  className="mt-1 w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm focus:border-[#b49a5a] focus:outline-none tabular-nums"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#999] uppercase tracking-wider">Notas (opcional)</label>
                <textarea
                  value={closeForm.notes}
                  onChange={(e) => setCloseForm({ ...closeForm, notes: e.target.value })}
                  placeholder="Observaciones del turno..."
                  className="mt-1 w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm focus:border-[#b49a5a] focus:outline-none resize-none"
                  rows={2}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => setShowClose(null)} className="rounded-lg border border-[#e8e6e1] px-4 py-2 text-sm font-medium text-[#777] hover:bg-[#f5f3ee] transition-colors">Cancelar</button>
              <button onClick={handleCloseShift} disabled={saving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                {saving ? "Cerrando..." : "Cerrar turno"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
