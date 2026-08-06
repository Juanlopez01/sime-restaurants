"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import type { OrderWithItems, OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "delivered", label: "Entregados" },
  { value: "cancelled", label: "Cancelados" },
  { value: "pending", label: "Pendientes" },
  { value: "in_kitchen", label: "En cocina" },
  { value: "ready", label: "Listos" },
];

const STATUS_DOT: Record<string, string> = {
  pending: "bg-yellow-500",
  in_kitchen: "bg-orange-500",
  ready: "bg-emerald-500",
  delivered: "bg-[#b49a5a]",
  cancelled: "bg-red-500",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistorialPage() {
  const params = useParams<{ slug: string }>();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ all: "true" });
      if (statusFilter !== "all") qs.set("status", statusFilter);
      if (dateFilter) qs.set("date", dateFilter);

      const res = await fetch(`/api/${params.slug}/orders?${qs}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } catch {}
    setLoading(false);
  }, [params.slug, statusFilter, dateFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalSales = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.subtotal, 0);

  return (
    <main className="p-5 lg:p-0 max-w-3xl mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-ink tracking-tight">
          Historial de Pedidos
        </h2>
        <p className="text-sm text-ink-muted mt-0.5">
          {orders.length} pedido{orders.length !== 1 ? "s" : ""}
          {totalSales > 0 && (
            <span className="ml-2 text-[#b49a5a] font-medium">
              · ${totalSales.toLocaleString("es-AR")}
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="input w-auto"
        />
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`flex-shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-[#141414] text-white"
                  : "bg-white border border-[#e8e6e1] text-[#999] hover:bg-[#f5f3ee]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e8e6e1] border-t-[#b49a5a]" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-ink-muted">No hay pedidos para esta fecha</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              <button
                onClick={() =>
                  setExpandedId(expandedId === order.id ? null : order.id)
                }
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#f5f3ee]/50 transition-colors"
              >
                <span
                  className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    STATUS_DOT[order.status] ?? "bg-gray-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">
                      #{order.order_number}
                    </span>
                    <span className="text-xs text-ink-faint">
                      Mesa {order.table?.table_number ?? "?"}
                    </span>
                    <span className="text-xs text-ink-faint">
                      {formatTime(order.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-ink-muted">
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    {order.waiter && (
                      <span className="text-xs text-ink-faint">
                        · {order.waiter.name}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-ink tabular-nums">
                  ${order.subtotal.toLocaleString("es-AR")}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 text-[#ccc] transition-transform ${
                    expandedId === order.id ? "rotate-180" : ""
                  }`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {expandedId === order.id && (
                <div className="border-t border-[#e8e6e1] px-5 py-4 bg-[#f5f3ee]/30">
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-ink-muted">
                          {item.quantity}x {item.product_name}
                          {item.notes && (
                            <span className="ml-1.5 text-xs text-[#b49a5a] italic">
                              {item.notes}
                            </span>
                          )}
                        </span>
                        <span className="text-ink tabular-nums font-medium">
                          $
                          {(item.unit_price * item.quantity).toLocaleString(
                            "es-AR"
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  {order.notes && (
                    <p className="mt-3 text-xs text-ink-faint italic border-t border-[#e8e6e1] pt-3">
                      Nota: {order.notes}
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-[#e8e6e1] flex items-center justify-between">
                    <span className="text-xs text-ink-faint">
                      {new Date(order.created_at).toLocaleString("es-AR")}
                    </span>
                    <button
                      onClick={() => printTicket(order)}
                      className="flex items-center gap-1.5 rounded-lg bg-[#141414] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#222] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <path d="M6 9V2h12v7" />
                        <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                        <rect x="6" y="14" width="12" height="8" />
                      </svg>
                      Imprimir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function printTicket(order: OrderWithItems) {
  const w = window.open("", "_blank", "width=320,height=600");
  if (!w) return;

  const items = order.items
    .map(
      (i) =>
        `<tr><td>${i.quantity}x ${i.product_name}</td><td style="text-align:right">$${(i.unit_price * i.quantity).toLocaleString("es-AR")}</td></tr>`
    )
    .join("");

  w.document.write(`<!DOCTYPE html>
<html><head><title>Ticket #${order.order_number}</title>
<style>
  body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 16px; }
  h2 { text-align: center; margin: 0 0 4px; font-size: 14px; }
  .meta { text-align: center; color: #666; font-size: 11px; margin-bottom: 12px; }
  hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 3px 0; }
  .total { font-weight: bold; font-size: 14px; }
  .footer { text-align: center; color: #999; font-size: 10px; margin-top: 16px; }
  @media print { body { width: auto; } }
</style></head><body>
<h2>Pedido #${order.order_number}</h2>
<p class="meta">Mesa ${order.table?.table_number ?? "?"} · ${new Date(order.created_at).toLocaleString("es-AR")}</p>
<hr>
<table>${items}</table>
<hr>
<table><tr class="total"><td>TOTAL</td><td style="text-align:right">$${order.subtotal.toLocaleString("es-AR")}</td></tr></table>
${order.notes ? `<hr><p style="font-size:11px;color:#666">Nota: ${order.notes}</p>` : ""}
<p class="footer">Gracias por su visita</p>
<script>window.print();</script>
</body></html>`);
  w.document.close();
}
