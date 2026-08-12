"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { formatPrice } from "@/lib/format";

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface TableRanking {
  table_number: string;
  total_orders: number;
  total_spent: number;
  last_visit: string;
}

interface Analytics {
  period_days: number;
  total_orders: number;
  top_products: TopProduct[];
  table_ranking: TableRanking[];
  orders_by_hour: number[];
  orders_by_day: Record<string, number>;
}

export default function ClientesPage() {
  const params = useParams<{ slug: string }>();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${params.slug}/analytics?days=${days}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {}
    setLoading(false);
  }, [params.slug, days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxHour = data ? Math.max(...data.orders_by_hour, 1) : 1;

  return (
    <div className="p-4 lg:p-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#777]">
          Productos más pedidos, mesas más activas y patrones de consumo.
        </p>
        <div className="flex gap-1 rounded-lg bg-[#f0ede6] p-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                days === d ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#777] hover:text-[#1a1a1a]"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e8e6e1] border-t-[#b49a5a]" />
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-[#e8e6e1] bg-white text-center py-12 px-4">
          <p className="text-sm text-[#999]">No se pudieron cargar los datos.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="rounded-xl border border-[#e8e6e1] bg-white p-5">
            <span className="text-2xl font-bold text-[#1a1a1a] tabular-nums">{data.total_orders}</span>
            <span className="ml-2 text-sm text-[#999]">pedidos en los últimos {data.period_days} días</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top products */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#b49a5a] mb-3">
                Productos más pedidos
              </p>
              <div className="rounded-xl border border-[#e8e6e1] bg-white divide-y divide-[#f0ede6]">
                {data.top_products.length === 0 ? (
                  <p className="p-4 text-center text-sm text-[#999]">Sin datos</p>
                ) : (
                  data.top_products.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-xs font-bold text-[#ccc] w-5 text-right tabular-nums">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-[#1a1a1a] block truncate">{p.name}</span>
                        <span className="text-xs text-[#999]">{formatPrice(p.revenue)} facturado</span>
                      </div>
                      <span className="rounded-full bg-[#f5f3ee] px-2.5 py-1 text-xs font-bold tabular-nums text-[#1a1a1a]">
                        {p.quantity}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Table ranking */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#b49a5a] mb-3">
                Mesas más activas
              </p>
              <div className="rounded-xl border border-[#e8e6e1] bg-white divide-y divide-[#f0ede6]">
                {data.table_ranking.length === 0 ? (
                  <p className="p-4 text-center text-sm text-[#999]">Sin datos</p>
                ) : (
                  data.table_ranking.map((t) => (
                    <div key={t.table_number} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="text-sm font-semibold text-[#1a1a1a]">Mesa {t.table_number}</span>
                        <span className="ml-2 text-xs text-[#999]">{t.total_orders} pedidos</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold tabular-nums text-[#1a1a1a]">
                          {formatPrice(t.total_spent)}
                        </span>
                        <span className="block text-[10px] text-[#999]">
                          Última: {new Date(t.last_visit).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Orders by hour */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#b49a5a] mb-3">
              Pedidos por hora
            </p>
            <div className="rounded-xl border border-[#e8e6e1] bg-white p-4">
              <div className="flex items-end gap-1 h-32">
                {data.orders_by_hour.map((count, hour) => (
                  <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-[#b49a5a]/20 hover:bg-[#b49a5a]/40 transition-colors"
                      style={{ height: `${(count / maxHour) * 100}%`, minHeight: count > 0 ? "4px" : "0" }}
                      title={`${hour}:00 — ${count} pedidos`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-1">
                {data.orders_by_hour.map((_, hour) => (
                  <div key={hour} className="flex-1 text-center">
                    {hour % 4 === 0 && (
                      <span className="text-[9px] text-[#999] tabular-nums">{hour}h</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Orders by day of week */}
          {Object.keys(data.orders_by_day).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#b49a5a] mb-3">
                Pedidos por día de la semana
              </p>
              <div className="rounded-xl border border-[#e8e6e1] bg-white divide-y divide-[#f0ede6]">
                {Object.entries(data.orders_by_day)
                  .sort(([, a], [, b]) => b - a)
                  .map(([day, count]) => {
                    const maxDay = Math.max(...Object.values(data.orders_by_day), 1);
                    return (
                      <div key={day} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-sm font-medium text-[#1a1a1a] w-24 capitalize">{day}</span>
                        <div className="flex-1 h-3 bg-[#f5f3ee] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#b49a5a] rounded-full"
                            style={{ width: `${(count / maxDay) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold tabular-nums text-[#777] w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
