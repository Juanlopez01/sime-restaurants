"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState, useCallback } from "react";
import { formatPrice } from "@/lib/format";

const MODULES = [
  {
    href: "comanda",
    num: "01",
    label: "Comanda",
    desc: "Tomar pedidos en mesa",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "cocina",
    num: "02",
    label: "Cocina",
    desc: "Pantalla de preparación",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 12c-3 0-5.5 1.5-7 3h14c-1.5-1.5-4-3-7-3z" />
        <path d="M5 15v2a2 2 0 002 2h10a2 2 0 002-2v-2" />
        <path d="M8 12V8m4-5v9m4-4v4" />
      </svg>
    ),
  },
  {
    href: "caja",
    num: "03",
    label: "Caja",
    desc: "Cobrar y cerrar mesas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <circle cx="12" cy="15" r="2" />
      </svg>
    ),
  },
  {
    href: "menu",
    num: "04",
    label: "Menú QR",
    desc: "Carta pública digital",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="3" height="3" />
        <path d="M21 14h-3v3" />
        <path d="M14 21h3v-3" />
      </svg>
    ),
  },
  {
    href: "admin",
    num: "05",
    label: "Admin",
    desc: "Configurar tu local",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

const QUICK_LINKS = [
  {
    href: "admin/salon",
    label: "Editor de salón",
    desc: "Configurar mesas y layout",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    href: "admin/facturacion",
    label: "Facturación ARCA",
    desc: "Resumen del día y facturación",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M9 15h6M9 11h6" />
      </svg>
    ),
  },
  {
    href: "admin/productos",
    label: "Gestión de carta",
    desc: "Productos y categorías",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <path d="M3 6h18M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
];

function useCurrentTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    function update() {
      setTime(
        new Date().toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);
  return time;
}

interface DashboardStats {
  occupiedTables: number;
  totalSales: number;
  activeOrders: number;
  avgTicket: number;
}

interface LowStockItem {
  name: string;
  current_stock: number;
  min_stock: number;
  unit: string;
}

interface RecentOrder {
  id: string;
  order_number: number;
  status: string;
  created_at: string;
  table?: { table_number: string };
  waiter?: { name: string };
  subtotal: number;
}

export default function RestaurantHome() {
  const params = useParams<{ slug: string }>();
  const { user, logout } = useAuth();
  const displayName = user?.restaurantName || "Mi Restaurante";
  const firstName = user?.name?.split(" ")[0] || "Juan";
  const time = useCurrentTime();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  const fetchExtras = useCallback(async () => {
    try {
      const [ingRes, ordRes] = await Promise.all([
        fetch(`/api/${params.slug}/ingredients`),
        fetch(`/api/${params.slug}/orders?all=true`),
      ]);
      if (ingRes.ok) {
        const data = await ingRes.json();
        const items = (data.ingredients ?? []).filter(
          (i: LowStockItem) => i.current_stock <= i.min_stock && i.min_stock > 0
        );
        setLowStock(items);
      }
      if (ordRes.ok) {
        const data = await ordRes.json();
        setRecentOrders((data.orders ?? []).slice(0, 5));
      }
    } catch {}
  }, [params.slug]);

  const fetchStats = useCallback(async () => {
    try {
      const [summaryRes, tablesRes] = await Promise.all([
        fetch(`/api/${params.slug}/daily-summary`),
        fetch(`/api/${params.slug}/tables/status`),
      ]);

      const summary = summaryRes.ok ? await summaryRes.json() : null;
      const tables = tablesRes.ok ? await tablesRes.json() : null;

      const occupied = (tables?.tables ?? []).filter(
        (t: { current_order?: unknown; has_open_bill?: boolean }) =>
          t.current_order || t.has_open_bill
      ).length;

      const s = summary?.summary;
      const totalOrders = s?.total_orders ?? 0;
      const grandTotal = s?.grand_total ?? 0;

      setStats({
        occupiedTables: occupied,
        totalSales: grandTotal,
        activeOrders: s?.total_active ?? 0,
        avgTicket: totalOrders > 0 ? Math.round(grandTotal / totalOrders) : 0,
      });
    } catch {}
  }, [params.slug]);

  useEffect(() => {
    fetchStats();
    fetchExtras();
    const interval = setInterval(() => { fetchStats(); fetchExtras(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchExtras]);

  const dateStr = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="min-h-screen bg-[#fafaf8] lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 bg-[#141414]">
        <div className="flex flex-col flex-1 px-5 pt-7 pb-5">
          <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#b49a5a]">
            Mise
          </span>

          <div className="mt-6 mb-8">
            <h1 className="font-display text-lg font-bold text-white tracking-tight">
              {displayName}
            </h1>
            <p className="text-[11px] text-[#555] mt-0.5">Panel de control</p>
          </div>

          <nav className="flex-1 space-y-0.5">
            {MODULES.map((mod) => (
              <Link
                key={mod.href}
                href={`/${params.slug}/${mod.href}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#888] hover:text-white hover:bg-white/[0.04] transition-colors group"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#333] text-[#777] group-hover:border-[#b49a5a]/50 group-hover:text-[#b49a5a] transition-colors">
                  {mod.icon}
                </span>
                <div>
                  <span className="text-sm font-medium block">{mod.label}</span>
                  <span className="text-[10px] text-[#444] group-hover:text-[#666]">
                    {mod.desc}
                  </span>
                </div>
              </Link>
            ))}
          </nav>

          {user && (
            <div className="border-t border-[#222] pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full border border-[#b49a5a]/40 flex items-center justify-center text-xs font-semibold text-[#b49a5a]">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#ccc]">{user.name}</p>
                    <p className="text-[10px] text-[#555] truncate max-w-[130px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="rounded-lg p-2 text-[#555] hover:text-[#999] transition-colors"
                  title="Cerrar sesión"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[260px] flex-1">
        {/* Mobile header */}
        <header className="lg:hidden bg-[#141414] px-5 pb-8 pt-5">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#b49a5a]">
              Mise
            </span>
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#888]">{user.name}</span>
                <button
                  onClick={logout}
                  className="rounded-lg border border-[#333] px-3 py-1.5 text-xs text-[#888] hover:border-[#555] hover:text-white transition-colors"
                >
                  Salir
                </button>
              </div>
            )}
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            {displayName}
          </h1>
          <p className="mt-1 text-sm text-[#666]">Panel de control</p>
        </header>

        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center justify-between px-10 py-4 border-b border-[#e8e6e1]">
          <div className="flex items-center gap-3 text-xs text-[#999]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En línea
            </span>
          </div>
          <span className="text-xs text-[#999] tabular-nums">{time}</span>
        </div>

        <div className="px-5 lg:px-10 py-6 lg:py-8">
          {/* Greeting */}
          <div className="mb-8 lg:mb-10">
            <h2 className="font-display text-2xl lg:text-[32px] font-bold text-[#1a1a1a] tracking-tight leading-tight">
              Buen día, {firstName}
            </h2>
            <p className="text-sm text-[#b49a5a] mt-1 capitalize">
              {dateStr}
            </p>
          </div>

          <div className="h-px bg-[#e8e6e1] mb-8 lg:mb-10 hidden lg:block" />

          {/* Module cards - mobile */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            {MODULES.map((mod) => (
              <Link
                key={mod.href}
                href={`/${params.slug}/${mod.href}`}
                className="bg-white border border-[#e8e6e1] rounded-xl p-4 hover:shadow-md transition-all active:scale-[0.98] group"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d4cfc5] text-[#b49a5a] mb-3 group-hover:border-[#b49a5a] transition-colors">
                  {mod.icon}
                </span>
                <span className="text-sm font-semibold text-[#1a1a1a] block">
                  {mod.label}
                </span>
                <span className="text-[11px] text-[#999] mt-0.5 block">
                  {mod.desc}
                </span>
              </Link>
            ))}
          </div>

          {/* Module cards - desktop with ghost numbers */}
          <div className="hidden lg:grid lg:grid-cols-5 gap-4">
            {MODULES.map((mod) => (
              <Link
                key={mod.href}
                href={`/${params.slug}/${mod.href}`}
                className="group relative bg-white border border-[#e8e6e1] rounded-xl p-5 hover:border-[#d4cfc5] hover:shadow-md transition-all overflow-hidden"
              >
                <span className="absolute top-3 right-4 font-display text-[44px] font-bold text-[#f0ede6] select-none leading-none">
                  {mod.num}
                </span>
                <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#d4cfc5] text-[#b49a5a] mb-4 group-hover:border-[#b49a5a] transition-colors">
                  {mod.icon}
                </span>
                <span className="relative text-[15px] font-semibold text-[#1a1a1a] block">
                  {mod.label}
                </span>
                <span className="relative text-xs text-[#999] mt-1 block">
                  {mod.desc}
                </span>
              </Link>
            ))}
          </div>

          {/* Quick access */}
          <div className="mt-8 lg:mt-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#b49a5a] mb-4">
              Accesos rápidos
            </p>
            <div className="space-y-2 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={`/${params.slug}/${link.href}`}
                  className="flex items-center gap-4 bg-white border border-[#e8e6e1] rounded-xl px-5 py-4 hover:border-[#d4cfc5] hover:shadow-sm transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f5f3ee] text-[#999] group-hover:text-[#b49a5a] transition-colors">
                    {link.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[#1a1a1a] block">
                      {link.label}
                    </span>
                    <span className="text-[11px] text-[#999] hidden lg:block">
                      {link.desc}
                    </span>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[#ccc] group-hover:text-[#999] transition-colors flex-shrink-0">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Stats - Resumen de hoy */}
          <div className="mt-8 lg:mt-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#b49a5a] mb-4">
              Resumen de hoy
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {[
                {
                  label: "Mesas ocupadas",
                  value: stats ? String(stats.occupiedTables) : "—",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                  ),
                },
                {
                  label: "Ventas del día",
                  value: stats ? formatPrice(stats.totalSales) : "—",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                  ),
                },
                {
                  label: "Comandas activas",
                  value: stats ? String(stats.activeOrders) : "—",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                      <rect x="9" y="3" width="6" height="4" rx="1" />
                    </svg>
                  ),
                },
                {
                  label: "Ticket promedio",
                  value: stats ? formatPrice(stats.avgTicket) : "—",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6M9 15h6M9 11h6" />
                    </svg>
                  ),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white border border-[#e8e6e1] rounded-xl p-4 lg:p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#999]">
                      {stat.label}
                    </span>
                    <span className="text-[#ccc]">{stat.icon}</span>
                  </div>
                  <span className="font-display text-2xl lg:text-[28px] font-bold text-[#1a1a1a] tabular-nums">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock + Recent orders */}
          <div className="mt-8 lg:mt-10 grid lg:grid-cols-2 gap-6">
            {/* Low stock alerts */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#b49a5a] mb-4">
                Stock bajo
              </p>
              {lowStock.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                  {lowStock.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-900">{item.name}</span>
                      <span className="text-xs font-bold tabular-nums text-amber-700">
                        {item.current_stock} / {item.min_stock} {item.unit}
                      </span>
                    </div>
                  ))}
                  <Link
                    href={`/${params.slug}/admin/inventario`}
                    className="block text-center text-xs font-medium text-amber-700 hover:text-amber-900 pt-2 border-t border-amber-200"
                  >
                    Ver inventario →
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border border-[#e8e6e1] bg-white p-4 text-center">
                  <p className="text-sm text-[#999]">Todo el stock en orden</p>
                </div>
              )}
            </div>

            {/* Recent orders */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#b49a5a] mb-4">
                Últimos pedidos
              </p>
              {recentOrders.length > 0 ? (
                <div className="rounded-xl border border-[#e8e6e1] bg-white divide-y divide-[#f0ede6]">
                  {recentOrders.map((order) => {
                    const statusMap: Record<string, { label: string; color: string }> = {
                      pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700" },
                      in_kitchen: { label: "En cocina", color: "bg-orange-100 text-orange-700" },
                      ready: { label: "Listo", color: "bg-green-100 text-green-700" },
                      delivered: { label: "Entregado", color: "bg-blue-100 text-blue-700" },
                      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
                    };
                    const s = statusMap[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-700" };
                    const ago = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
                    const timeStr = ago < 1 ? "ahora" : ago < 60 ? `${ago}min` : `${Math.floor(ago / 60)}h`;
                    return (
                      <div key={order.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[#1a1a1a] tabular-nums">
                            #{order.order_number}
                          </span>
                          <span className="text-xs text-[#999]">
                            Mesa {order.table?.table_number ?? "?"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium tabular-nums text-[#777]">
                            {formatPrice(Number(order.subtotal))}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.color}`}>
                            {s.label}
                          </span>
                          <span className="text-[10px] text-[#bbb] tabular-nums w-8 text-right">{timeStr}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-[#e8e6e1] bg-white p-4 text-center">
                  <p className="text-sm text-[#999]">Sin pedidos hoy</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="px-5 pb-6 text-center text-[11px] text-[#ccc] tracking-wide lg:hidden">
          Mise · Tu mise en place digital
        </p>
      </div>
    </main>
  );
}
