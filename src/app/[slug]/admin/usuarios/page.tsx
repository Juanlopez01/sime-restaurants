"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { UserRole } from "@/types";

interface StaffUser {
  id: string;
  name: string;
  role: string;
  pin: string;
  is_active: boolean;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: "waiter", label: "Mozo" },
  { value: "kitchen", label: "Cocina" },
  { value: "cashier", label: "Cajero" },
  { value: "admin", label: "Admin" },
];

const ROLE_COLORS: Record<string, string> = {
  waiter: "bg-blue-50 text-blue-700",
  kitchen: "bg-orange-50 text-orange-700",
  cashier: "bg-emerald-50 text-emerald-700",
  admin: "bg-slate-100 text-slate-700",
};

const roleLabel = (role: string) =>
  ROLES.find((r) => r.value === role)?.label || role;

export default function UsuariosPage() {
  const params = useParams<{ slug: string }>();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("waiter");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/${params.slug}/staff`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.staff || []);
        setLoading(false);
      });
  }, [params.slug]);

  async function addUser() {
    if (!newName.trim() || newPin.length < 4) return;
    setError("");
    setSaving(true);

    const res = await fetch(`/api/${params.slug}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), role: newRole, pin: newPin }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setSaving(false);
      return;
    }

    setUsers([...users, data.user]);
    setNewName("");
    setNewPin("");
    setNewRole("waiter");
    setShowForm(false);
    setSaving(false);
  }

  async function toggleActive(userId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setUsers(
      users.map((u) =>
        u.id === userId ? { ...u, is_active: !u.is_active } : u
      )
    );

    await fetch(`/api/${params.slug}/staff`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, is_active: !user.is_active }),
    });
  }

  if (loading) {
    return (
      <main className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      </main>
    );
  }

  return (
    <main className="p-5 lg:p-0 space-y-5 max-w-2xl lg:max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink tracking-tight">Equipo</h2>
          <p className="text-sm text-ink-muted mt-0.5">{users.length} miembros</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary bg-slate-900 hover:bg-slate-800"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nuevo
        </button>
      </div>

      {showForm && (
        <div className="card card-body space-y-3">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <input
            type="text"
            placeholder="Nombre"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="input"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="input"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="PIN (4-6 dígitos)"
              value={newPin}
              onChange={(e) =>
                setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="input"
              inputMode="numeric"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setShowForm(false); setError(""); }}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={addUser}
              disabled={saving || !newName.trim() || newPin.length < 4}
              className="btn-primary flex-1 bg-slate-900 hover:bg-slate-800"
            >
              {saving ? "Guardando..." : "Crear miembro"}
            </button>
          </div>
        </div>
      )}

      {users.length === 0 && !showForm && (
        <div className="card flex flex-col items-center py-12 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-ink-faint">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <p className="text-sm text-ink-muted">
            No hay miembros del equipo. Agregá mozos, cocineros y cajeros.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className={`card flex items-center justify-between px-5 py-4 transition-opacity ${
              !user.is_active ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-ink-muted">
                {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-sm font-medium text-ink">{user.name}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`badge text-[10px] ${ROLE_COLORS[user.role] || "bg-slate-100 text-slate-600"}`}>
                    {roleLabel(user.role)}
                  </span>
                  <span className="text-[11px] text-ink-faint font-mono">
                    PIN {user.pin}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleActive(user.id)}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                user.is_active ? "bg-emerald-500" : "bg-slate-200"
              }`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                user.is_active ? "left-[22px]" : "left-0.5"
              }`} />
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
