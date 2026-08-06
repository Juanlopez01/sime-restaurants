"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function RegistroPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    restaurantName: "",
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setError("");
    setLoading(true);

    const result = await register({
      email: form.email,
      password: form.password,
      name: form.name,
      restaurantName: form.restaurantName,
      phone: form.phone || undefined,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
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
              Creá tu cuenta
            </h1>
            <p className="mt-2 text-sm text-stone-400">
              14 días gratis · Sin tarjeta de crédito
            </p>
          </div>

          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-[#b49a5a]" : "bg-white/10"}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-[#b49a5a]" : "bg-white/10"}`} />
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
                  Datos del restaurante
                </p>

                <div>
                  <label htmlFor="restaurantName" className="block text-xs font-medium text-stone-400 mb-1.5">
                    Nombre del restaurante
                  </label>
                  <input
                    id="restaurantName"
                    type="text"
                    value={form.restaurantName}
                    onChange={(e) => update("restaurantName", e.target.value)}
                    placeholder="Ej: Parrilla Don Pedro"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none focus:ring-1 focus:ring-[#b49a5a]/30 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-stone-400 mb-1.5">
                    Tu nombre
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Nombre y apellido"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none focus:ring-1 focus:ring-[#b49a5a]/30 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-stone-400 mb-1.5">
                    Teléfono
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="+54 11 1234-5678"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none focus:ring-1 focus:ring-[#b49a5a]/30 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#b49a5a] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#c4aa6a] transition-colors mt-2"
                >
                  Siguiente
                </button>
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
                  Datos de acceso
                </p>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-stone-400 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none focus:ring-1 focus:ring-[#b49a5a]/30 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-stone-400 mb-1.5">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-[#b49a5a]/50 focus:outline-none focus:ring-1 focus:ring-[#b49a5a]/30 transition-colors"
                  />
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Al crear tu cuenta aceptás los{" "}
                  <a href="#" className="text-stone-400 hover:text-white transition-colors">
                    Términos de servicio
                  </a>{" "}
                  y la{" "}
                  <a href="#" className="text-stone-400 hover:text-white transition-colors">
                    Política de privacidad
                  </a>.
                </p>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-white/10 px-4 py-3.5 text-sm font-medium text-stone-400 hover:border-white/20 hover:text-white transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-[#b49a5a] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#c4aa6a] disabled:opacity-50 transition-colors"
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
                      "Crear cuenta"
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs text-stone-600">o</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <button className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-stone-300 hover:border-white/15 hover:bg-white/[0.05] transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Registrarse con Google
          </button>

          <p className="mt-8 text-center text-sm text-stone-500">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-[#b49a5a] hover:text-[#c4aa6a] font-medium transition-colors">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
