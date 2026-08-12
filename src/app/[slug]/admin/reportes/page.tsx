"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { formatPrice } from "@/lib/format";

interface ReportData {
  totals: {
    sales: number;
    orders: number;
    avg_ticket: number;
    delivered: number;
  };
  daily_sales: { date: string; sales: number; orders: number }[];
  payments_by_method: { method: string; amount: number }[];
  top_products: { name: string; quantity: number; revenue: number }[];
  hourly_distribution: { hour: number; orders: number }[];
  waiter_stats: { name: string; orders: number; sales: number }[];
}

type Preset = "today" | "week" | "month" | "last_month";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "Hoy" },
  { key: "week", label: "Esta semana" },
  { key: "month", label: "Este mes" },
  { key: "last_month", label: "Mes anterior" },
];

const METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  mp: "Mercado Pago",
  transfer: "Transferencia",
  split: "Dividido",
};

const METHOD_COLORS = ["#b49a5a", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

function getDateRange(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "today":
      return { from: fmt(now), to: fmt(now) };
    case "week": {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return { from: fmt(start), to: fmt(now) };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: fmt(start), to: fmt(now) };
    }
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmt(start), to: fmt(end) };
    }
  }
}

function formatCurrency(n: number): string {
  return formatPrice(Math.round(n));
}

function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

export default function ReportesPage() {
  const params = useParams<{ slug: string }>();
  const [preset, setPreset] = useState<Preset>("week");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const { from, to } = getDateRange(preset);
    try {
      const res = await fetch(
        `/api/${params.slug}/reports?from=${from}&to=${to}`
      );
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch {}
    setLoading(false);
  }, [params.slug, preset]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="p-4 lg:p-0 space-y-6">
      {/* Date presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              preset === p.key
                ? "bg-[#141414] text-white"
                : "bg-white text-[#777] border border-[#e8e6e1] hover:bg-[#f5f3ee] hover:text-[#1a1a1a]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e8e6e1] border-t-[#b49a5a]" />
        </div>
      ) : report ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Ventas totales" value={formatCurrency(report.totals.sales)} />
            <StatCard label="Pedidos" value={report.totals.orders.toString()} />
            <StatCard label="Ticket promedio" value={formatCurrency(report.totals.avg_ticket)} />
            <StatCard label="Entregados" value={report.totals.delivered.toString()} />
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Daily sales chart */}
            {report.daily_sales.length > 1 && (
              <div className="card card-body">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">
                  Ventas por día
                </h3>
                <BarChart data={report.daily_sales} />
              </div>
            )}

            {/* Payments by method */}
            {report.payments_by_method.length > 0 && (
              <div className="card card-body">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">
                  Métodos de pago
                </h3>
                <DonutChart data={report.payments_by_method} />
              </div>
            )}
          </div>

          {/* Hourly distribution */}
          {report.hourly_distribution.some((h) => h.orders > 0) && (
            <div className="card card-body">
              <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">
                Distribución horaria
              </h3>
              <HourlyChart data={report.hourly_distribution} />
            </div>
          )}

          {/* Bottom row */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Top products */}
            {report.top_products.length > 0 && (
              <div className="card card-body">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">
                  Productos más vendidos
                </h3>
                <div className="space-y-3">
                  {report.top_products.map((product, i) => {
                    const maxQty = report.top_products[0].quantity;
                    return (
                      <div key={product.name} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#999] w-5 text-right tabular-nums">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[#1a1a1a] truncate">
                              {product.name}
                            </span>
                            <span className="text-xs text-[#999] tabular-nums ml-2 shrink-0">
                              {product.quantity} uds · {formatCurrency(product.revenue)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#f0ede6] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#b49a5a] transition-all"
                              style={{ width: `${(product.quantity / maxQty) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Waiter stats */}
            {report.waiter_stats.length > 0 && (
              <div className="card card-body">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">
                  Rendimiento por mozo
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#e8e6e1]">
                        <th className="text-left py-2 font-semibold text-[#999] text-xs uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="text-right py-2 font-semibold text-[#999] text-xs uppercase tracking-wider">
                          Pedidos
                        </th>
                        <th className="text-right py-2 font-semibold text-[#999] text-xs uppercase tracking-wider">
                          Ventas
                        </th>
                        <th className="text-right py-2 font-semibold text-[#999] text-xs uppercase tracking-wider">
                          Promedio
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.waiter_stats.map((w) => (
                        <tr key={w.name} className="border-b border-[#f0ede6]">
                          <td className="py-2.5 font-medium text-[#1a1a1a]">
                            {w.name}
                          </td>
                          <td className="py-2.5 text-right tabular-nums text-[#777]">
                            {w.orders}
                          </td>
                          <td className="py-2.5 text-right tabular-nums text-[#1a1a1a] font-medium">
                            {formatCurrency(w.sales)}
                          </td>
                          <td className="py-2.5 text-right tabular-nums text-[#777]">
                            {w.orders > 0
                              ? formatCurrency(w.sales / w.orders)
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-[#999]">
          No se pudieron cargar los reportes
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

function BarChart({
  data,
}: {
  data: { date: string; sales: number; orders: number }[];
}) {
  const maxSales = Math.max(...data.map((d) => d.sales), 1);
  const chartH = 180;
  const barW = Math.min(32, Math.floor(500 / data.length) - 4);
  const chartW = data.length * (barW + 4);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartW + 20} ${chartH + 30}`}
        className="w-full"
        style={{ minWidth: Math.max(chartW + 20, 300) }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1="0"
            y1={chartH - pct * chartH}
            x2={chartW + 20}
            y2={chartH - pct * chartH}
            stroke="#f0ede6"
            strokeWidth="1"
          />
        ))}
        {/* Bars */}
        {data.map((d, i) => {
          const h = (d.sales / maxSales) * (chartH - 10);
          const x = i * (barW + 4) + 10;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={chartH - h}
                width={barW}
                height={h}
                rx="3"
                fill="#b49a5a"
                opacity="0.85"
              />
              <text
                x={x + barW / 2}
                y={chartH + 15}
                textAnchor="middle"
                className="text-[9px] fill-[#999]"
              >
                {formatShortDate(d.date)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({
  data,
}: {
  data: { method: string; amount: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  if (total === 0) return null;

  const r = 60;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
        {data.map((d, i) => {
          const pct = d.amount / total;
          const dashLen = pct * circumference;
          const dashOffset = -offset * circumference;
          offset += pct;
          return (
            <circle
              key={d.method}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={METHOD_COLORS[i % METHOD_COLORS.length]}
              strokeWidth="20"
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="text-lg font-bold fill-[#1a1a1a]"
        >
          {formatCurrency(total)}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          className="text-[10px] fill-[#999]"
        >
          total
        </text>
      </svg>

      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={d.method} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: METHOD_COLORS[i % METHOD_COLORS.length] }}
            />
            <span className="text-sm text-[#777]">
              {METHOD_LABELS[d.method] ?? d.method}
            </span>
            <span className="text-sm font-medium text-[#1a1a1a] tabular-nums ml-auto">
              {formatCurrency(d.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HourlyChart({
  data,
}: {
  data: { hour: number; orders: number }[];
}) {
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);
  const chartH = 100;
  const barW = 16;
  const gap = 2;
  const chartW = 24 * (barW + gap);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartW + 10} ${chartH + 25}`}
        className="w-full"
        style={{ minWidth: Math.max(chartW + 10, 400) }}
      >
        {data.map((d, i) => {
          const h = maxOrders > 0 ? (d.orders / maxOrders) * (chartH - 5) : 0;
          const x = i * (barW + gap) + 5;
          return (
            <g key={d.hour}>
              <rect
                x={x}
                y={chartH - h}
                width={barW}
                height={h}
                rx="2"
                fill={d.orders > 0 ? "#b49a5a" : "#f0ede6"}
                opacity={d.orders > 0 ? 0.75 : 0.5}
              />
              {d.hour % 2 === 0 && (
                <text
                  x={x + barW / 2}
                  y={chartH + 14}
                  textAnchor="middle"
                  className="text-[8px] fill-[#999]"
                >
                  {d.hour.toString().padStart(2, "0")}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
