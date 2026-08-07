"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await resetPassword(email);

    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
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
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#b49a5a]/10">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-[#b49a5a]">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              </div>
              <h1 className="font-display text-2xl font-bold text-white">
                Email enviado
              </h1>
              <p className="mt-3 text-sm text-stone-400 leading-relaxed">
                Te enviamos un link a <span className="text-white font-medium">{email}</span> para
                restablecer tu contraseña. Revisá tu bandeja de entrada y spam.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-block rounded-xl bg-[#b49a5a] px-6 py-3 text-sm font-bold text-white hover:bg-[#c4aa6a] transition-colors"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold text-white">
                  Recuperar contraseña
                </h1>
                <p className="mt-2 text-sm text-stone-400">
                  Ingresá tu email y te enviaremos un link para restablecer tu contraseña
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-stone-400 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@restaurante.com"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none focus:ring-1 focus:ring-[#b49a5a]/30 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#b49a5a] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#c4aa6a] disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    "Enviar link de recuperación"
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-stone-500">
                <Link href="/login" className="text-[#b49a5a] hover:text-[#c4aa6a] font-medium transition-colors">
                  Volver al login
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
