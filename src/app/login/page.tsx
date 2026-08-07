"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") || undefined;
  const urlError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(
    urlError === "auth"
      ? "Error de autenticación. Intentá de nuevo."
      : urlError === "setup"
        ? "Error al configurar la cuenta."
        : ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password, redirectTo);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setGoogleLoading(true);
    await loginWithGoogle();
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
            <h1 className="font-display text-2xl font-bold text-white">
              Bienvenido de vuelta
            </h1>
            <p className="mt-2 text-sm text-stone-400">
              Ingresá a tu cuenta para gestionar tu restaurante
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-stone-400">
                  Contraseña
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs text-[#b49a5a] hover:text-[#c4aa6a] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
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
                  Ingresando...
                </span>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs text-stone-600">o</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-stone-300 hover:border-white/15 hover:bg-white/[0.05] disabled:opacity-50 transition-colors"
          >
            {googleLoading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continuar con Google
          </button>

          <p className="mt-8 text-center text-sm text-stone-500">
            ¿No tenés cuenta?{" "}
            <Link href="/registro" className="text-[#b49a5a] hover:text-[#c4aa6a] font-medium transition-colors">
              Creá una gratis
            </Link>
          </p>

          <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
            <p className="text-xs text-stone-500">
              ¿Sos mozo o cajero?{" "}
              <Link href="/la-ribera" className="text-stone-400 hover:text-white transition-colors">
                Ingresá con tu PIN →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
