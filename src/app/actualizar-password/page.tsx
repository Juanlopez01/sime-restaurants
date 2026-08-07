"use client";

import Link from "next/link";
import { useState } from "react";

export default function ActualizarPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setDone(true);
      }
    } catch {
      setError("Error al actualizar la contraseña");
    }
    setLoading(false);
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
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-emerald-500">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 className="font-display text-2xl font-bold text-white">
                Contraseña actualizada
              </h1>
              <p className="mt-3 text-sm text-stone-400">
                Tu contraseña fue actualizada correctamente.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-block rounded-xl bg-[#b49a5a] px-6 py-3 text-sm font-bold text-white hover:bg-[#c4aa6a] transition-colors"
              >
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold text-white">
                  Nueva contraseña
                </h1>
                <p className="mt-2 text-sm text-stone-400">
                  Elegí una contraseña nueva para tu cuenta
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-stone-400 mb-1.5">
                    Nueva contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none focus:ring-1 focus:ring-[#b49a5a]/30 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="confirm" className="block text-xs font-medium text-stone-400 mb-1.5">
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repetí tu contraseña"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none focus:ring-1 focus:ring-[#b49a5a]/30 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#b49a5a] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#c4aa6a] disabled:opacity-50 transition-colors mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Actualizando...
                    </span>
                  ) : (
                    "Actualizar contraseña"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
