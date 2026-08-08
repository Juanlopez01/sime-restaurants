"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "salon",
    label: "Salón",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    href: "productos",
    label: "Productos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <path d="M3 6h18M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    href: "usuarios",
    label: "Equipo",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: "reportes",
    label: "Reportes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    href: "historial",
    label: "Historial",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "facturacion",
    label: "Facturación",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M9 15h6M9 11h6" />
      </svg>
    ),
  },
  {
    href: "config",
    label: "Configuración",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ slug: string }>();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#fafaf8] lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 bg-[#141414]">
        <div className="flex flex-col flex-1 px-5 pt-7 pb-5">
          <Link
            href={`/${params.slug}`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[#777] hover:text-white hover:bg-white/[0.04] transition-colors group mb-4"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-sm font-medium">Panel principal</span>
          </Link>

          <div className="px-3 mb-6">
            <h1 className="font-display text-base font-bold text-white tracking-tight">
              Administración
            </h1>
            <p className="text-[11px] text-[#555] mt-0.5">Gestión del local</p>
          </div>

          <nav className="flex-1 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const href = `/${params.slug}/admin/${item.href}`;
              const isActive = pathname.includes(item.href);
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/[0.06] text-white"
                      : "text-[#777] hover:bg-white/[0.04] hover:text-[#ccc]"
                  }`}
                >
                  <span className={isActive ? "text-[#b49a5a]" : "text-[#555]"}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[260px] flex-1">
        {/* Mobile header + nav */}
        <header className="lg:hidden bg-[#141414] px-5 py-4 flex items-center gap-4">
          <Link
            href={`/${params.slug}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-[#888] hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-white tracking-tight">
            Administración
          </h1>
        </header>

        <nav className="lg:hidden flex gap-1 overflow-x-auto bg-white px-4 py-2.5 border-b border-[#e8e6e1] scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const href = `/${params.slug}/admin/${item.href}`;
            const isActive = pathname.includes(item.href);
            return (
              <Link
                key={item.href}
                href={href}
                className={`flex items-center gap-1.5 flex-shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#141414] text-white"
                    : "text-[#999] hover:bg-[#f5f3ee] hover:text-[#1a1a1a]"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop top bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-[#e8e6e1]">
          <h2 className="text-lg font-bold text-[#1a1a1a] tracking-tight">
            {NAV_ITEMS.find((item) => pathname.includes(item.href))?.label ??
              "Administración"}
          </h2>
        </header>

        <div className="lg:px-8 lg:py-6">{children}</div>
      </div>
    </div>
  );
}
