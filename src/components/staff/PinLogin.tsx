"use client";

import { useState } from "react";
import { useStaff } from "@/contexts/staff-context";

const ROLE_LABELS: Record<string, string> = {
  owner: "Dueño",
  admin: "Admin",
  waiter: "Mozo",
  kitchen: "Cocina",
  cashier: "Cajero",
};

export function PinLogin({ module }: { module: string }) {
  const { login } = useStaff();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (pin.length < 4) return;
    setError("");
    setLoading(true);
    const result = await login(pin);
    if (result.error) {
      setError(result.error);
      setPin("");
    }
    setLoading(false);
  }

  function handleKey(digit: string) {
    if (pin.length >= 6) return;
    const next = pin + digit;
    setPin(next);
    setError("");
  }

  function handleDelete() {
    setPin((p) => p.slice(0, -1));
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
      <div className="w-full max-w-xs text-center">
        <div className="mb-8">
          <p className="text-[#b49a5a] text-xs font-semibold uppercase tracking-[0.2em] mb-2">
            {module}
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            Ingresá tu PIN
          </h1>
          <p className="text-sm text-[#666] mt-2">
            Usá tu PIN de 4 dígitos para identificarte
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-6 h-12">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full transition-all duration-150 ${
                i < pin.length
                  ? "bg-[#b49a5a] scale-125"
                  : "bg-white/10"
              }`}
            />
          ))}
          {pin.length > 4 &&
            [4, 5].map((i) =>
              i < pin.length ? (
                <div key={i} className="h-3 w-3 rounded-full bg-[#b49a5a] scale-125 transition-all duration-150" />
              ) : null
            )}
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4 animate-[shake_0.3s_ease-in-out]">
            {error}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              onClick={() => handleKey(d)}
              disabled={loading}
              className="h-16 rounded-xl bg-white/[0.06] text-white text-xl font-semibold hover:bg-white/[0.12] active:bg-white/[0.16] transition-colors disabled:opacity-50"
            >
              {d}
            </button>
          ))}
          <button
            onClick={handleDelete}
            disabled={loading || pin.length === 0}
            className="h-16 rounded-xl bg-white/[0.04] text-[#666] text-sm font-medium hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors disabled:opacity-30"
          >
            Borrar
          </button>
          <button
            onClick={() => handleKey("0")}
            disabled={loading}
            className="h-16 rounded-xl bg-white/[0.06] text-white text-xl font-semibold hover:bg-white/[0.12] active:bg-white/[0.16] transition-colors disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || pin.length < 4}
            className="h-16 rounded-xl bg-[#b49a5a] text-white text-sm font-bold hover:bg-[#c4aa6a] active:bg-[#9a8348] transition-colors disabled:opacity-30"
          >
            {loading ? "..." : "OK"}
          </button>
        </div>
      </div>
    </main>
  );
}

export function StaffBadge({ onLogout }: { onLogout: () => void }) {
  const { staff } = useStaff();
  if (!staff) return null;

  return (
    <button
      onClick={onLogout}
      className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-[#888] hover:text-white transition-colors group"
      title="Cambiar usuario"
    >
      <span className="font-medium">{staff.name}</span>
      <span className="text-[#555] group-hover:text-[#888]">
        {ROLE_LABELS[staff.role] ?? staff.role}
      </span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  );
}
