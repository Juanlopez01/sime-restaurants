"use client";

import Link from "next/link";
import { useState } from "react";

const FEATURES = [
  {
    icon: "📋",
    title: "Comanda Digital",
    desc: "Tus mozos toman pedidos desde el celular. Sin papeles, sin errores, directo a cocina.",
  },
  {
    icon: "🔥",
    title: "Pantalla de Cocina",
    desc: "Los pedidos llegan en tiempo real. Tu cocina organizada con tiempos y prioridades.",
  },
  {
    icon: "💰",
    title: "Caja Inteligente",
    desc: "Cobrá con efectivo, tarjeta, MercadoPago o transferencia. Todo en un solo lugar.",
  },
  {
    icon: "📱",
    title: "Menú QR",
    desc: "Carta digital actualizada al instante. Tus clientes escanean y ven precios reales.",
  },
  {
    icon: "🗺️",
    title: "Mapa de Salón",
    desc: "Armá tu salón visual, asigná mesas a mozos y controlá el estado en tiempo real.",
  },
  {
    icon: "📊",
    title: "Facturación ARCA",
    desc: "Facturación electrónica integrada. Elegí cuánto facturar al cierre de cada día.",
  },
];

const PLANS = [
  {
    name: "Inicio",
    price: "29.900",
    period: "/mes",
    desc: "Para restaurantes que arrancan",
    features: [
      "Hasta 15 mesas",
      "Comanda + Cocina + Caja",
      "Menú QR ilimitado",
      "1 usuario admin",
      "Soporte por email",
    ],
    cta: "Empezar gratis 14 días",
    highlighted: false,
  },
  {
    name: "Profesional",
    price: "59.900",
    period: "/mes",
    desc: "Para restaurantes en crecimiento",
    features: [
      "Mesas ilimitadas",
      "Todos los módulos",
      "Facturación ARCA",
      "Usuarios ilimitados",
      "Soporte prioritario",
      "Reportes avanzados",
    ],
    cta: "Empezar gratis 14 días",
    highlighted: true,
  },
  {
    name: "Empresa",
    price: "Personalizado",
    period: "",
    desc: "Para cadenas y franquicias",
    features: [
      "Multi-sucursal",
      "API personalizada",
      "Integraciones a medida",
      "Account manager dedicado",
      "SLA garantizado",
    ],
    cta: "Contactar ventas",
    highlighted: false,
  },
];

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0d14]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-display font-bold text-white tracking-wide">
            Mise
          </span>
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#b49a5a] font-medium mt-1">
            en place
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-stone-400 hover:text-white transition-colors">
            Funcionalidades
          </a>
          <a href="#pricing" className="text-sm text-stone-400 hover:text-white transition-colors">
            Precios
          </a>
          <Link
            href="/login"
            className="text-sm text-stone-300 hover:text-white transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="rounded-full bg-[#b49a5a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c4aa6a] transition-colors"
          >
            Probalo gratis
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white touch-target"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0d14] px-6 py-4 space-y-3">
          <a href="#features" onClick={() => setMenuOpen(false)} className="block text-sm text-stone-400 py-2">
            Funcionalidades
          </a>
          <a href="#pricing" onClick={() => setMenuOpen(false)} className="block text-sm text-stone-400 py-2">
            Precios
          </a>
          <Link href="/login" className="block text-sm text-stone-300 py-2">
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="block rounded-full bg-[#b49a5a] px-5 py-3 text-sm font-semibold text-white text-center"
          >
            Probalo gratis
          </Link>
        </div>
      )}
    </nav>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-white">
      <NavBar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(202,138,4,0.08)_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b49a5a]/20 bg-[#b49a5a]/5 px-4 py-1.5 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-[#b49a5a] animate-pulse" />
            <span className="text-xs font-medium text-[#c4aa6a]">
              14 días gratis · Sin tarjeta de crédito
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl md:leading-[1.1]">
            Tu restaurante,{" "}
            <span className="text-[#b49a5a]">en orden perfecto</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-400 leading-relaxed md:text-xl">
            Comandas, cocina, caja, menú QR y facturación en una sola plataforma.
            Diseñado para la gastronomía argentina.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/registro"
              className="w-full sm:w-auto rounded-full bg-[#b49a5a] px-8 py-4 text-base font-bold text-white hover:bg-[#c4aa6a] transition-colors shadow-lg shadow-[#b49a5a]/20"
            >
              Empezar gratis
            </Link>
            <Link
              href="/la-ribera/menu"
              className="w-full sm:w-auto rounded-full border border-white/10 px-8 py-4 text-base font-medium text-stone-300 hover:border-white/20 hover:text-white transition-colors"
            >
              Ver demo en vivo
            </Link>
          </div>

          <p className="mt-6 text-xs text-stone-600">
            Funciona en celular, tablet y PC · No requiere instalación
          </p>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-6 py-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-center">
          <div>
            <p className="text-2xl font-bold tabular-nums text-white">+150</p>
            <p className="text-xs text-stone-500">Restaurantes activos</p>
          </div>
          <div className="hidden sm:block h-8 w-px bg-white/10" />
          <div>
            <p className="text-2xl font-bold tabular-nums text-white">50.000+</p>
            <p className="text-xs text-stone-500">Pedidos por mes</p>
          </div>
          <div className="hidden sm:block h-8 w-px bg-white/10" />
          <div>
            <p className="text-2xl font-bold tabular-nums text-white">99.9%</p>
            <p className="text-xs text-stone-500">Uptime garantizado</p>
          </div>
          <div className="hidden sm:block h-8 w-px bg-white/10" />
          <div>
            <p className="text-2xl font-bold tabular-nums text-white">⭐ 4.9</p>
            <p className="text-xs text-stone-500">Calificación promedio</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b49a5a] mb-3">
              Funcionalidades
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Todo lo que tu restaurante necesita
            </h2>
            <p className="mt-4 text-stone-400 max-w-xl mx-auto">
              Desde la comanda hasta la facturación, cada módulo diseñado para que tu operación sea más rápida y rentable.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-[#b49a5a]/20 hover:bg-[#b49a5a]/[0.03] transition-all duration-300"
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-4 text-lg font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-stone-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b49a5a] mb-3">
              Cómo funciona
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Listo en 5 minutos
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Creá tu cuenta",
                desc: "Registrate gratis y cargá los datos de tu restaurante, menú y mesas.",
              },
              {
                step: "02",
                title: "Configurá tu equipo",
                desc: "Agregá mozos, cocina y cajeros con PINs individuales. Sin apps que instalar.",
              },
              {
                step: "03",
                title: "Empezá a operar",
                desc: "Tus mozos toman pedidos, la cocina los recibe y la caja cobra. Todo sincronizado.",
              },
            ].map((s) => (
              <div key={s.step} className="text-center md:text-left">
                <span className="inline-block text-4xl font-display font-bold text-[#b49a5a]/30">
                  {s.step}
                </span>
                <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-stone-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b49a5a] mb-3">
              Precios
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Simple y transparente
            </h2>
            <p className="mt-4 text-stone-400">
              Sin contratos · Cancelá cuando quieras · Precios en ARS + IVA
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col ${
                  plan.highlighted
                    ? "border-[#b49a5a]/40 bg-[#b49a5a]/[0.04] shadow-lg shadow-[#b49a5a]/5 ring-1 ring-[#b49a5a]/20"
                    : "border-white/5 bg-white/[0.02]"
                }`}
              >
                {plan.highlighted && (
                  <span className="self-start rounded-full bg-[#b49a5a] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white mb-4">
                    Más popular
                  </span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-stone-400 mt-1">{plan.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  {plan.price !== "Personalizado" && (
                    <span className="text-sm text-stone-500">$</span>
                  )}
                  <span className="text-3xl font-bold tabular-nums">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-stone-500">{plan.period}</span>
                  )}
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-stone-300">
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b49a5a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/registro"
                  className={`mt-6 block rounded-full px-6 py-3 text-center text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-[#b49a5a] text-white hover:bg-[#c4aa6a]"
                      : "border border-white/10 text-white hover:border-white/20"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Llevá tu restaurante al{" "}
            <span className="text-[#b49a5a]">siguiente nivel</span>
          </h2>
          <p className="mt-4 text-stone-400 text-lg">
            Sumate a los restaurantes que ya gestionan todo desde Mise.
            14 días gratis, sin compromisos.
          </p>
          <Link
            href="/registro"
            className="mt-8 inline-block rounded-full bg-[#b49a5a] px-10 py-4 text-base font-bold text-white hover:bg-[#c4aa6a] transition-colors shadow-lg shadow-[#b49a5a]/20"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#070a10]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <span className="text-xl font-display font-bold text-white">Mise</span>
              <p className="mt-3 text-sm text-stone-500 leading-relaxed">
                Sistema de gestión integral para la gastronomía argentina.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                Producto
              </p>
              <ul className="space-y-2 text-sm text-stone-400">
                <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Precios</a></li>
                <li><Link href="/la-ribera/menu" className="hover:text-white transition-colors">Demo en vivo</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                Empresa
              </p>
              <ul className="space-y-2 text-sm text-stone-400">
                <li><a href="#" className="hover:text-white transition-colors">Sobre nosotros</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                Legal
              </p>
              <ul className="space-y-2 text-sm text-stone-400">
                <li><a href="#" className="hover:text-white transition-colors">Términos de servicio</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
            <p className="text-xs text-stone-600">
              © 2026 Mise. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-stone-600 hover:text-stone-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-stone-600 hover:text-stone-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="text-stone-600 hover:text-stone-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
