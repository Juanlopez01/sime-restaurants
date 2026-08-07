"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CrearRestaurantePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/create-restaurant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error al crear el restaurante");
      setLoading(false);
      return;
    }

    router.push(data.redirectTo || "/");
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col">
      <nav className="px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-display font-bold text-white tracking-wide">
            Mise
          </span>
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#b49a5a] font-medium mt-0.5">
            en place
          </span>
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#b49a5a]/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-[#b49a5a]">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              Configurá tu restaurante
            </h1>
            <p className="mt-2 text-sm text-stone-400">
              Solo falta un paso para empezar
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-stone-400 mb-1.5">
                Nombre del restaurante
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Parrilla Don Pedro"
                required
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none focus:ring-1 focus:ring-[#b49a5a]/30 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-stone-400 mb-1.5">
                Teléfono (opcional)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none focus:ring-1 focus:ring-[#b49a5a]/30 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full rounded-xl bg-[#b49a5a] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#c4aa6a] disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creando...
                </span>
              ) : (
                "Crear restaurante"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
